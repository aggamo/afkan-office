export type ReservationStatus =
  | "available"
  | "reserved_agency"
  | "reserved_customer"
  | "in_progress";

export type LocalizedText = {
  ar: string;
  en: string;
  am: string;
};

export type Worker = {
  id: string;
  internalNumber: string;
  photo: string;
  age: number;
  nationality: LocalizedText;
  gender: "female" | "male";
  maritalStatus: LocalizedText;
  childrenCount: number;
  religion: LocalizedText;
  experienceYears: number;
  languages: { name: LocalizedText; level: "basic" | "intermediate" | "fluent" }[];
  skills: { name: LocalizedText; level: "basic" | "intermediate" | "expert" }[];
  readinessScore: number;
  reservationStatus: ReservationStatus;
  reservedUntil?: string;
  agencyId?: string;
  videoUrl?: string;
  education?: LocalizedText;
};


export type Agency = {
  id: string;
  name: string;
  logo: string;
  city: string;
  country: string;
  licenseNumber: string;
  phone: string;
  email: string;
  website?: string;
  rating: number;
  completedCases: number;
};
