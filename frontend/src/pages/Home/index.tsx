import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Bell,
  CheckCircle2,
  Clock3,
  Code2,
  ContactRound,
  Database,
  FileText,
  Fingerprint,
  GitBranch,
  KeyRound,
  Laptop,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  LogIn,
  QrCode,
  ScanLine,
  ServerCog,
  ShieldCheck,
  Smartphone,
  TerminalSquare,
  UserCheck,
  UserPlus,
  UsersRound,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

type IconCard = {
  icon: LucideIcon;
  title: string;
  description: string;
  tone: string;
};

const qrCells = [
  1, 1, 1, 0, 1, 1, 1,
  1, 0, 1, 0, 1, 0, 1,
  1, 1, 1, 1, 1, 1, 1,
  0, 0, 1, 0, 1, 0, 0,
  1, 1, 1, 1, 0, 1, 1,
  1, 0, 1, 0, 1, 0, 1,
  1, 1, 1, 0, 1, 1, 1,
];

const flowSteps: IconCard[] = [
  {
    icon: UserPlus,
    title: 'Visitor request',
    description: 'Visitor details, purpose, meeting time, document number, and host are captured from a clean form.',
    tone: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  },
  {
    icon: UserCheck,
    title: 'Host approval',
    description: 'The host or admin can approve, reject, or keep a request pending with a clear status history.',
    tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  {
    icon: QrCode,
    title: 'QR pass issue',
    description: 'Approved visitors receive a time-limited QR pass with visit metadata and pass validity.',
    tone: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  },
  {
    icon: ScanLine,
    title: 'Gate validation',
    description: 'Security scans the pass, verifies identity, marks check-in, and records check-out later.',
    tone: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  },
];

const modules: IconCard[] = [
  {
    icon: LayoutDashboard,
    title: 'Admin dashboard',
    description: 'Today count, pending approvals, active passes, rejected visits, and quick filtering by status.',
    tone: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  },
  {
    icon: ContactRound,
    title: 'Visitor profile',
    description: 'Name, contact, photo, document details, visit reason, host, department, and pass timeline.',
    tone: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
  },
  {
    icon: ShieldCheck,
    title: 'Security desk',
    description: 'A scanner-first screen for gate staff with instant allow, expired, blocked, or already-used states.',
    tone: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  },
  {
    icon: FileText,
    title: 'Visit logs',
    description: 'Searchable check-in records with date, time, host, pass number, gate, and export-ready fields.',
    tone: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
  },
];

const buildItems = [
  { icon: Laptop, label: 'React views', detail: 'Landing, auth, admin, user, security desk' },
  { icon: ServerCog, label: 'API layer', detail: 'Pass requests, approvals, QR validation, logs' },
  { icon: Database, label: 'Data model', detail: 'Visitors, passes, hosts, roles, audit events' },
  { icon: LockKeyhole, label: 'Role access', detail: 'Admin, security, host, visitor permissions' },
];

const statusRows = [
  { name: 'Ananya Rao', purpose: 'Project review', host: 'Dr. Mehta', status: 'Approved', icon: CheckCircle2 },
  { name: 'Rohan Singh', purpose: 'Lab access', host: 'Security desk', status: 'Checked in', icon: BadgeCheck },
  { name: 'Maya Nair', purpose: 'Document pickup', host: 'Admin office', status: 'Pending', icon: Clock3 },
  { name: 'Kiran Shah', purpose: 'Expired pass', host: 'Block A', status: 'Denied', icon: XCircle },
];

const HeroPreview = () => {
  return (
    <div className="pointer-events-none absolute inset-x-4 top-[520px] hidden lg:block">
      <div className="mx-auto max-w-6xl rounded-lg border border-white/30 bg-white/90 shadow-2xl shadow-slate-900/20 backdrop-blur dark:border-slate-700/60 dark:bg-slate-950/85">
        <div className="grid min-h-[360px] grid-cols-[220px_1fr_280px] overflow-hidden rounded-lg">
          <aside className="border-r border-slate-200 bg-slate-950 p-5 text-white dark:border-slate-800">
            <div className="mb-8 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-sm font-bold">GatePass Dev</p>
                <p className="text-xs text-slate-400">VPMS panel</p>
              </div>
            </div>
            {['Dashboard', 'Requests', 'QR scanner', 'Visit logs'].map((item, index) => (
              <div
                key={item}
                className={`mb-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                  index === 0 ? 'bg-white text-slate-950' : 'text-slate-400'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-sky-500' : 'bg-slate-600'}`} />
                {item}
              </div>
            ))}
          </aside>

          <main className="bg-slate-50 p-6 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-sky-700 dark:text-sky-300">Live desk</p>
                <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Today&apos;s visitor movement</h2>
              </div>
              <div className="rounded-lg bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                18 active passes
              </div>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-3">
              {[
                ['42', 'Requests'],
                ['26', 'Approved'],
                ['08', 'Pending'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-2xl font-bold text-slate-950 dark:text-white">{value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
              {statusRows.map(({ name, purpose, host, status, icon: Icon }) => (
                <div key={name} className="grid grid-cols-[1.1fr_1fr_1fr_auto] items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{purpose}</p>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{host}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Gate A</p>
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <Icon size={12} />
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </main>

          <aside className="border-l border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-950 dark:text-white">Pass scanner</p>
              <span className="rounded-md bg-sky-100 px-2 py-1 text-xs font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">Online</span>
            </div>
            <div className="mb-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <div className="mx-auto grid w-32 grid-cols-7 gap-1">
                {qrCells.map((filled, index) => (
                  <span
                    key={`${filled}-${index}`}
                    className={`h-4 rounded-sm ${filled ? 'bg-slate-950 dark:bg-white' : 'bg-slate-100 dark:bg-slate-800'}`}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold">
                <CheckCircle2 size={16} />
                Valid pass
              </div>
              <p className="text-xs leading-relaxed text-emerald-700 dark:text-emerald-300">
                Visitor identity matched. Check-in recorded at 10:42 AM.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

const MobileHeroPreview = () => (
  <div className="mt-10 rounded-lg border border-white/70 bg-white/80 p-4 shadow-xl shadow-slate-900/10 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-950/70">
    <div className="mb-4 flex items-center justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-sky-700 dark:text-sky-300">Live preview</p>
        <p className="text-lg font-black text-slate-950 dark:text-white">Gate desk scanner</p>
      </div>
      <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        Valid
      </span>
    </div>
    <div className="grid grid-cols-[110px_1fr] gap-4">
      <div className="rounded-lg bg-white p-3 dark:bg-slate-900">
        <div className="grid grid-cols-7 gap-1">
          {qrCells.map((filled, index) => (
            <span key={`mobile-${index}`} className={`h-3 rounded-sm ${filled ? 'bg-slate-950 dark:bg-white' : 'bg-slate-100 dark:bg-slate-800'}`} />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <p className="font-bold text-slate-950 dark:text-white">Rohan Singh</p>
        <p className="text-xs text-slate-600 dark:text-slate-400">Project review with Dr. Mehta</p>
        <p className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          Check-in ready
        </p>
      </div>
    </div>
  </div>
);

const SectionHeader = ({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) => (
  <div className="mx-auto mb-12 max-w-3xl text-center">
    <p className="mb-3 text-xs font-bold uppercase tracking-widest text-sky-700 dark:text-sky-300">{eyebrow}</p>
    <h2 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl dark:text-white">{title}</h2>
    <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-400">{text}</p>
  </div>
);

const Home = () => {
  return (
    <main className="bg-white dark:bg-slate-950">
      <section className="relative min-h-[92vh] overflow-hidden bg-[linear-gradient(135deg,#e0f2fe_0%,#f8fafc_44%,#ecfdf5_100%)] pt-24 dark:bg-[linear-gradient(135deg,#082f49_0%,#020617_48%,#042f2e_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.2),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.22),transparent_34%)]" />
        <HeroPreview />

        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-[440px] sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-white/75 px-3 py-2 text-xs font-bold uppercase tracking-widest text-sky-800 backdrop-blur dark:border-sky-900 dark:bg-slate-950/60 dark:text-sky-300">
              <TerminalSquare size={14} />
              Industrial training project UI
            </div>

            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-7xl dark:text-white">
              Visitor Pass Management System
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 dark:text-slate-300">
              A focused front end for creating visitor requests, approving passes, scanning QR codes at the gate, and keeping a clean digital log of every entry and exit.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/signin"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                Open system
                <ArrowRight size={16} />
              </Link>
              <a
                href="#workflow"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white/70 px-5 py-3 text-sm font-bold text-slate-800 backdrop-blur transition hover:-translate-y-0.5 hover:border-sky-400 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-200 dark:hover:border-sky-500"
              >
                View workflow
                <GitBranch size={16} />
              </a>
            </div>

            <MobileHeroPreview />
          </div>
        </div>
      </section>

      <section id="workflow" className="border-y border-slate-200 bg-white py-20 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Visitor journey"
            title="From request to gate entry in four clear states"
            text="The landing page now explains how the system actually works, so it feels like a visitor pass management project and not a generic company website."
          />

          <div className="grid gap-4 md:grid-cols-4">
            {flowSteps.map(({ icon: Icon, title, description, tone }, index) => (
              <article key={title} className="relative rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-lg ${tone}`}>
                  <Icon size={22} />
                </div>
                <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Step {index + 1}</p>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="modules" className="bg-slate-50 py-20 dark:bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="System modules"
            title="Screens a real gatepass application needs"
            text="Instead of pricing blocks and brand logos, the page highlights the modules you can build, connect to APIs, and present during development review."
          />

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map(({ icon: Icon, title, description, tone }) => (
              <article key={title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-lg ${tone}`}>
                  <Icon size={21} />
                </div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="preview" className="bg-white py-20 dark:bg-slate-950">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-sky-700 dark:text-sky-300">Interface preview</p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl dark:text-white">
              Designed around the gate desk, not a marketing page
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-400">
              The UI shows the important operational states: pending, approved, checked in, expired, and denied. That gives the project a stronger visitor-management identity from the first screen.
            </p>

            <div className="mt-8 space-y-4">
              {[
                { icon: Bell, text: 'Host receives a notification when the visitor arrives.' },
                { icon: Fingerprint, text: 'Gate staff can compare pass details with ID before check-in.' },
                { icon: Activity, text: 'Every scan updates the visit log for audit and reporting.' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex gap-3">
                  <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <Icon size={17} />
                  </div>
                  <p className="pt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-950 p-4 shadow-xl shadow-slate-900/15 dark:border-slate-800">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <p className="text-sm font-bold text-white">Security scanner</p>
                <p className="text-xs text-slate-400">Gate A - main entrance</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Ready
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[190px_1fr]">
              <div className="rounded-lg bg-white p-5">
                <div className="grid grid-cols-7 gap-1">
                  {qrCells.map((filled, index) => (
                    <span key={`preview-${index}`} className={`h-5 rounded-sm ${filled ? 'bg-slate-950' : 'bg-slate-100'}`} />
                  ))}
                </div>
                <p className="mt-4 text-center text-xs font-bold text-slate-500">PASS-2026-1042</p>
              </div>

              <div className="rounded-lg bg-slate-900 p-5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-400 text-slate-950">
                    <UsersRound size={22} />
                  </div>
                  <div>
                    <p className="font-bold text-white">Rohan Singh</p>
                    <p className="text-xs text-slate-400">Meeting: Project viva discussion</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['Host', 'Dr. Mehta'],
                    ['Valid until', '04:30 PM'],
                    ['Department', 'Computer Lab'],
                    ['Status', 'Approved'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-slate-800 p-3">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="mt-1 text-sm font-bold text-slate-100">{value}</p>
                    </div>
                  ))}
                </div>

                <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400">
                  <LogIn size={16} />
                  Mark visitor check-in
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="development" className="bg-slate-950 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-sky-300">Development focus</p>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Clear blocks for building the full project</h2>
            <p className="mt-5 text-base leading-7 text-slate-400">
              This section frames the app like a practical software project: front-end screens, backend services, database collections, and permission checks.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {buildItems.map(({ icon: Icon, label, detail }) => (
              <article key={label} className="rounded-lg border border-slate-800 bg-slate-900 p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-sky-300">
                  <Icon size={19} />
                </div>
                <h3 className="font-bold text-white">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 dark:bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
            <Code2 size={26} />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl dark:text-white">
            Ready for the visitor pass dashboard pages
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-400">
            The landing page now sets up the exact product story: request, approve, generate, scan, and log. The next screens can follow the same structure.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to="/signin"
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-600/25 transition hover:-translate-y-0.5 hover:bg-sky-700"
            >
              Continue to login
              <KeyRound size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
