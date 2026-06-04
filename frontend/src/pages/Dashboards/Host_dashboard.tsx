import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { ApiVisit, authApi, getCurrentUser, hostApi } from "../../services/api";

type RequestStatus = "approved" | "pending" | "rejected" | "checked-in" | "completed" | "expired";

interface HostRequest {
  id: string;
  visitor: string;
  email: string;
  purpose: string;
  status: RequestStatus;
  visitDate: string;
}

const normalizeStatus = (status: ApiVisit["status"]): RequestStatus =>
  status.toLowerCase().replace("_", "-") as RequestStatus;

const getDisplayStatus = (visit: ApiVisit): RequestStatus => {
  if (visit.status === "APPROVED" && visit.qrExpiresAt && new Date(visit.qrExpiresAt).getTime() < Date.now()) {
    return "expired";
  }
  return normalizeStatus(visit.status);
};

const getGuest = (value: ApiVisit["guestId"]) => {
  if (typeof value === "string") return { name: "Unknown", email: "" };
  return { name: value.name || "Unknown", email: value.email || "" };
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const mapVisit = (visit: ApiVisit): HostRequest => {
  const guest = getGuest(visit.guestId);
  return {
    id: visit._id,
    visitor: guest.name,
    email: guest.email,
    purpose: visit.purposeOfVisit,
    status: getDisplayStatus(visit),
    visitDate: visit.visitDate,
  };
};

const statusStyle: Record<RequestStatus, { label: string; color: string; bg: string }> = {
  approved: { label: "Approved", color: "#047857", bg: "#ecfdf5" },
  pending: { label: "Pending", color: "#b45309", bg: "#fffbeb" },
  rejected: { label: "Rejected", color: "#b91c1c", bg: "#fef2f2" },
  "checked-in": { label: "Checked in", color: "#1d4ed8", bg: "#eff6ff" },
  completed: { label: "Completed", color: "#4338ca", bg: "#eef2ff" },
  expired: { label: "Expired", color: "#475569", bg: "#f1f5f9" },
};

export default function HostDashboard() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [requests, setRequests] = useState<HostRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const [statRows, requestRows] = await Promise.all([hostApi.stats(), hostApi.requests()]);
      setStats(statRows);
      setRequests(requestRows.map(mapVisit));
      setError("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not load host dashboard. Sign in as HOST and start the backend.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "HOST") {
      loadDashboard();
      return;
    }
    setIsLoading(false);
  }, []);

  const pendingCount = useMemo(() => requests.filter((request) => request.status === "pending").length, [requests]);

  const approve = async (id: string) => {
    try {
      const visit = await hostApi.approveVisit(id);
      setRequests((prev) => prev.map((request) => (request.id === id ? mapVisit(visit) : request)));
      await loadDashboard();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not approve this request.");
    }
  };

  const reject = async (id: string) => {
    try {
      const visit = await hostApi.rejectVisit(id);
      setRequests((prev) => prev.map((request) => (request.id === id ? mapVisit(visit) : request)));
      await loadDashboard();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not reject this request.");
    }
  };

  const logout = async () => {
    await authApi.logout();
    navigate("/signin", { replace: true });
  };

  if (currentUser?.role !== "HOST") {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8fafc", padding: 24 }}>
        <section style={{ maxWidth: 460, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 32, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Host login required</h1>
          <p style={{ marginTop: 12, color: "#64748b" }}>Sign in with a HOST account to review visitor requests.</p>
          <Link to="/signin" style={{ display: "inline-block", marginTop: 20, background: "#0f172a", color: "#fff", padding: "10px 16px", borderRadius: 6, fontWeight: 700, textDecoration: "none" }}>
            Go to login
          </Link>
        </section>
      </main>
    );
  }

  if (isLoading) {
    return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8fafc" }}>Loading host dashboard...</main>;
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", padding: "40px" }}>
      <section style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900 }}>Host Dashboard</h1>
            <p style={{ marginTop: 4, color: "#64748b" }}>Review visitor requests assigned to {currentUser.name}.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={loadDashboard} style={{ background: "#0f172a", color: "#fff", border: 0, borderRadius: 6, padding: "10px 16px", fontWeight: 800, cursor: "pointer" }}>
              Refresh
            </button>
            <button onClick={logout} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 6, padding: "10px 16px", fontWeight: 800, cursor: "pointer" }}>
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>

        {error && <div style={{ marginBottom: 20, padding: 12, border: "1px solid #fecaca", background: "#fef2f2", color: "#b91c1c", borderRadius: 6, fontWeight: 700 }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(150px, 1fr))", gap: 16, marginBottom: 24 }}>
          {[
            ["Pending", pendingCount || stats.pending || 0],
            ["Approved", stats.approved || 0],
            ["Rejected", stats.rejected || 0],
            ["Expired", stats.expired || 0],
            ["Today", stats.todayVisits || 0],
          ].map(([label, value]) => (
            <article key={label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, padding: 20 }}>
              <div style={{ fontSize: 30, fontWeight: 900 }}>{value}</div>
              <div style={{ marginTop: 6, color: "#64748b", fontWeight: 700 }}>{label}</div>
            </article>
          ))}
        </div>

        <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid #e2e8f0", fontWeight: 900 }}>Visitor Requests</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  {["Visitor", "Email", "Purpose", "Visit time", "Status", "Action"].map((header) => (
                    <th key={header} style={{ padding: "14px 18px", textAlign: "left", fontSize: 12, color: "#64748b", textTransform: "uppercase" }}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => {
                  const cfg = statusStyle[request.status];
                  return (
                    <tr key={request.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "16px 18px", fontWeight: 800 }}>{request.visitor}</td>
                      <td style={{ padding: "16px 18px", color: "#475569" }}>{request.email || "-"}</td>
                      <td style={{ padding: "16px 18px", color: "#475569" }}>{request.purpose}</td>
                      <td style={{ padding: "16px 18px", color: "#475569" }}>{formatDateTime(request.visitDate)}</td>
                      <td style={{ padding: "16px 18px" }}>
                        <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 4, padding: "5px 10px", fontSize: 12, fontWeight: 800 }}>{cfg.label}</span>
                      </td>
                      <td style={{ padding: "16px 18px" }}>
                        {request.status === "pending" ? (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => approve(request.id)} style={{ background: "#10b981", color: "#fff", border: 0, borderRadius: 4, padding: "7px 12px", fontWeight: 800, cursor: "pointer" }}>Approve</button>
                            <button onClick={() => reject(request.id)} style={{ background: "#ef4444", color: "#fff", border: 0, borderRadius: 4, padding: "7px 12px", fontWeight: 800, cursor: "pointer" }}>Reject</button>
                          </div>
                        ) : (
                          <span style={{ color: "#64748b", fontWeight: 700 }}>No action</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#64748b", fontWeight: 700 }}>No requests assigned to this host.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
