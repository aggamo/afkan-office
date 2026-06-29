import type { Agency, Worker } from "@/types/worker";

const FIRST_NAMES = [
  "Almaz", "Tigist", "Hiwot", "Selam", "Mihret", "Sara", "Bethlehem", "Eden",
  "Rahel", "Yordanos", "Genet", "Marta",
];
const LAST_NAMES = [
  "Tesfaye", "Bekele", "Alemu", "Girma", "Wolde", "Haile", "Abebe", "Kebede",
];

const LANGUAGE_POOL: { ar: string; en: string; am: string }[] = [
  { ar: "العربية", en: "Arabic", am: "አረብኛ" },
  { ar: "الإنجليزية", en: "English", am: "እንግሊዝኛ" },
  { ar: "الأمهرية", en: "Amharic", am: "አማርኛ" },
  { ar: "الأورومو", en: "Oromo", am: "ኦሮምኛ" },
];

const SKILL_POOL: { ar: string; en: string; am: string }[] = [
  { ar: "الطبخ", en: "Cooking", am: "ምግብ ማብሰል" },
  { ar: "الطبخ السعودي", en: "Saudi Cooking", am: "ሳዑዲ ምግብ ማብሰል" },
  { ar: "التنظيف", en: "Cleaning", am: "ጽዳት" },
  { ar: "رعاية الأطفال", en: "Child Care", am: "የልጆች እንክብካቤ" },
  { ar: "رعاية كبار السن", en: "Elderly Care", am: "የአዛውንት እንክብካቤ" },
  { ar: "الغسيل والكوي", en: "Laundry & Ironing", am: "ልብስ ማጠብና መተኮስ" },
];

const EDUCATION: { ar: string; en: string; am: string } = { ar: "ثانوية", en: "High School", am: "ሁለተኛ ደረጃ" };
const RELIGION: { ar: string; en: string; am: string } = { ar: "مسيحية أرثوذكسية", en: "Orthodox Christian", am: "ኦርቶዶክስ ክርስቲያን" };
const SINGLE: { ar: string; en: string; am: string } = { ar: "عزباء", en: "Single", am: "ያላገባች" };
const MARRIED: { ar: string; en: string; am: string } = { ar: "متزوجة", en: "Married", am: "ያገባች" };
const ETHIOPIA: { ar: string; en: string; am: string } = { ar: "إثيوبيا", en: "Ethiopia", am: "ኢትዮጵያ" };

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

const STATUSES: Worker["reservationStatus"][] = [
  "available",
  "available",
  "available",
  "reserved_agency",
  "reserved_customer",
  "in_progress",
];

export const workers: Worker[] = Array.from({ length: 24 }, (_, i) => {
  const rand = seededRandom(i + 1);
  const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
  const lastName = LAST_NAMES[i % LAST_NAMES.length];
  const age = 22 + Math.floor(rand() * 18);
  const experienceYears = Math.floor(rand() * 10);
  const status = STATUSES[i % STATUSES.length];

  const languages = LANGUAGE_POOL
    .filter((_, idx) => idx === 1 || rand() > 0.4)
    .slice(0, 3)
    .map((name) => ({
      name,
      level: (["basic", "intermediate", "fluent"] as const)[Math.floor(rand() * 3)],
    }));

  const skills = SKILL_POOL
    .filter(() => rand() > 0.35)
    .slice(0, 4)
    .map((name) => ({
      name,
      level: (["basic", "intermediate", "expert"] as const)[Math.floor(rand() * 3)],
    }));

  return {
    id: `w-${i + 1}`,
    internalNumber: `AFK-${(1000 + i).toString()}`,
    photo: `${firstName} ${lastName}`,
    age,
    nationality: ETHIOPIA,
    gender: "female",
    maritalStatus: rand() > 0.6 ? MARRIED : SINGLE,
    childrenCount: rand() > 0.6 ? Math.floor(rand() * 3) : 0,
    education: EDUCATION,
    religion: RELIGION,
    experienceYears,
    languages: languages.length ? languages : [LANGUAGE_POOL[1]].map((name) => ({ name, level: "intermediate" as const })),
    skills: skills.length ? skills : [SKILL_POOL[0]].map((name) => ({ name, level: "basic" as const })),
    readinessScore: 60 + Math.floor(rand() * 41),
    reservationStatus: status,
    reservedUntil:
      status === "reserved_agency" || status === "reserved_customer"
        ? new Date(Date.now() + (status === "reserved_agency" ? 72 : 24) * 60 * 60 * 1000).toISOString()
        : undefined,
    agencyId: status !== "available" ? `a-${(i % 6) + 1}` : undefined,
  };
});

export const agencies: Agency[] = [
  { id: "a-1", name: "Al Faisal Recruitment Co.", logo: "AF", city: "Riyadh", country: "Saudi Arabia", licenseNumber: "SA-10234", phone: "+966 11 234 5678", email: "info@alfaisal-rec.sa", website: "https://alfaisal-rec.sa", rating: 4.8, completedCases: 540 },
  { id: "a-2", name: "Gulf Home Staffing", logo: "GH", city: "Jeddah", country: "Saudi Arabia", licenseNumber: "SA-10456", phone: "+966 12 345 6789", email: "contact@gulfhome.sa", rating: 4.6, completedCases: 320 },
  { id: "a-3", name: "Najd Manpower Services", logo: "NM", city: "Dammam", country: "Saudi Arabia", licenseNumber: "SA-10789", phone: "+966 13 456 7890", email: "info@najdmanpower.sa", rating: 4.7, completedCases: 410 },
  { id: "a-4", name: "Al Madinah Recruitment", logo: "AM", city: "Medina", country: "Saudi Arabia", licenseNumber: "SA-10987", phone: "+966 14 567 8901", email: "support@almadinahrec.sa", rating: 4.5, completedCases: 275 },
  { id: "a-5", name: "Royal Home Care Agency", logo: "RH", city: "Riyadh", country: "Saudi Arabia", licenseNumber: "SA-11023", phone: "+966 11 765 4321", email: "info@royalhomecare.sa", rating: 4.9, completedCases: 612 },
  { id: "a-6", name: "Tabuk Domestic Staffing", logo: "TD", city: "Tabuk", country: "Saudi Arabia", licenseNumber: "SA-11250", phone: "+966 14 222 3344", email: "contact@tabukstaff.sa", rating: 4.4, completedCases: 198 },
];

export function getWorkerById(id: string) {
  return workers.find((w) => w.id === id);
}

export function getAgencyById(id: string) {
  return agencies.find((a) => a.id === id);
}
