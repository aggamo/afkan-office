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
