import axios from "axios";

export type ApiRole = "GUEST" | "HOST" | "GUARD" | "ADMIN";

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: ApiRole;
}

export interface AuthSession {
  accessToken: string;
  user: ApiUser;
}

export interface ApiVisit {
  _id: string;
  guestId: string | ApiUser;
  hostId: string | Partial<ApiUser & { department?: string }>;
  purposeOfVisit: string;
  visitDate: string;
  visitTimeSlot: string;
  gate?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CHECKED_IN" | "COMPLETED" | "EXPIRED";
  guestNote?: string;
  hostNote?: string;
  qrCodeImageBase64?: string;
  qrExpiresAt?: string;
  checkedInAt?: string;
  createdAt: string;
}

export interface ApiHost {
  _id: string;
  name: string;
  email: string;
  department?: string;
}

const normalizeRole = (role?: string): ApiRole | undefined => {
  const normalized = role?.toUpperCase();
  return ["GUEST", "HOST", "GUARD", "ADMIN"].includes(normalized || "") ? (normalized as ApiRole) : undefined;
};

const normalizeUser = (user: ApiUser): ApiUser => ({
  ...user,
  role: normalizeRole(user.role) || user.role,
});

const normalizeApiBaseUrl = (value: string) => {
  const baseUrl = value.replace(/\/+$/, "");
  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
};

const api = axios.create({
  baseURL: normalizeApiBaseUrl(
    import.meta.env.VITE_API_URL || "https://full-stack-gate-pass-management-system.onrender.com"
  ),
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const { data } = await api.post<{ success: boolean; accessToken: string }>("/auth/refresh");
      localStorage.setItem("accessToken", data.accessToken);
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      clearSession();
      return Promise.reject(refreshError);
    }
  }
);

export const saveSession = (session: AuthSession) => {
  const user = normalizeUser(session.user);
  localStorage.setItem("accessToken", session.accessToken);
  localStorage.setItem("currentUser", JSON.stringify(user));
  localStorage.setItem(
    "currentVisitor",
    JSON.stringify({
      name: user.name,
      email: user.email,
      role: user.role === "GUEST" ? "visitor" : user.role.toLowerCase(),
    })
  );
};

export const clearSession = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("currentVisitor");
};

export const getCurrentUser = (): ApiUser | null => {
  try {
    const raw = localStorage.getItem("currentUser");
    return raw ? normalizeUser(JSON.parse(raw) as ApiUser) : null;
  } catch {
    return null;
  }
};

export const getDashboardPath = (role?: string) => {
  switch (normalizeRole(role)) {
    case "ADMIN":
      return "/admin";
    case "GUARD":
      return "/verify";
    case "HOST":
      return "/host-dashboard";
    case "GUEST":
      return "/visitor-dashboard";
    default:
      return "/signin";
  }
};

export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await api.post<AuthSession>("/auth/login", { email, password });
    saveSession(data);
    return data;
  },
  register: async (payload: { name: string; email: string; password: string }) => {
    const { data } = await api.post<AuthSession>("/auth/register", {
      ...payload,
      role: "GUEST",
    });
    saveSession(data);
    return data;
  },
  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      clearSession();
    }
  },
  me: async () => {
    const { data } = await api.get<{ success: boolean; user: ApiUser }>("/auth/me");
    const user = normalizeUser(data.user);
    localStorage.setItem("currentUser", JSON.stringify(user));
    return user;
  },
};

export const visitApi = {
  hosts: async () => {
    const { data } = await api.get<{ success: boolean; hosts: ApiHost[] }>("/visits/hosts");
    return data.hosts;
  },
  myVisits: async () => {
    const { data } = await api.get<{ success: boolean; visits: ApiVisit[] }>("/visits/my");
    return data.visits;
  },
  create: async (payload: {
    hostId: string;
    purposeOfVisit: string;
    visitDate: string;
    visitTimeSlot: string;
    gate: string;
    guestNote?: string;
  }) => {
    const { data } = await api.post<{ success: boolean; visit: ApiVisit }>("/visits", payload);
    return data.visit;
  },
};

export const adminApi = {
  stats: async () => {
    const { data } = await api.get<{ success: boolean; stats: Record<string, number> }>("/admin/stats");
    return data.stats;
  },
  visits: async () => {
    const { data } = await api.get<{ success: boolean; visits: ApiVisit[] }>("/admin/visits");
    return data.visits;
  },
  approveVisit: async (id: string) => {
    const { data } = await api.patch<{ success: boolean; visit: ApiVisit }>(`/admin/visits/${id}/approve`, {});
    return data.visit;
  },
  rejectVisit: async (id: string, reason = "Rejected by admin") => {
    const { data } = await api.patch<{ success: boolean; visit: ApiVisit }>(`/admin/visits/${id}/reject`, { reason });
    return data.visit;
  },
};

export const hostApi = {
  stats: async () => {
    const { data } = await api.get<{ success: boolean; stats: Record<string, number> }>("/host/dashboard");
    return data.stats;
  },
  requests: async () => {
    const { data } = await api.get<{ success: boolean; visits: ApiVisit[] }>("/host/requests");
    return data.visits;
  },
  approveVisit: async (id: string) => {
    const { data } = await api.patch<{ success: boolean; visit: ApiVisit }>(`/host/requests/${id}/approve`, {});
    return data.visit;
  },
  rejectVisit: async (id: string, reason = "Rejected by host") => {
    const { data } = await api.patch<{ success: boolean; visit: ApiVisit }>(`/host/requests/${id}/reject`, { reason });
    return data.visit;
  },
};

export const guardApi = {
  scan: async (qrToken: string) => {
    const { data } = await api.post("/guard/scan", { qrToken });
    return data;
  },
};

export default api;
