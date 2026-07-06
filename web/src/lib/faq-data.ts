import type { Locale } from "@/i18n/config";

const FAQ: Record<Locale, { question: string; answer: string }[]> = {
  ar: [
    { question: "كم تستغرق عملية الاستقدام؟", answer: "تستغرق العملية عادة بين 30 و60 يومًا حسب الجاهزية والوثائق." },
    { question: "كيف أحجز عاملة؟", answer: "تصفح العاملات، اضغط على حجز الآن، ثم اختر مكتبًا سعوديًا معتمدًا لإكمال الإجراءات." },
    { question: "هل يمكنني تغيير المكتب المختار؟", answer: "نعم، إذا رفض المكتب الطلب يمكنك اختيار مكتب آخر معتمد." },
    { question: "كيف أتابع حالة طلبي؟", answer: "استخدم صفحة تتبع الطلب وأدخل رقم التتبع أو رقم الجواز." },
  ],
  en: [
    { question: "How long does recruitment take?", answer: "The process typically takes 30 to 60 days depending on readiness and documentation." },
    { question: "How do I reserve a worker?", answer: "Browse workers, click Reserve Now, then choose an approved Saudi agency to complete the process." },
    { question: "Can I change my selected agency?", answer: "Yes, if the agency rejects the request you can choose another approved agency." },
    { question: "How can I track my application?", answer: "Use the Track page and enter your tracking number or passport number." },
  ],
  am: [
    { question: "ቅጥር ምን ያህል ጊዜ ይወስዳል?", answer: "ሂደቱ በዝግጁነት እና በሰነድ ሁኔታ ላይ ተመስርቶ ከ30 እስከ 60 ቀናት ይወስዳል።" },
    { question: "ሰራተኛ እንዴት ይያዛል?", answer: "ሰራተኞችን ይዩ፣ አሁን ይያዙ ይጫኑ፣ ከዚያ ፈቃድ ያለው የሳዑዲ ኤጀንሲ ይምረጡ።" },
    { question: "የመረጥኩትን ኤጀንሲ መቀየር እችላለሁ?", answer: "አዎ፣ ኤጀንሲው ጥያቄውን ካልተቀበለ ሌላ ፈቃድ ያለው ኤጀንሲ መምረጥ ይችላሉ።" },
    { question: "ማመልከቻዬን እንዴት ልከታተል?", answer: "የመከታተያ ገጹን ይጠቀሙና የመከታተያ ቁጥር ወይም የፓስፖርት ቁጥር ያስገቡ።" },
  ],
};

export function getFaq(locale: Locale) {
  return FAQ[locale];
}
