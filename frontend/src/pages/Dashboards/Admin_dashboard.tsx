import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { adminApi, ApiVisit, authApi, getCurrentUser } from "../../services/api";

interface StatItem {
  label: string;
  value: number;
  delta: string;
  urgent?: boolean;
}

interface PassRecord {
  id: string;
  name: string;
  dept: string;
  purpose: string;
  status: "approved" | "pending" | "rejected" | "checked-in" | "completed" | "expired";
  time: string;
  visitDate: string;
  gate: string;
}

type FilterType = "all" | PassRecord["status"];

const FILTER_OPTIONS: FilterType[] = ["all", "pending", "approved", "rejected", "checked-in", "completed", "expired"];

const normalizeStatus = (status: ApiVisit["status"]): PassRecord["status"] =>
  status.toLowerCase().replace("_", "-") as PassRecord["status"];

const getDisplayStatus = (visit: ApiVisit): PassRecord["status"] => {
  if (visit.status === "APPROVED" && visit.qrExpiresAt && new Date(visit.qrExpiresAt).getTime() < Date.now()) {
    return "expired";
  }
  return normalizeStatus(visit.status);
};

const getPerson = (value: ApiVisit["guestId"] | ApiVisit["hostId"]) => {
  if (typeof value === "string") return { name: "Unknown", department: "" };
  return { name: value.name || "Unknown", department: "department" in value ? value.department || "" : "" };
};

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const mapVisit = (visit: ApiVisit): PassRecord => {
  const guest = getPerson(visit.guestId);
  const host = getPerson(visit.hostId);

  return {
    id: visit._id,
    name: guest.name,
    dept: host.department || "Visitor",
    purpose: visit.purposeOfVisit,
    status: getDisplayStatus(visit),
    time: formatTime(visit.visitDate),
    visitDate: visit.visitDate,
    gate: visit.gate || "Gate A",
  };
};

const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, { bg: string; color: string; border: string; label: string }> = {
    approved: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0", label: "Approved" },
    pending: { bg: "#fffbeb", color: "#b45309", border: "#fde68a", label: "Pending" },
    rejected: { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca", label: "Rejected" },
    "checked-in": { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", label: "Checked in" },
    completed: { bg: "#eef2ff", color: "#4338ca", border: "#c7d2fe", label: "Completed" },
    expired: { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1", label: "Expired" },
  };
  const { bg, color, border, label } = cfg[status] ?? { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1", label: status };
  return (
    <span
      style={{
        background: bg,
        color,
        border: `1px solid ${border}`,
        padding: "4px 10px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0,
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  );
};

const StatCard = ({ stat }: { stat: StatItem }) => (
  <div
    style={{
      background: stat.urgent ? "#fffbeb" : "#ffffff",
      border: `1px solid ${stat.urgent ? "#fcd34d" : "#e2e8f0"}`,
      borderRadius: 6,
      padding: 24,
    }}
  >
    <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{stat.value}</div>
    <div style={{ fontSize: 13, color: "#64748b", marginTop: 8, fontWeight: 600 }}>{stat.label}</div>
    <div style={{ fontSize: 12, color: stat.urgent ? "#d97706" : "#10b981", marginTop: 4, fontWeight: 700 }}>{stat.delta}</div>
  </div>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [passes, setPasses] = useState<PassRecord[]>([]);
  const [error, setError] = useState("");
  const currentUser = getCurrentUser();

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statRows, visitRows] = await Promise.all([adminApi.stats(), adminApi.visits()]);
      setStats([
        { label: "Total Passes", value: statRows.totalVisits || 0, delta: "All time" },
        { label: "Pending", value: statRows.pendingVisits || 0, delta: "Needs review", urgent: (statRows.pendingVisits || 0) > 0 },
        { label: "Approved", value: statRows.approvedVisits || 0, delta: "QR active" },
        { label: "Checked In", value: statRows.checkedInVisits || 0, delta: "Completed entry" },
        { label: "Expired", value: statRows.expiredVisits || 0, delta: "QR inactive", urgent: (statRows.expiredVisits || 0) > 0 },
      ]);
      setPasses(visitRows.map(mapVisit));
      setError("");
    } catch {
      setError("Could not load admin data. Sign in as ADMIN and start the backend.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "ADMIN") {
      loadDashboardData();
      return;
    }
    setIsLoading(false);
  }, []);

  const handleApprove = async (passId: string) => {
    try {
      const visit = await adminApi.approveVisit(passId);
      setPasses((prev) => prev.map((pass) => (pass.id === passId ? mapVisit(visit) : pass)));
      setError("");
      await loadDashboardData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Could not approve this pass.");
    }
  };

  const handleDeny = async (passId: string) => {
    try {
      const visit = await adminApi.rejectVisit(passId);
      setPasses((prev) => prev.map((pass) => (pass.id === passId ? mapVisit(visit) : pass)));
      setError("");
      await loadDashboardData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Could not reject this pass.");
    }
  };

  const handleLogout = async () => {
    await authApi.logout();
    navigate("/signin", { replace: true });
  };

  const gateData = useMemo(() => {
    const totals = passes.reduce<Record<string, number>>((acc, pass) => {
      acc[pass.gate] = (acc[pass.gate] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(totals).map(([gate, count], index) => [gate, count, ["#059669", "#0ea5e9", "#f59e0b"][index % 3]] as [string, number, string]);
  }, [passes]);

  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 12 }, () => 0);
    passes.forEach((pass) => {
      const hour = new Date(pass.visitDate).getHours();
      if (hour >= 8 && hour <= 19) hours[hour - 8] += 1;
    });
    return hours;
  }, [passes]);

  const filtered = passes.filter(
    (pass) =>
      (filter === "all" || pass.status === filter) &&
      (pass.name.toLowerCase().includes(search.toLowerCase()) || pass.id.toLowerCase().includes(search.toLowerCase()))
  );

  const maxH = hourlyData.length > 0 ? Math.max(...hourlyData, 1) : 1;
  const totalGates = gateData.reduce((sum, [, count]) => sum + count, 0) || 1;

  if (currentUser?.role !== "ADMIN") {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8fafc", color: "#0f172a", padding: 24 }}>
        <div style={{ maxWidth: 460, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 32, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Admin login required</h1>
          <p style={{ color: "#64748b", marginTop: 12, lineHeight: 1.6 }}>Sign in with an ADMIN account to approve visits and generate backend QR passes.</p>
          <Link to="/signin" style={{ display: "inline-block", marginTop: 20, background: "#0f172a", color: "#fff", padding: "10px 16px", borderRadius: 6, fontWeight: 700, textDecoration: "none" }}>
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "sans-serif" }}>
        <h2>Loading dashboard data...</h2>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#0f172a", background: "#f8fafc", minHeight: "100vh", padding: "100px 40px 40px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #94a3b8 !important; }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 24, color: "#0f172a", letterSpacing: 0 }}>Admin Dashboard</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Approve requests and issue QR passes</div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={loadDashboardData} style={{ background: "#10b981", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Refresh
          </button>
          <button onClick={handleLogout} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#ffffff", color: "#b91c1c", border: "1px solid #fecaca", padding: "10px 16px", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </div>

      {error && <div style={{ marginBottom: 20, padding: 12, border: "1px solid #fecaca", background: "#fef2f2", color: "#b91c1c", borderRadius: 6, fontWeight: 700 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 20, marginBottom: 32 }}>
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, marginBottom: 32 }}>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 6, padding: 24 }}>
          <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 16, marginBottom: 24 }}>Hourly Pass Activity</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
            {hourlyData.map((value, index) => (
              <div key={index} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ width: "100%", height: `${(value / maxH) * 100}%`, background: "#10b981", minHeight: 4, borderRadius: 3 }} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 6, padding: 24 }}>
          <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 16, marginBottom: 24 }}>Gate Breakdown</div>
          {gateData.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: 13 }}>No gate data yet.</p>
          ) : (
            gateData.map(([gate, count, color]) => (
              <div key={gate} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>{gate}</span>
                  <span style={{ fontSize: 13, color: "#0f172a", fontWeight: 800 }}>{count}</span>
                </div>
                <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4 }}>
                  <div style={{ height: "100%", width: `${(count / totalGates) * 100}%`, background: color, borderRadius: 4 }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 16 }}>Pass Requests</span>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or ID..."
              style={{ background: "#f8fafc", border: "1px solid #cbd5e1", color: "#0f172a", padding: "8px 16px", borderRadius: 6, fontSize: 13, outline: "none", width: 220 }}
            />
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => setFilter(option)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  border: "1px solid",
                  cursor: "pointer",
                  background: filter === option ? "#10b981" : "#ffffff",
                  borderColor: filter === option ? "#10b981" : "#cbd5e1",
                  color: filter === option ? "#fff" : "#64748b",
                  textTransform: "capitalize",
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                {["Pass ID", "Visitor", "Dept", "Purpose", "Gate", "Time", "Status", "Action"].map((header) => (
                  <th key={header} style={{ padding: "14px 24px", textAlign: "left", fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((pass) => (
                <tr key={pass.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px 24px", fontSize: 13, color: "#047857", fontWeight: 700 }}>{pass.id}</td>
                  <td style={{ padding: "16px 24px", fontSize: 14, color: "#0f172a", fontWeight: 600 }}>{pass.name}</td>
                  <td style={{ padding: "16px 24px", fontSize: 13, color: "#475569" }}>{pass.dept}</td>
                  <td style={{ padding: "16px 24px", fontSize: 13, color: "#475569" }}>{pass.purpose}</td>
                  <td style={{ padding: "16px 24px", fontSize: 13, color: "#475569" }}>{pass.gate}</td>
                  <td style={{ padding: "16px 24px", fontSize: 13, color: "#64748b" }}>{pass.time}</td>
                  <td style={{ padding: "16px 24px" }}>
                    <StatusBadge status={pass.status} />
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    {pass.status === "pending" ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => handleApprove(pass.id)} style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 4, padding: "6px 14px", fontWeight: 700, cursor: "pointer" }}>
                          Approve
                        </button>
                        <button onClick={() => handleDeny(pass.id)} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 4, padding: "6px 12px", fontWeight: 700, cursor: "pointer" }}>
                          Deny
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: "#64748b", fontSize: 13, fontWeight: 600 }}>No action</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#64748b", fontWeight: 600 }}>
                    No pass requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
