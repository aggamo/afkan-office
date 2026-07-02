import { ApiError, type ApiEnvelope, type ApiTimelineStage } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function customerRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
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

export type CustomerDashboard = {
  active_reservations: number;
  pending_authorization: number;
  in_recruitment: number;
  completed: number;
  favorites: number;
};

export type AuthorizationStatus = "none" | "pending" | "accepted" | "rejected";
export type ReservationStatus = "active" | "converted" | "expired" | "cancelled" | "completed";

export type CustomerReservation = {
  id: number;
  uuid: string;
  worker_id: number;
  reserved_by_type: "customer" | "agency";
  status: ReservationStatus;
  authorization_status: AuthorizationStatus;
  authorized_agency_id: number | null;
  reserved_at: string | null;
  expires_at: string | null;
  worker?: {
    id: number;
    internal_number: string;
    full_name: { ar: string; en: string; am: string };
    reservation_status: string;
  };
  authorized_agency?: { id: number; name: string; city: string | null; rating: string } | null;
};

export type CustomerProfile = {
  name: string;
  email: string;
  phone: string | null;
  national_id: string | null;
  country: string | null;
  city: string | null;
};

export function fetchCustomerDashboard() {
  return customerRequest<CustomerDashboard>("/customer/dashboard");
}

export function fetchCustomerReservations() {
  return customerRequest<CustomerReservation[]>("/customer/reservations");
}

export function reserveWorker(workerId: number) {
  return customerRequest<CustomerReservation>("/reservations/customer", {
    method: "POST",
    body: JSON.stringify({ worker_id: workerId }),
  });
}

export function authorizeReservationAgency(reservationId: number, agencyId: number) {
  return customerRequest<CustomerReservation>(`/reservations/${reservationId}/authorize`, {
    method: "POST",
    body: JSON.stringify({ agency_id: agencyId }),
  });
}

export function cancelReservation(reservationId: number) {
  return customerRequest<CustomerReservation>(`/reservations/${reservationId}/cancel`, { method: "POST" });
}

export function fetchCustomerProfile() {
  return customerRequest<CustomerProfile>("/customer/profile");
}

export function updateCustomerProfile(payload: Partial<Pick<CustomerProfile, "name" | "phone" | "country" | "city">>) {
  return customerRequest<null>("/customer/profile", { method: "PUT", body: JSON.stringify(payload) });
}

export type Notification = {
  id: number;
  uuid: string;
  event: string;
  title: { ar: string; en: string; am: string };
  body: { ar: string | null; en: string | null; am: string | null };
  status: string;
  read_at: string | null;
  created_at: string | null;
};

export type NotificationsPage = {
  items: Notification[];
  meta: { current_page: number; per_page: number; total: number; last_page: number };
};

export function fetchNotifications(page = 1, perPage = 20) {
  return customerRequest<NotificationsPage>(`/notifications?page=${page}&per_page=${perPage}`);
}

export function markNotificationRead(id: number) {
  return customerRequest<Notification>(`/notifications/${id}/read`, { method: "POST" });
}

export type CustomerRecruitment = {
  worker: { internal_number: string; tracking_number: string | null; full_name: { ar: string; en: string; am: string } };
  agency: { name: string; city: string | null } | null;
  reservation_status: string;
  progress: number;
  current_stage: { name: { ar: string; en: string; am: string } } | null;
  eta: { estimated_completion: string | null; remaining_days: number; confidence: string };
  timeline: ApiTimelineStage[];
} | null;

export function fetchCustomerRecruitment() {
  return customerRequest<CustomerRecruitment>("/customer/recruitment");
}

export type CustomerDocument = {
  id: number;
  uuid: string;
  category: "passport" | "national_id" | "family" | "other";
  original_name: string;
  mime_type: string | null;
  size: number;
  status: "pending" | "verified" | "rejected";
  created_at: string | null;
};

export function fetchCustomerDocuments() {
  return customerRequest<CustomerDocument[]>("/customer/documents");
}

export async function uploadCustomerDocument(category: string, file: File): Promise<CustomerDocument> {
  const token = getAuthToken();
  const form = new FormData();
  form.append("category", category);
  form.append("file", file);
  const res = await fetch(`${API_BASE_URL}/customer/documents`, {
    method: "POST",
    headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: form,
  });
  const body = (await res.json()) as ApiEnvelope<CustomerDocument>;
  if (!res.ok || body.status === "error") {
    throw new ApiError(body.message ?? "Upload failed", res.status, body.errors);
  }
  return body.data;
}

export function deleteCustomerDocument(id: number) {
  return customerRequest<null>(`/customer/documents/${id}`, { method: "DELETE" });
}

export type ChatMessage = {
  id: number;
  body: string;
  is_from_staff: boolean;
  sender: string | null;
  created_at: string | null;
};

export function fetchCustomerMessages() {
  return customerRequest<ChatMessage[]>("/customer/messages");
}

export function sendCustomerMessage(body: string) {
  return customerRequest<ChatMessage>("/customer/messages", { method: "POST", body: JSON.stringify({ body }) });
}

export async function downloadCustomerDocument(doc: CustomerDocument): Promise<void> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/customer/documents/${doc.id}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new ApiError("Download failed", res.status);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = doc.original_name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
