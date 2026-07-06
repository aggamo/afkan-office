import type { ApiAgency, ApiWorker } from "@/lib/api";
import type { Agency, LocalizedText, ReservationStatus, Worker } from "@/types/worker";

const RELIGION_MAP: Record<string, LocalizedText> = {
  muslim: { ar: "مسلمة", en: "Muslim", am: "ሙስሊም" },
  christian: { ar: "مسيحية", en: "Christian", am: "ክርስቲያን" },
  other: { ar: "أخرى", en: "Other", am: "ሌላ" },
};

const MARITAL_MAP: Record<string, LocalizedText> = {
  single: { ar: "عزباء", en: "Single", am: "ያላገባች" },
  married: { ar: "متزوجة", en: "Married", am: "ያገባች" },
  divorced: { ar: "مطلقة", en: "Divorced", am: "የተፋታች" },
  widowed: { ar: "أرملة", en: "Widowed", am: "መበለት" },
};

function calcAge(dateOfBirth: string | null): number {
  if (!dateOfBirth) return 0;
  const dob = new Date(dateOfBirth);
  const diff = Date.now() - dob.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function levelFromProficiency(value: string | null): "basic" | "intermediate" | "fluent" {
  if (value === "basic" || value === "intermediate" || value === "fluent") return value;
  return "intermediate";
}

function levelFromSkill(value: string | null): "basic" | "intermediate" | "expert" {
  if (value === "basic" || value === "intermediate" || value === "expert") return value;
  return "basic";
}

export function adaptWorker(api: ApiWorker): Worker {
  return {
    id: String(api.id),
    internalNumber: api.internal_number,
    photo: api.full_name.en || api.full_name.ar,
    age: calcAge(api.date_of_birth),
    nationality: api.nationality
      ? { ar: api.nationality.name_ar, en: api.nationality.name_en, am: api.nationality.name_am }
      : { ar: "—", en: "—", am: "—" },
    gender: api.gender,
    maritalStatus: api.marital_status ? MARITAL_MAP[api.marital_status] ?? MARITAL_MAP.single : MARITAL_MAP.single,
    childrenCount: api.number_of_children ?? 0,
    religion: api.religion ? RELIGION_MAP[api.religion] ?? RELIGION_MAP.other : RELIGION_MAP.other,
    experienceYears: api.experience_years ?? 0,
    languages: (api.languages ?? []).map((l) => ({
      name: { ar: l.name_ar, en: l.name_en, am: l.name_am },
      level: levelFromProficiency(l.proficiency),
    })),
    skills: (api.skills ?? []).map((s) => ({
      name: { ar: s.name_ar, en: s.name_en, am: s.name_am },
      level: levelFromSkill(s.level),
    })),
    readinessScore: api.readiness_score ? Math.round(Number(api.readiness_score)) : 0,
    reservationStatus: api.reservation_status as ReservationStatus,
  };
}

export function adaptAgency(api: ApiAgency): Agency {
  return {
    id: String(api.id),
    name: api.name,
    logo: api.name.slice(0, 2).toUpperCase(),
    city: api.city ?? "",
    country: api.country ?? "",
    licenseNumber: api.license_number,
    phone: "",
    email: "",
    rating: Number(api.rating),
    completedCases: api.completed_cases,
  };
}
