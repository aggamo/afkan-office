<?php

namespace Database\Seeders;

use App\Models\Country;
use App\Models\DocumentType;
use App\Models\Language;
use App\Models\NotificationChannel;
use App\Models\RecruitmentStage;
use App\Models\Skill;
use App\Models\WorkerType;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MasterDataSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->seedCountries();
        $this->seedLanguages();
        $this->seedSkills();
        $this->seedDocumentTypes();
        $this->seedWorkerTypes();
        $this->seedRecruitmentStages();
        $this->seedNotificationChannels();
    }

    private function seedCountries(): void
    {
        $countries = [
            ['iso_code' => 'ET', 'name_ar' => 'إثيوبيا', 'name_en' => 'Ethiopia', 'name_am' => 'ኢትዮጵያ'],
            ['iso_code' => 'SA', 'name_ar' => 'السعودية', 'name_en' => 'Saudi Arabia', 'name_am' => 'ሳዑዲ አረቢያ'],
        ];

        foreach ($countries as $i => $data) {
            Country::firstOrCreate(['iso_code' => $data['iso_code']], $data + ['sort_order' => $i]);
        }
    }

    private function seedLanguages(): void
    {
        $languages = [
            ['slug' => 'arabic', 'name_ar' => 'العربية', 'name_en' => 'Arabic', 'name_am' => 'አረብኛ'],
            ['slug' => 'english', 'name_ar' => 'الإنجليزية', 'name_en' => 'English', 'name_am' => 'እንግሊዝኛ'],
            ['slug' => 'amharic', 'name_ar' => 'الأمهرية', 'name_en' => 'Amharic', 'name_am' => 'አማርኛ'],
        ];

        foreach ($languages as $i => $data) {
            Language::firstOrCreate(['slug' => $data['slug']], $data + ['sort_order' => $i]);
        }
    }

    private function seedSkills(): void
    {
        $skills = [
            ['slug' => 'cooking', 'name_ar' => 'الطبخ', 'name_en' => 'Cooking', 'name_am' => 'ምግብ ማብሰል'],
            ['slug' => 'cleaning', 'name_ar' => 'التنظيف', 'name_en' => 'Cleaning', 'name_am' => 'ጽዳት'],
            ['slug' => 'childcare', 'name_ar' => 'رعاية الأطفال', 'name_en' => 'Childcare', 'name_am' => 'የልጆች እንክብካቤ'],
            ['slug' => 'elderly_care', 'name_ar' => 'رعاية المسنين', 'name_en' => 'Elderly Care', 'name_am' => 'የአዛውንት እንክብካቤ'],
            ['slug' => 'driving', 'name_ar' => 'القيادة', 'name_en' => 'Driving', 'name_am' => 'መንዳት'],
        ];

        foreach ($skills as $i => $data) {
            Skill::firstOrCreate(['slug' => $data['slug']], $data + ['sort_order' => $i]);
        }
    }

    private function seedDocumentTypes(): void
    {
        $types = [
            ['slug' => 'passport', 'name_ar' => 'جواز السفر', 'name_en' => 'Passport', 'name_am' => 'ፓስፖርት', 'is_required' => true, 'is_public' => false],
            ['slug' => 'photo', 'name_ar' => 'صورة شخصية', 'name_en' => 'Photo', 'name_am' => 'ፎቶ', 'is_required' => true, 'is_public' => true],
            ['slug' => 'medical_report', 'name_ar' => 'التقرير الطبي', 'name_en' => 'Medical Report', 'name_am' => 'የሕክምና ሪፖርት', 'is_required' => true, 'is_public' => false],
            ['slug' => 'visa', 'name_ar' => 'التأشيرة', 'name_en' => 'Visa', 'name_am' => 'ቪዛ', 'is_required' => false, 'is_public' => false],
        ];

        foreach ($types as $i => $data) {
            DocumentType::firstOrCreate(['slug' => $data['slug']], $data + ['sort_order' => $i]);
        }
    }

    private function seedWorkerTypes(): void
    {
        $types = [
            ['slug' => 'domestic_worker', 'name_ar' => 'عاملة منزلية', 'name_en' => 'Domestic Worker', 'name_am' => 'የቤት ሰራተኛ'],
            ['slug' => 'driver', 'name_ar' => 'سائق', 'name_en' => 'Driver', 'name_am' => 'ሹፍር'],
            ['slug' => 'caregiver', 'name_ar' => 'مربية/مرافقة', 'name_en' => 'Caregiver', 'name_am' => 'ተንከባካቢ'],
        ];

        foreach ($types as $i => $data) {
            WorkerType::firstOrCreate(['slug' => $data['slug']], $data + ['sort_order' => $i]);
        }
    }

    /**
     * The 17 official recruitment stages (Document 8). All are core stages that
     * cannot be deleted; sla_days feeds Smart ETA and delay detection.
     */
    private function seedRecruitmentStages(): void
    {
        $stages = [
            ['slug' => 'file_received', 'name_ar' => 'استلام الملف', 'name_en' => 'File Received', 'name_am' => 'ፋይል ተቀብሏል', 'sla_days' => 1, 'color' => '#0B6B3A'],
            ['slug' => 'medical_examination', 'name_ar' => 'الفحص الطبي', 'name_en' => 'Medical Examination', 'name_am' => 'የሕክምና ምርመራ', 'sla_days' => 2, 'color' => '#0B6B3A'],
            ['slug' => 'waiting_medical_result', 'name_ar' => 'انتظار نتيجة الفحص', 'name_en' => 'Waiting Medical Result', 'name_am' => 'የሕክምና ውጤት በመጠበቅ', 'sla_days' => 3, 'color' => '#C8A951'],
            ['slug' => 'fingerprint_appointment', 'name_ar' => 'موعد البصمة', 'name_en' => 'Fingerprint Appointment', 'name_am' => 'የጣት አሻራ ቀጠሮ', 'sla_days' => 3, 'color' => '#0B6B3A'],
            ['slug' => 'fingerprint_completed', 'name_ar' => 'اكتمال البصمة', 'name_en' => 'Fingerprint Completed', 'name_am' => 'የጣት አሻራ ተጠናቅቋል', 'sla_days' => 1, 'color' => '#0B6B3A'],
            ['slug' => 'sent_to_embassy', 'name_ar' => 'إرسال إلى السفارة', 'name_en' => 'Sent to Embassy', 'name_am' => 'ወደ ኤምባሲ ተልኳል', 'sla_days' => 2, 'color' => '#0B6B3A'],
            ['slug' => 'waiting_embassy_approval', 'name_ar' => 'انتظار موافقة السفارة', 'name_en' => 'Waiting Embassy Approval', 'name_am' => 'የኤምባሲ ማጽደቅ በመጠበቅ', 'sla_days' => 10, 'color' => '#C8A951'],
            ['slug' => 'visa_issued', 'name_ar' => 'صدور التأشيرة', 'name_en' => 'Visa Issued', 'name_am' => 'ቪዛ ወጥቷል', 'sla_days' => 2, 'color' => '#0B6B3A'],
            ['slug' => 'passport_returned', 'name_ar' => 'استلام الجواز', 'name_en' => 'Passport Returned', 'name_am' => 'ፓስፖርት ተመልሷል', 'sla_days' => 2, 'color' => '#0B6B3A'],
            ['slug' => 'labor_office_processing', 'name_ar' => 'إجراءات مكتب العمل', 'name_en' => 'Labor Office Processing', 'name_am' => 'የሠራተኛ ቢሮ ሂደት', 'sla_days' => 5, 'color' => '#0B6B3A'],
            ['slug' => 'travel_permit', 'name_ar' => 'تصريح السفر', 'name_en' => 'Travel Permit', 'name_am' => 'የጉዞ ፍቃድ', 'sla_days' => 3, 'color' => '#0B6B3A'],
            ['slug' => 'waiting_flight', 'name_ar' => 'انتظار الرحلة', 'name_en' => 'Waiting Flight', 'name_am' => 'በረራ በመጠበቅ', 'sla_days' => 4, 'color' => '#C8A951'],
            ['slug' => 'flight_confirmed', 'name_ar' => 'تأكيد الرحلة', 'name_en' => 'Flight Confirmed', 'name_am' => 'በረራ ተረጋግጧል', 'sla_days' => 2, 'color' => '#0B6B3A'],
            ['slug' => 'documents_delivered', 'name_ar' => 'تسليم الوثائق', 'name_en' => 'Documents Delivered', 'name_am' => 'ሰነዶች ተሰጥተዋል', 'sla_days' => 1, 'color' => '#0B6B3A'],
            ['slug' => 'worker_at_airport', 'name_ar' => 'العاملة في المطار', 'name_en' => 'Worker at Airport', 'name_am' => 'ሰራተኛዋ በአየር ማረፊያ', 'sla_days' => 1, 'color' => '#2563EB'],
            ['slug' => 'worker_arrived', 'name_ar' => 'وصول العاملة', 'name_en' => 'Worker Arrived', 'name_am' => 'ሰራተኛዋ ደርሳለች', 'sla_days' => 1, 'color' => '#2563EB'],
            ['slug' => 'warranty_period', 'name_ar' => 'فترة الضمان (90 يوماً)', 'name_en' => 'Warranty Period (90 Days)', 'name_am' => 'የዋስትና ጊዜ (90 ቀናት)', 'sla_days' => 90, 'color' => '#7C3AED'],
        ];

        // Document types that should be on file by the time a stage is reached.
        $required = [
            'file_received' => ['passport', 'photo'],
            'medical_examination' => ['medical_report'],
            'waiting_medical_result' => ['medical_report'],
            'visa_issued' => ['visa'],
            'passport_returned' => ['passport'],
            'documents_delivered' => ['passport', 'visa'],
        ];

        foreach ($stages as $index => $data) {
            RecruitmentStage::updateOrCreate(
                ['slug' => $data['slug']],
                array_merge($data, [
                    'step_number' => $index + 1,
                    'is_core' => true,
                    'is_public' => true,
                    'is_active' => true,
                    'required_document_slugs' => $required[$data['slug']] ?? null,
                ])
            );
        }
    }

    private function seedNotificationChannels(): void
    {
        $channels = [
            ['slug' => 'email', 'name_ar' => 'البريد الإلكتروني', 'name_en' => 'Email', 'name_am' => 'ኢሜል'],
            ['slug' => 'sms', 'name_ar' => 'رسالة نصية', 'name_en' => 'SMS', 'name_am' => 'ኤስኤምኤስ'],
            ['slug' => 'whatsapp', 'name_ar' => 'واتساب', 'name_en' => 'WhatsApp', 'name_am' => 'ዋትስአፕ'],
            ['slug' => 'telegram', 'name_ar' => 'تيليجرام', 'name_en' => 'Telegram', 'name_am' => 'ቴሌግራም'],
            ['slug' => 'in_app', 'name_ar' => 'إشعار داخل الموقع', 'name_en' => 'In-app', 'name_am' => 'በመተግበሪያ ውስጥ'],
        ];

        foreach ($channels as $data) {
            NotificationChannel::firstOrCreate(['slug' => $data['slug']], $data);
        }
    }
}
