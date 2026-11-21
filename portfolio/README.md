# BuildAtlas portfolio site

A one-page portfolio for the BuildAtlas design collection: hero showcase, filterable featured work with a project detail view, industries, a "what's inside a project" preview, about, contact and footer.

React + TypeScript + Tailwind CSS v4 + Lucide icons, built with Vite. A static site: no server, no database, no tracking.

## Run it locally

```bash
cd portfolio
npm install
npm run dev        # http://localhost:5173
```

Production build (what gets published):

```bash
npm run build      # writes dist/
npm run preview    # serves dist/ at http://localhost:4173
```

## Replace the sample content with your projects

Everything you edit lives in **`src/data/projects.ts`**. The UI reads from it; you don't need to touch the components.

1. **Edit a project** in the `PROJECTS` array: `title`, `industry`, `platforms`, `summary`, `overview`, `roles`, `features`, `workflows`.
2. **Add real screenshots** (approved and anonymised only):
   - put the images in `public/projects/<project-id>/`, e.g. `public/projects/property-ops/dashboard.png`
   - in `screens`, replace the mock entries with
     `{ kind: "image", src: "/projects/property-ops/dashboard.png", device: "desktop", caption: "Portfolio dashboard" }`
     (`device: "mobile"` for phone screens; use a tall 9:19 image).
   - recommended sizes: desktop 1600×1000 (16:10), mobile 760×1604 (9:19), PNG or WebP.
3. **Set `isPlaceholder: false`** once the project uses real content. That removes the "Illustrative" labels.
4. **Resources:** set `resources.design / caseStudy / requirements` to what really exists for the project, and add `caseStudy` / `requirements` (title, summary, optional `url`) and `figmaUrl` only when you are allowed to share them.
5. **Collection size** in the hero: edit `COLLECTION` (shown as approximate).
6. **Contact email:** change `CONTACT_EMAIL` in `src/components/Contact.tsx`. The form opens the visitor's email app; to collect messages on a server instead, point the form at a service such as Formspree.
7. **New industry or platform:** add it to `INDUSTRIES` / `PLATFORMS` (and an icon in `src/components/Industries.tsx`).

To add a project, copy one object in `PROJECTS`, give it a new `id`, and edit it. The drawn previews (`kind: "mock"`) come in six variants: `property`, `healthcare`, `warehouse`, `agent`, `sports`, `vehicle`.

## Publish it (Vercel, free)

1. Push this repository to GitHub (already done if you `git pull` it).
2. Go to <https://vercel.com/new>, sign in with GitHub and **Import** the `buildatlas` repository.
3. In the import screen, set **Root Directory** to `portfolio`. Framework preset **Vite** is detected; build command `npm run build`, output `dist` (also set in `vercel.json`).
4. Click **Deploy**. You get a URL like `buildatlas-portfolio.vercel.app` to share; every push to `main` redeploys automatically.
5. Optional: **Settings → Domains** to add your own domain.

Alternatives: Netlify (base directory `portfolio`, build `npm run build`, publish `portfolio/dist`), Cloudflare Pages (same settings) or GitHub Pages (upload `dist/`).

## Notes

- Sample projects are generic product types with drawn previews, clearly labelled "Illustrative". No client names, testimonials, sales figures or partnerships are shown.
- The site never loads client files; it only shows what you put in `projects.ts` and `public/`.
- Accessibility: keyboard-navigable filters, tabs (arrow keys) and dialog (focus trapped, Escape closes), visible focus rings, reduced-motion support, AA contrast on text.
