const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export type ApiEnvelope<T> = {
  status: "success" | "error";
  message: string;
  data: T;
  errors: unknown;
};

export type ApiPaginated<T> = {
  items: T[];
  meta: { current_page: number; per_page: number; total: number; last_page: number };
};

export class ApiError extends Error {
  constructor(message: string, public status: number, public errors: unknown = null) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const body = (await res.json()) as ApiEnvelope<T>;

  if (!res.ok || body.status === "error") {
    throw new ApiError(body.message ?? "Request failed", res.status, body.errors);
  }

  return body.data;
}

export type ApiLocalized = { name_ar: string; name_en: string; name_am: string };

export type ApiWorker = {
  id: number;
  uuid: string;
  internal_number: string;
  full_name: { ar: string; en: string; am: string };
  date_of_birth: string | null;
  gender: "male" | "female";
  nationality: (ApiLocalized & { id: number }) | null;
  worker_type: (ApiLocalized & { id: number }) | null;
  experience_years: number | null;
  height_cm: string | null;
  weight_kg: string | null;
  religion: string | null;
  marital_status: string | null;
  number_of_children: number | null;
  reservation_status: string;
  readiness_score: string | null;
  languages: { slug: string; name_ar: string; name_en: string; name_am: string; proficiency: string | null }[] | null;
  skills: { slug: string; name_ar: string; name_en: string; name_am: string; level: string | null }[] | null;
};

export type ApiAgency = {
  id: number;
  uuid: string;
  name: string;
  license_number: string;
  country: string | null;
  city: string | null;
  rating: string;
  completed_cases: number;
  is_verified: boolean;
};

export type ApiTrackResult = {
  internal_number: string;
  reservation_status: string;
  current_recruitment_stage: { slug: string; step_number: number; name_ar: string; name_en: string; name_am: string } | null;
};

export function fetchWorkers(params: Record<string, string | number | undefined> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const qs = query.toString();
  return request<ApiPaginated<ApiWorker>>(`/workers${qs ? `?${qs}` : ""}`, { cache: "no-store" });
}

export function fetchWorker(id: string | number) {
  return request<ApiWorker>(`/workers/${id}`, { cache: "no-store" });
}

export function fetchAgencies() {
  return request<ApiAgency[]>("/agencies", { cache: "no-store" });
}

export function trackWorker(internalNumber: string) {
  return request<ApiTrackResult>(`/workers/track?internal_number=${encodeURIComponent(internalNumber)}`, {
    cache: "no-store",
  });
}

export function login(email: string, password: string) {
  return request<{ user: { id: number; name: string; email: string; role: { slug: string } }; token: string }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
  );
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function fetchFavorites(token: string) {
  return request<ApiWorker[]>("/favorites", { cache: "no-store", headers: authHeaders(token) });
}

export function addFavorite(workerId: string | number, token: string) {
  return request<null>(`/favorites/${workerId}`, { method: "POST", headers: authHeaders(token) });
}

export function removeFavorite(workerId: string | number, token: string) {
  return request<null>(`/favorites/${workerId}`, { method: "DELETE", headers: authHeaders(token) });
}
