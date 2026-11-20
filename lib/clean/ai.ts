import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { TermType } from "../types";

export const aiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

export interface AiEntity {
  text: string;
  type: TermType;
  replacement: string;
  reason: string;
}

const SYSTEM = `You prepare real client project documents (proposals, case studies, design files) for resale as anonymised software product blueprints.

Your job: list every string in the document that could identify the client, the end product's brand, the agency that wrote it, or a real person or organisation involved, so it can be replaced.

Flag:
- client: client company / organisation names, including abbreviations and legal names (Pty Ltd, Ltd, LLC)
- product: the client's product, app, platform or brand names, and names reused from other client projects
- person: names of real people (clients, stakeholders, staff who prepared or reviewed the document)
- agency: the software agency / vendor that wrote the document and its sub-brands
- address: street addresses, office locations tied to the client
- email, phone, url, id_number: contact details, websites, app-store links, company/tax numbers
- other: anything else uniquely identifying (internal codenames, ticket numbers, client-specific figures presented as real results)

Do NOT flag: generic industry or feature words, technology and platform names used as integrations (Flutter, .NET, AWS, Stripe, Xero, Google Maps, Twilio, Firebase, WordPress), countries, cities used generically, job titles, or dates.

Rules:
- "text" must be copied exactly as it appears in the document (same spelling and case), shortest form that still identifies (e.g. "Acme Health" not the whole sentence).
- "replacement" is a neutral, readable stand-in that keeps the sentence natural: "the Client", "the Platform", "Client Representative", "the Development Team", "example.com", etc. Use a consistent replacement for the same entity.
- "reason" is a few words on why it identifies someone.
- Return each distinct string once.`;

const SCHEMA = {
  type: "object",
  properties: {
    entities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          type: { type: "string", enum: ["client", "product", "person", "agency", "email", "phone", "url", "address", "id_number", "other"] },
          replacement: { type: "string" },
          reason: { type: "string" },
        },
        required: ["text", "type", "replacement", "reason"],
        additionalProperties: false,
      },
    },
  },
  required: ["entities"],
  additionalProperties: false,
} as const;

/** ~100k characters per request keeps each call well inside limits; long documents are split, never truncated. */
const CHUNK = 100_000;

export async function extractEntitiesWithAi(text: string, context: { project?: string; knownTerms: string[] }): Promise<AiEntity[]> {
  const client = new Anthropic();
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK) chunks.push(text.slice(i, i + CHUNK));

  const all = new Map<string, AiEntity>();
  for (const [i, chunk] of chunks.entries()) {
    const intro =
      `Project (as filed by the admin): ${context.project || "unknown"}\n` +
      `Already in the dictionary (still list them if present, plus anything else): ${context.knownTerms.slice(0, 200).join("; ") || "none"}\n` +
      (chunks.length > 1 ? `This is part ${i + 1} of ${chunks.length} of the document.\n` : "");

    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: intro },
            { type: "text", text: `<document>\n${chunk}\n</document>` },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") throw new Error("The AI pass declined this document; dictionary and pattern cleaning still ran.");
    if (response.stop_reason === "max_tokens") throw new Error("The AI pass ran out of output space on this document.");
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") continue;
    const parsed = JSON.parse(textBlock.text) as { entities: AiEntity[] };
    for (const e of parsed.entities) {
      const t = e.text.trim();
      if (t.length < 2) continue;
      if (!all.has(t.toLowerCase())) all.set(t.toLowerCase(), { ...e, text: t });
    }
  }
  return [...all.values()];
}

// ---------------------------------------------------------------------------
// Project matching tie-breaker

export interface AiProjectPick {
  projectId: string | null;
  productName: string;
  confidence: "high" | "medium" | "low";
  reason: string;
}

const PICK_SCHEMA = {
  type: "object",
  properties: {
    projectId: { type: ["string", "null"] },
    productName: { type: "string" },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    reason: { type: "string" },
  },
  required: ["projectId", "productName", "confidence", "reason"],
  additionalProperties: false,
} as const;

/**
 * Decide which catalog project a document belongs to. Only used for files the
 * rule-based matcher couldn't settle. The project list is sorted and stable so
 * it caches across calls in a batch.
 */
export async function pickProjectWithAi(input: { label: string; head: string }, projects: Array<{ id: string; name: string; industry?: string; summary?: string }>, shortlist: string[]): Promise<AiProjectPick> {
  const client = new Anthropic();
  const catalog = projects
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((p) => `${p.id} | ${p.name}${p.industry ? ` | ${p.industry}` : ""}${p.summary ? ` | ${p.summary.slice(0, 160)}` : ""}`)
    .join("\n");
  const response = await client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: { type: "json_schema", schema: PICK_SCHEMA } },
    system: [
      {
        type: "text",
        text:
          "You match a software agency's documents (proposals, case studies, design files) to the project they belong to.\n" +
          "Use the product/app name on the title page first; treat names that appear only deep in the text with suspicion, because documents are often copied from an earlier client's template.\n" +
          "Return projectId from the catalog, or null if none clearly fits. productName is the product the document is about, as named in it. Never guess an id that is not in the catalog.\n\n" +
          `Catalog (id | name | industry | summary):\n${catalog}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `File: ${input.label}\nRule-based shortlist (best first): ${shortlist.join(", ") || "none"}\n\n<title_pages>\n${input.head.slice(0, 6000)}\n</title_pages>`,
      },
    ],
  });
  if (response.stop_reason === "refusal") throw new Error("AI matching declined this file");
  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("AI matching returned nothing");
  const pick = JSON.parse(block.text) as AiProjectPick;
  if (pick.projectId && !projects.some((p) => p.id === pick.projectId)) pick.projectId = null;
  return pick;
}
