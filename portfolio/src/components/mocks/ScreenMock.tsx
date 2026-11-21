/**
 * Drawn, illustrative product screens used until real screenshots are supplied.
 * They are original drawings: generic layouts, no client names, no real data.
 */
import type { MockVariant } from "../../data/projects";
import { Bar, Card, Chip, Dot, Kpi, PhoneHeader, Row, Sidebar, Spark, TabBar, TopBar } from "./primitives";

import { Scaled } from "../Scaled";

export function DesktopMock({ variant }: { variant: MockVariant }) {
  return (
    <Scaled width={640} height={400}>
    <div className="flex h-full w-full bg-ink-850 text-left">
      {
        {
          property: <PropertyDesktop />,
          healthcare: <HealthcareDesktop />,
          warehouse: <WarehouseDesktop />,
          agent: <AgentDesktop />,
          sports: <SportsDesktop />,
          vehicle: <VehicleDesktop />,
        }[variant]
      }
    </div>
    </Scaled>
  );
}

export function MobileMock({ variant }: { variant: MockVariant }) {
  return (
    <Scaled width={190} height={401}>
    <div className="flex h-full w-full flex-col bg-ink-850 pt-8 text-left">
      {
        {
          property: <PropertyMobile />,
          healthcare: <HealthcareMobile />,
          warehouse: <WarehouseMobile />,
          agent: <AgentMobile />,
          sports: <SportsMobile />,
          vehicle: <VehicleMobile />,
        }[variant]
      }
    </div>
    </Scaled>
  );
}

/* ------------------------------------------------------------------ property */

function PropertyDesktop() {
  return (
    <>
      <Sidebar brand="Estates" items={["Portfolio", "Properties", "Maintenance", "Tenancies", "Owners", "Compliance", "Reports"]} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title="Portfolio overview" right={<Chip tone="sky">This month</Chip>} />
        <div className="grid grid-cols-4 gap-1.5 p-2">
          <Kpi label="Occupancy" value="96.4%" delta="+1.2" />
          <Kpi label="Rent collected" value="$412k" delta="+3.8%" />
          <Kpi label="Arrears" value="$18.2k" delta="-6%" tone="sky" />
          <Kpi label="Open jobs" value="37" delta="9 urgent" tone="rose" />
        </div>
        <div className="grid flex-1 grid-cols-5 gap-1.5 px-2 pb-2">
          <Card title="Rent collected vs expected" className="col-span-3 flex flex-col">
            <div className="min-h-0 flex-1">
              <Spark values={[42, 48, 46, 55, 58, 54, 63, 67, 64, 72, 78, 82]} />
            </div>
          </Card>
          <Card title="Maintenance" className="col-span-2">
            {[["Leaking tap, Unit 4B", "amber", "Assigned"], ["Smoke alarm check", "rose", "Overdue"], ["Gate motor fault", "sky", "Quoted"], ["Repaint hallway", "teal", "Done"]].map(([t, tone, s]) => (
              <div key={t} className="flex items-center justify-between border-b border-white/[0.04] py-1 text-[7.5px] text-slate-400 last:border-0">
                <span className="flex items-center gap-1.5"><Dot tone={tone as "amber"} />{t}</span>
                <Chip tone={tone as "amber"}>{s}</Chip>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}

function PropertyMobile() {
  return (
    <>
      <PhoneHeader sub="Tuesday · 6 jobs" title="My jobs" />
      <div className="mt-2 flex gap-1.5 px-3">
        <Chip tone="sky">Today</Chip>
        <Chip>This week</Chip>
        <Chip>Done</Chip>
      </div>
      <div className="mt-2 space-y-1.5 px-3">
        {[["Leaking tap", "Unit 4B · 9:30", "amber"], ["Smoke alarm check", "12 Elm St · 11:00", "rose"], ["Gate motor", "Block C · 14:15", "sky"]].map(([t, s, tone]) => (
          <div key={t} className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-medium text-slate-100">{t}</span>
              <Dot tone={tone as "amber"} />
            </div>
            <div className="mt-0.5 text-[7.5px] text-slate-500">{s}</div>
            <div className="mt-1.5 flex gap-1"><div className="h-6 w-6 rounded bg-white/[0.06]" /><div className="h-6 w-6 rounded bg-white/[0.06]" /><div className="h-6 flex-1 rounded bg-sky-500/90 text-center text-[7.5px] font-medium leading-6 text-white">Start job</div></div>
          </div>
        ))}
      </div>
      <TabBar />
    </>
  );
}

/* ------------------------------------------------------------------ healthcare */

function HealthcareDesktop() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const shifts: Array<[number, number, number, string]> = [
    [0, 0, 2, "sky"], [1, 1, 3, "teal"], [2, 0, 1, "violet"], [3, 2, 4, "sky"], [4, 1, 2, "teal"], [0, 3, 5, "amber"], [2, 3, 5, "sky"], [4, 3, 4, "violet"],
  ];
  return (
    <>
      <Sidebar brand="CareHub" items={["Roster", "Participants", "Workers", "Incidents", "Notes", "Compliance"]} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title="Weekly roster" right={<Chip tone="teal">142 shifts</Chip>} />
        <div className="flex min-h-0 flex-1 gap-1.5 p-2">
          <Card className="flex min-w-0 flex-1 flex-col">
            <div className="grid grid-cols-5 gap-1 text-[7px] text-slate-500">
              {days.map((d) => <div key={d} className="text-center">{d}</div>)}
            </div>
            <div className="relative mt-1 grid flex-1 grid-cols-5 gap-1">
              {days.map((d) => <div key={d} className="rounded bg-white/[0.02]" />)}
              {shifts.map(([col, start, end, tone], i) => (
                <div key={i} className={`absolute rounded px-1 py-0.5 text-[6.5px] font-medium text-slate-900 ${tone === "sky" ? "bg-sky-300" : tone === "teal" ? "bg-teal-300" : tone === "violet" ? "bg-violet-300" : "bg-amber-300"}`}
                  style={{ left: `calc(${col * 20}% + 2px)`, width: "calc(20% - 6px)", top: `${start * 18 + 2}%`, height: `${(end - start) * 18 - 3}%` }}>
                  Shift {i + 1}
                </div>
              ))}
            </div>
          </Card>
          <div className="flex w-[30%] flex-col gap-1.5">
            <Card title="Incidents">
              {[["Fall reported", "rose", "High"], ["Medication query", "amber", "Med"], ["Late check-in", "slate", "Low"]].map(([t, tone, s]) => (
                <div key={t} className="flex items-center justify-between py-0.5 text-[7.5px] text-slate-400"><span className="flex items-center gap-1"><Dot tone={tone as "rose"} />{t}</span><Chip tone={tone as "rose"}>{s}</Chip></div>
              ))}
            </Card>
            <Card title="Certifications due" className="flex-1">
              <Bar w="80%" /><Bar w="55%" className="mt-1.5" /><Bar w="68%" className="mt-1.5" />
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

function HealthcareMobile() {
  return (
    <>
      <PhoneHeader sub="Next shift in 25 min" title="Today" />
      <div className="mx-3 mt-2 rounded-lg bg-gradient-to-br from-sky-500/25 to-sky-500/5 p-2 ring-1 ring-sky-400/20">
        <div className="text-[7.5px] text-sky-200">09:00 – 12:00 · Community access</div>
        <div className="mt-0.5 text-[10px] font-semibold text-white">Participant visit</div>
        <div className="mt-1.5 h-5 rounded bg-sky-400 text-center text-[7.5px] font-medium leading-5 text-ink-900">Check in</div>
      </div>
      <div className="mt-2 space-y-1 px-3">
        {["Progress note", "Report incident", "Shift checklist"].map((t) => (
          <div key={t} className="flex items-center justify-between rounded-md bg-white/[0.03] px-2 py-1.5 text-[8px] text-slate-300 ring-1 ring-white/[0.05]">{t}<span className="text-slate-600">›</span></div>
        ))}
      </div>
      <TabBar active={1} />
    </>
  );
}

/* ------------------------------------------------------------------ warehouse */

function WarehouseDesktop() {
  return (
    <>
      <Sidebar brand="Stockyard" items={["Overview", "Inventory", "Receiving", "Requisitions", "Dispatch", "Suppliers"]} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title="Operations" right={<Chip tone="sky">3 sites</Chip>} />
        <div className="grid grid-cols-4 gap-1.5 p-2">
          <Kpi label="Fill rate" value="98.1%" delta="+0.4" />
          <Kpi label="Picks today" value="1,284" delta="+12%" />
          <Kpi label="Low stock" value="23" delta="SKUs" tone="rose" />
          <Kpi label="On-time" value="94%" delta="+2" />
        </div>
        <div className="grid flex-1 grid-cols-5 gap-1.5 px-2 pb-2">
          <Card title="Zone utilisation" className="col-span-2">
            <div className="grid grid-cols-6 gap-[3px]">
              {Array.from({ length: 36 }).map((_, i) => {
                const v = [12, 30, 55, 70, 88, 96][(i * 7) % 6];
                return <div key={i} className="aspect-square rounded-[2px]" style={{ background: `rgb(56 189 248 / ${v / 110})` }} />;
              })}
            </div>
          </Card>
          <Card title="Dispatch queue" className="col-span-3">
            <Row widths={["28%", "26%", "22%", "24%"]} cells={["REQ-2041", "Site North", "14 items", <Chip tone="teal">Picked</Chip>]} />
            <Row widths={["28%", "26%", "22%", "24%"]} cells={["REQ-2042", "Site East", "6 items", <Chip tone="sky">Picking</Chip>]} />
            <Row widths={["28%", "26%", "22%", "24%"]} cells={["REQ-2043", "Site West", "31 items", <Chip tone="amber">Approval</Chip>]} />
            <Row widths={["28%", "26%", "22%", "24%"]} cells={["REQ-2044", "Site North", "3 items", <Chip>Queued</Chip>]} />
          </Card>
        </div>
      </div>
    </>
  );
}

function WarehouseMobile() {
  return (
    <>
      <PhoneHeader sub="REQ-2042 · Site East" title="Pick list" />
      <div className="mx-3 mt-2 grid h-16 place-items-center rounded-lg border border-dashed border-sky-400/40 bg-sky-400/5">
        <div className="h-[2px] w-3/4 bg-sky-400/80 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
      </div>
      <div className="mt-2 space-y-1 px-3">
        {[["Bin A-03-2", "Cable ties ×40", true], ["Bin B-11-4", "Anchor bolts ×120", true], ["Bin C-02-1", "Sealant ×6", false]].map(([b, t, done]) => (
          <div key={b as string} className="flex items-center gap-2 rounded-md bg-white/[0.03] px-2 py-1.5 ring-1 ring-white/[0.05]">
            <span className={`grid h-3 w-3 place-items-center rounded-full text-[6px] ${done ? "bg-teal-400 text-ink-900" : "ring-1 ring-white/20"}`}>{done ? "✓" : ""}</span>
            <div><div className="text-[8px] text-slate-200">{t as string}</div><div className="font-mono text-[6.5px] text-slate-500">{b as string}</div></div>
          </div>
        ))}
      </div>
      <TabBar active={2} />
    </>
  );
}

/* ------------------------------------------------------------------ AI agent */

function AgentDesktop() {
  return (
    <>
      <Sidebar brand="Scribe" items={["Workspace", "Briefs", "Approvals", "Sources", "Agent settings"]} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title="Draft · Product launch article" right={<Chip tone="amber">Awaiting review</Chip>} />
        <div className="flex min-h-0 flex-1 gap-1.5 p-2">
          <Card className="flex-1">
            <div className="mb-1.5 text-[10px] font-semibold text-slate-100">Five ways teams cut onboarding time</div>
            {["92%", "100%", "86%", "40%"].map((w, i) => <Bar key={i} w={w} className="mt-1.5" />)}
            <div className="mt-2 rounded border-l-2 border-sky-400 bg-sky-400/5 px-1.5 py-1 text-[7px] text-sky-200">Grounded in 3 sources · 2 claims need review</div>
            {["96%", "74%", "88%"].map((w, i) => <Bar key={i} w={w} className="mt-1.5" />)}
          </Card>
          <div className="flex w-[34%] flex-col gap-1.5">
            <Card title="Sources">
              {[["Onboarding guide.pdf", "0.92"], ["Help centre: setup", "0.88"], ["Release notes v4", "0.81"]].map(([s, v]) => (
                <div key={s} className="flex items-center justify-between py-0.5 text-[7px] text-slate-400"><span className="truncate">{s}</span><span className="font-mono text-teal-300">{v}</span></div>
              ))}
            </Card>
            <Card title="Agent" className="flex-1">
              <div className="space-y-1">
                <div className="ml-auto w-4/5 rounded bg-sky-500/20 px-1.5 py-1 text-[7px] text-sky-100">Shorten the intro and cite the guide.</div>
                <div className="w-4/5 rounded bg-white/[0.05] px-1.5 py-1 text-[7px] text-slate-300">Done. Intro is 40% shorter; added 2 citations.</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

function AgentMobile() {
  return (
    <>
      <PhoneHeader sub="3 waiting" title="Approvals" />
      <div className="mt-2 space-y-1.5 px-3">
        {[["Product launch article", "3 sources · 1,240 words"], ["Weekly update", "2 sources · 610 words"]].map(([t, s]) => (
          <div key={t} className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2">
            <div className="text-[9px] font-medium text-slate-100">{t}</div>
            <div className="text-[7px] text-slate-500">{s}</div>
            <Bar w="90%" className="mt-1.5" /><Bar w="70%" className="mt-1" />
            <div className="mt-2 flex gap-1"><div className="h-5 flex-1 rounded bg-white/[0.06] text-center text-[7px] leading-5 text-slate-300">Request changes</div><div className="h-5 flex-1 rounded bg-sky-500 text-center text-[7px] font-medium leading-5 text-white">Approve</div></div>
          </div>
        ))}
      </div>
      <TabBar active={1} />
    </>
  );
}

/* ------------------------------------------------------------------ sports */

function SportsDesktop() {
  return (
    <>
      <Sidebar brand="Coachly" items={["Find coaches", "Bookings", "Sessions", "Payments", "Reviews"]} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title="Find a coach" right={<Chip tone="sky">Tennis · Under 14</Chip>} />
        <div className="flex gap-1 px-2 pt-2">{["Tennis", "Swimming", "Football", "Athletics"].map((s, i) => <Chip key={s} tone={i === 0 ? "sky" : "slate"}>{s}</Chip>)}</div>
        <div className="grid flex-1 grid-cols-3 gap-1.5 p-2">
          {[["Level 2 coach", "4.9", "$60/h"], ["Junior specialist", "4.8", "$45/h"], ["Performance coach", "5.0", "$80/h"], ["Club coach", "4.7", "$40/h"], ["Holiday camps", "4.9", "$35/h"], ["Private lessons", "4.8", "$55/h"]].map(([t, r, p], i) => (
            <div key={i} className="flex flex-col rounded-md border border-white/[0.06] bg-white/[0.02] p-1.5">
              <div className="flex items-center gap-1.5"><div className="h-5 w-5 rounded-full bg-gradient-to-br from-slate-400 to-slate-600" /><div><div className="text-[7.5px] font-medium text-slate-100">{t}</div><div className="text-[6.5px] text-slate-500">★ {r}</div></div></div>
              <div className="mt-auto flex items-center justify-between pt-1.5"><span className="text-[8px] font-semibold text-slate-100">{p}</span><span className="rounded bg-sky-500 px-1 py-px text-[6.5px] font-medium text-white">Book</span></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function SportsMobile() {
  return (
    <>
      <PhoneHeader sub="This week" title="My calendar" />
      <div className="mt-2 grid grid-cols-7 gap-1 px-3">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} className={`rounded-md py-1 text-center text-[7px] ${i === 2 ? "bg-sky-500 text-white" : "bg-white/[0.04] text-slate-400"}`}>{d}<div className="text-[9px] font-semibold">{12 + i}</div></div>
        ))}
      </div>
      <div className="mt-2 space-y-1 px-3">
        {[["16:00", "Group session · 8 players"], ["17:30", "Private lesson"], ["19:00", "Club training"]].map(([t, s]) => (
          <div key={t} className="flex gap-2 rounded-md bg-white/[0.03] px-2 py-1.5 ring-1 ring-white/[0.05]"><span className="font-mono text-[7.5px] text-sky-300">{t}</span><span className="text-[8px] text-slate-300">{s}</span></div>
        ))}
      </div>
      <div className="mx-3 mt-2 flex items-center justify-between rounded-md bg-teal-400/10 px-2 py-1.5 ring-1 ring-teal-400/20"><span className="text-[7.5px] text-teal-200">This week's earnings</span><span className="text-[9px] font-semibold text-teal-100">$1,140</span></div>
      <TabBar active={1} />
    </>
  );
}

/* ------------------------------------------------------------------ vehicle */

function VehicleDesktop() {
  const cols: Array<[string, string[]]> = [
    ["Received", ["RO-8812 · Hatchback", "RO-8815 · SUV"]],
    ["Inspection", ["RO-8809 · Ute", "RO-8811 · Sedan", "RO-8814 · Van"]],
    ["Awaiting approval", ["RO-8805 · SUV"]],
    ["Complete", ["RO-8801 · Sedan", "RO-8803 · Wagon"]],
  ];
  return (
    <>
      <Sidebar brand="Workshop" items={["Repair orders", "Technicians", "Inspections", "Parts", "Reports", "Sites"]} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title="Repair orders" right={<Chip tone="teal">On track</Chip>} />
        <div className="grid flex-1 grid-cols-4 gap-1.5 p-2">
          {cols.map(([name, items], ci) => (
            <div key={name} className="flex flex-col gap-1 rounded-md bg-white/[0.02] p-1.5 ring-1 ring-white/[0.05]">
              <div className="flex items-center justify-between text-[7px] text-slate-400">{name}<span className="text-slate-600">{items.length}</span></div>
              {items.map((it) => (
                <div key={it} className="rounded border border-white/[0.06] bg-ink-800 p-1.5">
                  <div className="font-mono text-[7px] text-slate-200">{it}</div>
                  <div className="mt-1 flex items-center gap-1"><Dot tone={(["slate", "sky", "amber", "teal"] as const)[ci]} /><Bar w="60%" /></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function VehicleMobile() {
  return (
    <>
      <PhoneHeader sub="RO-8809 · Ute" title="Inspection" />
      <div className="mt-2 grid grid-cols-2 gap-1.5 px-3">
        {[["Front left", "6mm", "teal"], ["Front right", "5mm", "teal"], ["Rear left", "3mm", "amber"], ["Rear right", "2mm", "rose"]].map(([w, d, tone]) => (
          <div key={w} className="rounded-md bg-white/[0.03] p-1.5 ring-1 ring-white/[0.05]">
            <div className="text-[7px] text-slate-500">{w}</div>
            <div className="flex items-center justify-between"><span className="text-[10px] font-semibold text-slate-100">{d}</span><Dot tone={tone as "teal"} /></div>
          </div>
        ))}
      </div>
      <div className="mx-3 mt-2 flex gap-1">{[0, 1, 2].map((i) => <div key={i} className="aspect-square flex-1 rounded-md bg-gradient-to-br from-white/[0.08] to-white/[0.02] ring-1 ring-white/[0.06]" />)}</div>
      <div className="mx-3 mt-2 h-6 rounded-md bg-sky-500 text-center text-[8px] font-medium leading-6 text-white">Submit report</div>
      <TabBar active={2} />
    </>
  );
}
