import { Database, Github, QrCode, ShieldCheck, TerminalSquare } from 'lucide-react';

const FOOTER_LINKS = {
  Project: ['Workflow', 'Modules', 'Scanner UI', 'Visit Logs'],
  Roles: ['Admin', 'Security Desk', 'Host', 'Visitor'],
  Build: ['React Frontend', 'API Routes', 'Database Schema', 'Authentication'],
  Records: ['Approvals', 'Check-ins', 'Check-outs', 'Reports'],
};

export const Footer = () => {
  return (
    <footer className="bg-gray-950 text-slate-400 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 pb-12 pt-16 md:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600">
                <ShieldCheck size={16} className="text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Gate<span className="text-sky-400">Pass</span>
              </span>
            </a>
            <p className="mb-6 text-sm leading-relaxed text-slate-500">
              Visitor pass management system for registration, approval, QR validation, and entry logs.
            </p>
            <div className="flex items-center gap-3">
              {[QrCode, TerminalSquare, Database, Github].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 transition-all hover:bg-slate-700 hover:text-white"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-4 text-sm font-semibold text-white">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-slate-500 transition-colors hover:text-slate-300">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-800 py-6 sm:flex-row">
          <p className="text-xs text-slate-600">
            Copyright {new Date().getFullYear()} GatePass project. Built for visitor entry management.
          </p>
          <div className="flex items-center gap-3">
            {['QR Pass', 'Role Access', 'Audit Log'].map((badge) => (
              <span key={badge} className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-400">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
