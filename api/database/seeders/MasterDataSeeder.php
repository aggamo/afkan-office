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

    private function seedRecruitmentStages(): void
    {
        $stages = [
            ['slug' => 'registration', 'step_number' => 1, 'name_ar' => 'التسجيل', 'name_en' => 'Registration', 'name_am' => 'ምዝገባ'],
            ['slug' => 'medical_check', 'step_number' => 2, 'name_ar' => 'الفحص الطبي', 'name_en' => 'Medical Check', 'name_am' => 'የሕክምና ምርመራ'],
            ['slug' => 'training', 'step_number' => 3, 'name_ar' => 'التدريب', 'name_en' => 'Training', 'name_am' => 'ስልጠና'],
            ['slug' => 'documentation', 'step_number' => 4, 'name_ar' => 'استكمال الوثائق', 'name_en' => 'Documentation', 'name_am' => 'ሰነዶች'],
            ['slug' => 'visa_processing', 'step_number' => 5, 'name_ar' => 'إجراءات التأشيرة', 'name_en' => 'Visa Processing', 'name_am' => 'ቪዛ ሂደት'],
            ['slug' => 'travel_arrangement', 'step_number' => 6, 'name_ar' => 'ترتيب السفر', 'name_en' => 'Travel Arrangement', 'name_am' => 'የጉዞ ዝግጅት'],
            ['slug' => 'deployed', 'step_number' => 7, 'name_ar' => 'تم السفر', 'name_en' => 'Deployed', 'name_am' => 'ተሰማርቷል'],
        ];

        foreach ($stages as $data) {
            RecruitmentStage::firstOrCreate(['slug' => $data['slug']], $data);
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
