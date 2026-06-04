import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ContactRound,
  Download,
  LogOut,
  MapPin,
  Plus,
  QrCode,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ApiHost, ApiUser, ApiVisit, authApi, getCurrentUser, visitApi } from "../../services/api";

type PassStatus = "approved" | "pending" | "rejected" | "checked-in" | "completed" | "expired";

interface VisitorPass {
  id: string;
  purpose: string;
  host: string;
  gate: string;
  visitDate: string;
  validUntil: string;
  status: PassStatus;
  qrCodeImageBase64?: string;
  checkIn?: string;
  notes?: string;
}

interface RequestForm {
  purpose: string;
  hostId: string;
  visitDate: string;
  gate: string;
  notes: string;
}

const defaultForm: RequestForm = {
  purpose: "",
  hostId: "",
  visitDate: "",
  gate: "Gate A",
  notes: "",
};

const normalizeStatus = (status: ApiVisit["status"]): PassStatus => {
  const normalized = status.toLowerCase().replace("_", "-") as PassStatus;
  return normalized;
};

const getDisplayStatus = (visit: ApiVisit): PassStatus => {
  if (visit.status === "APPROVED" && visit.qrExpiresAt && new Date(visit.qrExpiresAt).getTime() < Date.now()) {
    return "expired";
  }
  return normalizeStatus(visit.status);
};

const getName = (value: ApiVisit["hostId"] | ApiVisit["guestId"]) => {
  if (typeof value === "string") return "Unknown";
  return value.name || "Unknown";
};

const mapVisitToPass = (visit: ApiVisit): VisitorPass => ({
  id: visit._id,
  purpose: visit.purposeOfVisit,
  host: getName(visit.hostId),
  gate: visit.gate || "Gate A",
  visitDate: visit.visitDate,
  validUntil: visit.qrExpiresAt || visit.visitDate,
  status: getDisplayStatus(visit),
  qrCodeImageBase64: visit.qrCodeImageBase64,
  checkIn: visit.checkedInAt,
  notes: visit.hostNote || visit.guestNote,
});

const formatDateTime = (value: string) => {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const statusConfig: Record<PassStatus, { label: string; classes: string; icon: typeof CheckCircle2 }> = {
  approved: {
    label: "Approved",
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  pending: {
    label: "Pending",
    classes: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock3,
  },
  rejected: {
    label: "Rejected",
    classes: "bg-rose-50 text-rose-700 border-rose-200",
    icon: XCircle,
  },
  "checked-in": {
    label: "Checked in",
    classes: "bg-sky-50 text-sky-700 border-sky-200",
    icon: ShieldCheck,
  },
  completed: {
    label: "Completed",
    classes: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: CheckCircle2,
  },
  expired: {
    label: "Expired",
    classes: "bg-slate-100 text-slate-600 border-slate-200",
    icon: Clock3,
  },
};

const StatusBadge = ({ status }: { status: PassStatus }) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold ${config.classes}`}>
      <Icon size={13} />
      {config.label}
    </span>
  );
};

export default function UserDashboard() {
  const navigate = useNavigate();
  const [visitor, setVisitor] = useState<ApiUser | null>(null);
  const [passes, setPasses] = useState<VisitorPass[]>([]);
  const [hosts, setHosts] = useState<ApiHost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<RequestForm>(defaultForm);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const currentUser = getCurrentUser();
    setVisitor(currentUser);

    if (!currentUser || currentUser.role !== "GUEST") {
      setPasses([]);
      setIsLoading(false);
      return;
    }

    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        const [visitRows, hostRows] = await Promise.all([visitApi.myVisits(), visitApi.hosts()]);
        setPasses(visitRows.map(mapVisitToPass));
        setHosts(hostRows);
        setFormData((prev) => ({ ...prev, hostId: hostRows[0]?._id || "" }));
        setError("");
      } catch {
        setError("Could not load visitor passes. Make sure the backend is running.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    return {
      total: passes.length,
      approved: passes.filter((pass) => pass.status === "approved").length,
      pending: passes.filter((pass) => pass.status === "pending").length,
      expired: passes.filter((pass) => pass.status === "expired").length,
      active: passes.filter((pass) => ["approved", "checked-in"].includes(pass.status)).length,
    };
  }, [passes]);

  const activePass = passes.find((pass) => pass.status === "approved" || pass.status === "checked-in");

  const updateField = (key: keyof RequestForm, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const submitRequest = async () => {
    if (!visitor) return;

    if (!formData.purpose || !formData.hostId || !formData.visitDate) {
      setError("Please fill purpose, host, and visit date.");
      return;
    }

    const visitDate = new Date(formData.visitDate);
    if (Number.isNaN(visitDate.getTime())) {
      setError("Please choose a valid visit date.");
      return;
    }

    try {
      const visit = await visitApi.create({
        hostId: formData.hostId,
        purposeOfVisit: formData.purpose,
        visitDate: visitDate.toISOString(),
        visitTimeSlot: visitDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        gate: formData.gate,
        guestNote: formData.notes,
      });

      setPasses((prev) => [mapVisitToPass(visit), ...prev]);
      setSubmitted(true);
      setError("");

      setTimeout(() => {
        setFormData((prev) => ({ ...defaultForm, hostId: prev.hostId }));
        setShowForm(false);
        setSubmitted(false);
      }, 1200);
    } catch {
      setError("Request could not be submitted. Please try again.");
    }
  };

  const logout = async () => {
    await authApi.logout();
    setVisitor(null);
    setPasses([]);
    navigate("/signin", { replace: true });
  };

  if (!visitor || visitor.role !== "GUEST") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16 text-slate-950">
        <section className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
            <UserRound size={26} />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Visitor login required</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The visitor dashboard only shows passes for the visitor account from the active auth token.
          </p>
          <Link
            to="/signin"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700"
          >
            Go to login
            <ArrowRight size={16} />
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-sky-600 text-white">
              <UserRound size={25} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-sky-700">Individual visitor dashboard</p>
              <h1 className="text-2xl font-black tracking-tight">Welcome, {visitor.name}</h1>
              <p className="text-sm text-slate-500">{visitor.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowForm((value) => !value)}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              <Plus size={16} />
              Request pass
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-rose-200 hover:text-rose-700"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "My passes", value: stats.total, icon: ContactRound, color: "text-slate-950" },
            { label: "Active", value: stats.active, icon: ShieldCheck, color: "text-sky-700" },
            { label: "Approved", value: stats.approved, icon: CheckCircle2, color: "text-emerald-700" },
            { label: "Pending", value: stats.pending, icon: Clock3, color: "text-amber-700" },
            { label: "Expired", value: stats.expired, icon: XCircle, color: "text-slate-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <article key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Icon size={19} />
              </div>
              <p className={`text-3xl font-black ${color}`}>{value}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">{label}</p>
            </article>
          ))}
        </div>

        {showForm && (
          <section className="mb-6 rounded-lg border border-sky-200 bg-white p-6 shadow-lg shadow-sky-900/5">
            {submitted ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto mb-3 text-emerald-600" size={42} />
                <p className="text-lg font-black text-emerald-700">Request submitted</p>
                <p className="mt-1 text-sm text-slate-500">It is waiting for admin or host approval.</p>
              </div>
            ) : (
              <>
                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-sky-700">New visitor pass request</p>
                  <h2 className="mt-1 text-xl font-black">Create a request for {visitor.name}</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Purpose *</span>
                    <input
                      value={formData.purpose}
                      onChange={(event) => updateField("purpose", event.target.value)}
                      placeholder="Project review, lab visit, document pickup"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Host *</span>
                    <select
                      value={formData.hostId}
                      onChange={(event) => updateField("hostId", event.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white"
                    >
                      {hosts.length === 0 ? (
                        <option value="">No hosts available</option>
                      ) : (
                        hosts.map((host) => (
                          <option key={host._id} value={host._id}>
                            {host.name}
                            {host.department ? ` - ${host.department}` : ""}
                          </option>
                        ))
                      )}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Visit date and time *</span>
                    <input
                      type="datetime-local"
                      value={formData.visitDate}
                      onChange={(event) => updateField("visitDate", event.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Preferred gate</span>
                    <select
                      value={formData.gate}
                      onChange={(event) => updateField("gate", event.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white"
                    >
                      {["Gate A", "Gate B", "Gate C"].map((gate) => (
                        <option key={gate}>{gate}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Notes</span>
                    <textarea
                      value={formData.notes}
                      onChange={(event) => updateField("notes", event.target.value)}
                      placeholder="Add ID proof details or special instructions"
                      rows={3}
                      className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white"
                    />
                  </label>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    onClick={submitRequest}
                    className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 disabled:opacity-60"
                    disabled={hosts.length === 0}
                  >
                    Submit request
                    <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Private records</p>
                <h2 className="text-xl font-black">My visitor passes</h2>
              </div>
              <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600">
                <Download size={15} />
                Export
              </button>
            </div>

            {isLoading ? (
              <div className="p-10 text-center text-sm font-semibold text-slate-500">Loading passes...</div>
            ) : passes.length === 0 ? (
              <div className="p-10 text-center">
                <QrCode className="mx-auto mb-3 text-slate-300" size={46} />
                <p className="font-bold">No passes found for this visitor.</p>
                <p className="mt-1 text-sm text-slate-500">Create a new request to start your visitor pass history.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {passes.map((pass) => (
                  <article key={pass.id} className="grid gap-4 p-5 md:grid-cols-[1fr_auto]">
                    <div>
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <p className="font-mono text-sm font-black text-sky-700">{pass.id}</p>
                        <StatusBadge status={pass.status} />
                      </div>
                      <h3 className="text-lg font-black">{pass.purpose}</h3>
                      <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                        <p className="inline-flex items-center gap-2">
                          <UserRound size={15} />
                          Host: {pass.host}
                        </p>
                        <p className="inline-flex items-center gap-2">
                          <MapPin size={15} />
                          {pass.gate}
                        </p>
                        <p className="inline-flex items-center gap-2">
                          <CalendarClock size={15} />
                          Visit: {formatDateTime(pass.visitDate)}
                        </p>
                        <p className="inline-flex items-center gap-2">
                          <Clock3 size={15} />
                          Valid until: {formatDateTime(pass.validUntil)}
                        </p>
                      </div>
                      {pass.notes && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{pass.notes}</p>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-lg shadow-slate-900/10">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-sky-300">Current pass</p>
                  <h2 className="text-xl font-black">QR pass</h2>
                </div>
                <QrCode size={24} className="text-sky-300" />
              </div>

              {activePass?.qrCodeImageBase64 ? (
                <>
                  <div className="mb-4 rounded-lg bg-white p-4">
                    <img src={activePass.qrCodeImageBase64} alt="Gate pass QR code" className="mx-auto aspect-square w-44" />
                  </div>
                  <p className="font-mono text-sm font-black text-sky-200">{activePass.id}</p>
                  <p className="mt-2 text-sm text-slate-300">{activePass.purpose}</p>
                  <p className="mt-4 rounded-lg bg-emerald-500/15 p-3 text-sm font-semibold text-emerald-200">
                    Show this QR code at {activePass.gate}. The backend validates token status, expiry, and reuse.
                  </p>
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-700 p-6 text-center">
                  <QrCode className="mx-auto mb-3 text-slate-600" size={42} />
                  <p className="text-sm text-slate-400">No active approved QR pass yet.</p>
                </div>
              )}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Privacy rule</p>
              <h2 className="mt-1 text-lg font-black">Visitor-scoped data</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Pass records are loaded from the auth token on the backend, not from an email query or browser-only filter.
              </p>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
