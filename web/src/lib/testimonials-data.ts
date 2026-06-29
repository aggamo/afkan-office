import type { Locale } from "@/i18n/config";

const TESTIMONIALS: Record<Locale, { name: string; role: string; text: string }[]> = {
  ar: [
    { name: "أبو محمد العتيبي", role: "عميل فردي - الرياض", text: "تجربة ممتازة وسهلة، تابعت طلبي خطوة بخطوة حتى وصول العاملة." },
    { name: "مكتب الفيصل للاستقدام", role: "مكتب شريك", text: "منصة أفكان سهّلت علينا التواصل مع العملاء وتقليل وقت المعالجة." },
    { name: "أم سارة", role: "عميلة - جدة", text: "الشفافية في الإجراءات والمتابعة المستمرة أعطتني ثقة كبيرة." },
  ],
  en: [
    { name: "Abu Mohammed Al-Otaibi", role: "Individual Customer - Riyadh", text: "Excellent and easy experience, I tracked my request step by step until arrival." },
    { name: "Al Faisal Recruitment", role: "Partner Agency", text: "The Afkan platform made it easier to communicate with customers and reduced processing time." },
    { name: "Umm Sarah", role: "Customer - Jeddah", text: "The transparency of the process and continuous follow-up gave me great confidence." },
  ],
  am: [
    { name: "አቡ መሐመድ አል-ኦታይቢ", role: "ግል ደንበኛ - ሪያድ", text: "በጣም ጥሩ እና ቀላል ተሞክሮ ነበር፣ ማመልከቻዬን እስከ መድረሻ ድረስ ተከትያለሁ።" },
    { name: "አል ፋይሳል ቅጥር ድርጅት", role: "የስራ ተባባሪ ኤጀንሲ", text: "የአፍካን መድረክ ከደንበኞች ጋር ያለንን ግንኙነት አቅልሎታል እና ጊዜ ቀንሷል።" },
    { name: "ኡም ሳራ", role: "ደንበኛ - ጅዳ", text: "የሂደቱ ግልጽነት እና ቀጣይ ክትትል ትልቅ መተማመንን ሰጥቶኛል።" },
  ],
};

export function getTestimonials(locale: Locale) {
  return TESTIMONIALS[locale];
}
