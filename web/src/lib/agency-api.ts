import { ApiError, type ApiEnvelope } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function agencyRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
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

export type AgencyReservation = {
  id: number;
  uuid: string;
  authorization_status: string | null;
  status: string;
  expires_at: string | null;
  worker?: {
    id: number;
    internal_number: string;
    full_name: { ar: string; en: string; am: string };
  } | null;
};

export type AgencyAuthorization = {
  reservation: AgencyReservation;
  customer: { name: string | null; phone: string | null; country: string | null; city: string | null };
  expires_at: string | null;
};

export function fetchAgencyAuthorizations() {
  return agencyRequest<AgencyAuthorization[]>("/agency/authorizations");
}

export function acceptAuthorization(reservationId: number) {
  return agencyRequest<AgencyReservation>(`/agency/authorizations/${reservationId}/accept`, { method: "POST" });
}

export function rejectAuthorization(reservationId: number) {
  return agencyRequest<AgencyReservation>(`/agency/authorizations/${reservationId}/reject`, { method: "POST" });
}

export type AgencyInvoice = {
  id: number;
  invoice_number: string;
  worker: { id: number; internal_number: string; full_name_ar: string; full_name_en: string; full_name_am: string } | null;
  amount: string | number | null;
  currency: string | null;
  status: string;
  issued_at: string | null;
  paid_at: string | null;
  notes: string | null;
};

export function fetchAgencyInvoices(status?: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}&per_page=50` : "?per_page=50";
  return agencyRequest<{ items: AgencyInvoice[]; meta: unknown }>(`/agency/invoices${qs}`);
}
