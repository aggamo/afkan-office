<?php

use App\Models\City;
use App\Models\Country;
use App\Models\DocumentType;
use App\Models\Language;
use App\Models\NotificationChannel;
use App\Models\Skill;
use App\Models\WorkerType;

/*
|--------------------------------------------------------------------------
| Dynamic Reference Data Registry
|--------------------------------------------------------------------------
|
| Single source of truth for the master/reference data that staff can manage
| from the admin panel. Each entry drives BOTH backend validation and the
| dynamically rendered admin form on the frontend, so adding a new manageable
| reference type is a one-entry change here — no new controller or UI code.
|
| Field types understood by the generic controller and the admin UI:
|   - text     : short translatable/plain string
|   - slug     : unique machine identifier (lowercase, dashes/underscores)
|   - boolean  : on/off flag
|   - number   : non-negative integer (e.g. sort_order)
|   - relation : foreign key rendered as a select of another reference type
|
| Keys are kebab-case and used directly in the API path: /admin/reference/{key}
|
*/

return [

    'countries' => [
        'model' => Country::class,
        'label' => ['ar' => 'الدول', 'en' => 'Countries', 'am' => 'ሀገራት'],
        'icon' => 'globe',
        'searchable' => ['iso_code', 'name_ar', 'name_en', 'name_am'],
        'dependencies' => ['cities', 'workers'],
        'fields' => [
            ['key' => 'iso_code', 'type' => 'slug', 'required' => true, 'unique' => true, 'max' => 2, 'uppercase' => true],
            ['key' => 'name_ar', 'type' => 'text', 'required' => true, 'translatable' => true],
            ['key' => 'name_en', 'type' => 'text', 'required' => true, 'translatable' => true],
            ['key' => 'name_am', 'type' => 'text', 'required' => true, 'translatable' => true],
            ['key' => 'is_active', 'type' => 'boolean', 'default' => true],
            ['key' => 'sort_order', 'type' => 'number', 'default' => 0],
        ],
    ],

    'cities' => [
        'model' => City::class,
        'label' => ['ar' => 'المدن', 'en' => 'Cities', 'am' => 'ከተሞች'],
        'icon' => 'map-pin',
        'searchable' => ['name_ar', 'name_en', 'name_am'],
        'with' => ['country'],
        'dependencies' => [],
        'fields' => [
            ['key' => 'country_id', 'type' => 'relation', 'required' => true, 'relation' => 'countries', 'ref_model' => Country::class],
            ['key' => 'name_ar', 'type' => 'text', 'required' => true, 'translatable' => true],
            ['key' => 'name_en', 'type' => 'text', 'required' => true, 'translatable' => true],
            ['key' => 'name_am', 'type' => 'text', 'required' => true, 'translatable' => true],
            ['key' => 'is_active', 'type' => 'boolean', 'default' => true],
            ['key' => 'sort_order', 'type' => 'number', 'default' => 0],
        ],
    ],

    'languages' => [
        'model' => Language::class,
        'label' => ['ar' => 'اللغات', 'en' => 'Languages', 'am' => 'ቋንቋዎች'],
        'icon' => 'languages',
        'searchable' => ['slug', 'name_ar', 'name_en', 'name_am'],
        'dependencies' => ['workers'],
        'fields' => [
            ['key' => 'slug', 'type' => 'slug', 'required' => true, 'unique' => true, 'max' => 100],
            ['key' => 'name_ar', 'type' => 'text', 'required' => true, 'translatable' => true],
            ['key' => 'name_en', 'type' => 'text', 'required' => true, 'translatable' => true],
            ['key' => 'name_am', 'type' => 'text', 'required' => true, 'translatable' => true],
            ['key' => 'is_active', 'type' => 'boolean', 'default' => true],
            ['key' => 'sort_order', 'type' => 'number', 'default' => 0],
        ],
    ],

    'skills' => [
        'model' => Skill::class,
        'label' => ['ar' => 'المهارات', 'en' => 'Skills', 'am' => 'ችሎታዎች'],
        'icon' => 'sparkles',
        'searchable' => ['slug', 'name_ar', 'name_en', 'name_am'],
        'dependencies' => ['workers'],
        'fields' => [
            ['key' => 'slug', 'type' => 'slug', 'required' => true, 'unique' => true, 'max' => 100],
            ['key' => 'name_ar', 'type' => 'text', 'required' => true, 'translatable' => true],
            ['key' => 'name_en', 'type' => 'text', 'required' => true, 'translatable' => true],
            ['key' => 'name_am', 'type' => 'text', 'required' => true, 'translatable' => true],
            ['key' => 'is_active', 'type' => 'boolean', 'default' => true],
            ['key' => 'sort_order', 'type' => 'number', 'default' => 0],
        ],
    ],

    'worker-types' => [
        'model' => WorkerType::class,
        'label' => ['ar' => 'أنواع العاملات', 'en' => 'Worker Types', 'am' => 'የሰራተኛ ዓይነቶች'],
        'icon' => 'users',
        'searchable' => ['slug', 'name_ar', 'name_en', 'name_am'],
        'dependencies' => ['workers'],
        'fields' => [
            ['key' => 'slug', 'type' => 'slug', 'required' => true, 'unique' => true, 'max' => 100],
            ['key' => 'name_ar', 'type' => 'text', 'required' => true, 'translatable' => true],
            ['key' => 'name_en', 'type' => 'text', 'required' => true, 'translatable' => true],
            ['key' => 'name_am', 'type' => 'text', 'required' => true, 'translatable' => true],
            ['key' => 'is_active', 'type' => 'boolean', 'default' => true],
            ['key' => 'sort_order', 'type' => 'number', 'default' => 0],
        ],
    ],

    'document-types' => [
        'model' => DocumentType::class,
        'label' => ['ar' => 'أنواع الوثائق', 'en' => 'Document Types', 'am' => 'የሰነድ ዓይነቶች'],
        'icon' => 'file-text',
        'searchable' => ['slug', 'name_ar', 'name_en', 'name_am'],
        'dependencies' => ['documents'],
        'fields' => [
            ['key' => 'slug', 'type' => 'slug', 'required' => true, 'unique' => true, 'max' => 100],
            ['key' => 'name_ar', 'type' => 'text', 'required' => true, 'translatable' => true],
            ['key' => 'name_en', 'type' => 'text', 'required' => true, 'translatable' => true],
            ['key' => 'name_am', 'type' => 'text', 'required' => true, 'translatable' => true],
            ['key' => 'is_required', 'type' => 'boolean', 'default' => false],
            ['key' => 'is_public', 'type' => 'boolean', 'default' => false],
            ['key' => 'is_active', 'type' => 'boolean', 'default' => true],
            ['key' => 'sort_order', 'type' => 'number', 'default' => 0],
        ],
    ],

    'notification-channels' => [
        'model' => NotificationChannel::class,
        'label' => ['ar' => 'قنوات الإشعارات', 'en' => 'Notification Channels', 'am' => 'የማሳወቂያ መንገዶች'],
        'icon' => 'bell',
        'searchable' => ['slug', 'name_ar', 'name_en', 'name_am'],
        'dependencies' => [],
        'fields' => [
            ['key' => 'slug', 'type' => 'slug', 'required' => true, 'unique' => true, 'max' => 100],
            ['key' => 'name_ar', 'type' => 'text', 'required' => true, 'translatable' => true],
            ['key' => 'name_en', 'type' => 'text', 'required' => true, 'translatable' => true],
            ['key' => 'name_am', 'type' => 'text', 'required' => true, 'translatable' => true],
            ['key' => 'is_active', 'type' => 'boolean', 'default' => true],
        ],
    ],

];
