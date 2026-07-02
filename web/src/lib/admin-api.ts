import { ApiError, type ApiEnvelope } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const body = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || body.status === "error") {
    throw new ApiError(body.message ?? "Request failed", res.status, body.errors);
  }
  return body.data;
}

export type RefFieldType = "text" | "slug" | "boolean" | "number" | "relation";

export type RefOption = { id: number; name_ar: string; name_en: string; name_am: string };

export type RefField = {
  key: string;
  type: RefFieldType;
  required?: boolean;
  unique?: boolean;
  translatable?: boolean;
  max?: number;
  uppercase?: boolean;
  default?: string | number | boolean;
  relation?: string;
  options?: RefOption[];
};

export type RefDefinition = {
  key: string;
  label: { ar: string; en: string; am: string };
  icon: string | null;
  sortable: boolean;
  fields: RefField[];
};

export type RefRecord = Record<string, unknown> & { id: number; in_use: boolean };

export function fetchReferenceResources() {
  return adminRequest<RefDefinition[]>("/admin/reference");
}

export function fetchReferenceItems(resource: string, q?: string) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  return adminRequest<{ items: RefRecord[]; definition: RefDefinition }>(`/admin/reference/${resource}${qs}`);
}

export function createReferenceItem(resource: string, payload: Record<string, unknown>) {
  return adminRequest<RefRecord>(`/admin/reference/${resource}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateReferenceItem(resource: string, id: number, payload: Record<string, unknown>) {
  return adminRequest<RefRecord>(`/admin/reference/${resource}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function toggleReferenceItem(resource: string, id: number) {
  return adminRequest<RefRecord>(`/admin/reference/${resource}/${id}/toggle`, { method: "POST" });
}

export function deleteReferenceItem(resource: string, id: number) {
  return adminRequest<null>(`/admin/reference/${resource}/${id}`, { method: "DELETE" });
}

export function reorderReference(resource: string, order: number[]) {
  return adminRequest<null>(`/admin/reference/${resource}/reorder`, {
    method: "PUT",
    body: JSON.stringify({ order }),
  });
}

// ---- Dashboard & Activity ----

export type ActivityLog = {
  id: number;
  action: string;
  auditable_type: string;
  auditable_id: number | null;
  user: string | null;
  ip_address: string | null;
  created_at: string | null;
};

export type DashboardData = {
  workers: {
    total: number;
    available: number;
    reserved_customer: number;
    reserved_agency: number;
    hired: number;
    unavailable: number;
    published: number;
    unpublished: number;
  };
  reservations: {
    active: number;
    active_customer: number;
    active_agency: number;
    created_today: number;
    expiring_today: number;
    expired_total: number;
    converted_total: number;
    conversion_rate: number;
  };
  finance: {
    currency: string;
    outstanding_count: number;
    outstanding_amount: number;
    paid_this_month_count: number;
    paid_this_month_amount: number;
    revenue_total: number;
    draft_count: number;
  };
  entities: {
    agencies: number;
    agencies_verified: number;
    customers: number;
    employees: number;
  };
  workflow: {
    in_recruitment: number;
    delayed: number;
    warranty_active: number;
    attention: {
      worker_id: number;
      internal_number: string;
      tracking_number: string | null;
      full_name: { ar: string; en: string; am: string };
      stage: { ar: string; en: string; am: string };
      days_overdue: number;
    }[];
  };
  charts: {
    worker_status: { key: string; count: number }[];
    monthly: { month: string; workers_created: number; completed: number }[];
    top_agencies: { id: number; name: string; completed_cases: number; rating: number; active_reservations: number }[];
  };
  recent_activity: ActivityLog[];
};

export type ActivityPage = {
  items: ActivityLog[];
  meta: { current_page: number; per_page: number; total: number; last_page: number };
};

export function fetchDashboard() {
  return adminRequest<DashboardData>("/admin/dashboard");
}

export function fetchActivity(page = 1, perPage = 25, action?: string) {
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  if (action) params.set("action", action);
  return adminRequest<ActivityPage>(`/admin/activity?${params.toString()}`);
}

// ---- Recruitment Workflow ----

export type LocalizedName = { ar: string; en: string; am: string };

export type WorkflowStage = {
  id: number;
  slug: string;
  step_number: number;
  name_ar: string;
  name_en: string;
  name_am: string;
  color: string | null;
  sla_days: number | null;
  is_core: boolean;
  is_public: boolean;
};

export type WorkflowTimelineStage = {
  step_number: number;
  slug: string;
  name: LocalizedName;
  color: string | null;
  status: "completed" | "current" | "delayed" | "upcoming";
  entered_at: string | null;
};

export type WorkflowHistoryEntry = {
  id: number;
  from: LocalizedName | null;
  to: LocalizedName | null;
  by: string | null;
  notes: string | null;
  entered_at: string | null;
};

export type WorkerWorkflow = {
  worker: { id: number; internal_number: string; tracking_number: string | null; full_name: LocalizedName };
  current_stage: { step_number: number; slug: string; name: LocalizedName } | null;
  progress: number;
  eta: { estimated_completion: string | null; remaining_days: number; confidence: string };
  is_delayed: boolean;
  warranty: { started_at: string | null; ends_at: string | null; remaining_days: number };
  required_documents: { slug: string; name: LocalizedName; present: boolean }[];
  timeline: WorkflowTimelineStage[];
  history: WorkflowHistoryEntry[];
};

export type AdminWorkerListItem = {
  id: number;
  internal_number: string;
  tracking_number?: string | null;
  full_name_ar: string;
  full_name_en: string;
  full_name_am: string;
  reservation_status: string;
  current_recruitment_stage?: { step_number: number; name_ar: string; name_en: string; name_am: string } | null;
};

export function fetchWorkflowStages() {
  return adminRequest<WorkflowStage[]>("/admin/stages");
}

export function fetchAdminWorkers(q?: string) {
  const qs = q ? `?q=${encodeURIComponent(q)}&per_page=50` : "?per_page=50";
  return adminRequest<{ items: AdminWorkerListItem[]; meta: unknown }>(`/admin/workers${qs}`);
}

export function fetchWorkerWorkflow(workerId: number) {
  return adminRequest<WorkerWorkflow>(`/admin/workers/${workerId}/workflow`);
}

export function startWorkerWorkflow(workerId: number) {
  return adminRequest<WorkerWorkflow>(`/admin/workers/${workerId}/workflow/start`, { method: "POST" });
}

export function advanceWorkerStage(workerId: number, stageId: number, notes?: string) {
  return adminRequest<WorkerWorkflow>(`/admin/workers/${workerId}/workflow/advance`, {
    method: "POST",
    body: JSON.stringify({ stage_id: stageId, notes: notes || undefined }),
  });
}

// ---- Support Messages ----

export type MessageThread = {
  customer_id: number;
  name: string | null;
  unread: number;
  last_body: string | null;
  last_at: string | null;
};

export type ChatMessage = {
  id: number;
  body: string;
  is_from_staff: boolean;
  sender: string | null;
  created_at: string | null;
};

export function fetchMessageThreads() {
  return adminRequest<MessageThread[]>("/admin/messages");
}

export function fetchMessageThread(customerId: number) {
  return adminRequest<{ customer: { id: number; name: string | null }; messages: ChatMessage[] }>(
    `/admin/messages/${customerId}`,
  );
}

export function sendAdminMessage(customerId: number, body: string) {
  return adminRequest<ChatMessage>(`/admin/messages/${customerId}`, { method: "POST", body: JSON.stringify({ body }) });
}

// ---- Review moderation ----

export type AdminReview = {
  id: number;
  rating: number;
  comment: string | null;
  status: "pending" | "approved" | "rejected";
  agency: string | null;
  customer: string | null;
  created_at: string | null;
};

export function fetchReviews(status?: string) {
  const qs = status ? `?status=${status}` : "";
  return adminRequest<AdminReview[]>(`/admin/reviews${qs}`);
}

export function moderateReview(id: number, status: "approved" | "rejected") {
  return adminRequest<{ id: number; status: string }>(`/admin/reviews/${id}/moderate`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}

// ---- Performance analytics ----

export type Analytics = {
  stages: {
    slug: string;
    name: { ar: string; en: string; am: string };
    avg_days: number;
    sla_days: number | null;
    count: number;
  }[];
  overall_avg_days: number;
  completed_count: number;
};

export function fetchAnalytics() {
  return adminRequest<Analytics>("/admin/analytics");
}

export type AdminAgency = {
  id: number;
  name: string;
  license_number: string;
  country: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  rating: number;
  completed_cases: number;
  is_verified: boolean;
  is_active: boolean;
  workers_count: number;
  active_reservations: number;
  created_at: string | null;
};

export function fetchAdminAgencies(q?: string, status?: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  const qs = params.toString();
  return adminRequest<AdminAgency[]>(`/admin/agencies${qs ? `?${qs}` : ""}`);
}

export function updateAgencyStatus(id: number, payload: { is_verified?: boolean; is_active?: boolean }) {
  return adminRequest<AdminAgency>(`/admin/agencies/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function downloadExport(resource: "workers" | "reservations" | "reviews"): Promise<void> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/admin/export/${resource}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new ApiError("Export failed", res.status);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `afkan-${resource}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
