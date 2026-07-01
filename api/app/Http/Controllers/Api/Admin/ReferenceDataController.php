<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Generic, registry-driven CRUD controller for all manageable reference
 * (master) data. A single implementation serves every resource declared in
 * config/reference_data.php, so adding a new manageable type never requires
 * touching this class — only the config registry.
 */
class ReferenceDataController extends Controller
{
    use ApiResponse;

    /**
     * Metadata for every manageable resource, used by the admin UI to render
     * navigation and forms dynamically (fields, relation options, flags).
     */
    public function resources()
    {
        $resources = collect(config('reference_data'))
            ->map(fn (array $def, string $key) => $this->publicDefinition($key, $def))
            ->values();

        return $this->success($resources);
    }

    public function index(Request $request, string $resource)
    {
        [$def, $error] = $this->resolve($resource);
        if ($error) {
            return $error;
        }

        /** @var class-string<Model> $model */
        $model = $def['model'];
        $query = $model::query();

        if (! empty($def['with'])) {
            $query->with($def['with']);
        }
        if (! empty($def['dependencies'])) {
            $query->withCount($def['dependencies']);
        }

        if ($request->filled('q')) {
            $term = '%'.$request->string('q').'%';
            $searchable = $def['searchable'] ?? [];
            $query->where(function ($q) use ($term, $searchable) {
                foreach ($searchable as $column) {
                    $q->orWhere($column, 'like', $term);
                }
            });
        }

        if ($this->hasField($def, 'sort_order')) {
            $query->orderBy('sort_order');
        }
        $query->orderBy('id');

        $items = $query->get()->map(fn (Model $m) => $this->transform($m, $def));

        return $this->success([
            'items' => $items,
            'definition' => $this->publicDefinition($resource, $def),
        ]);
    }

    public function store(Request $request, string $resource)
    {
        [$def, $error] = $this->resolve($resource);
        if ($error) {
            return $error;
        }

        $request->validate($this->rules($def, null));
        $data = $this->payload($def, $request, applyDefaults: true);

        /** @var class-string<Model> $model */
        $model = $def['model'];
        $record = $model::create($data);

        return $this->success($this->fresh($record, $def), 'تمت الإضافة بنجاح', 201);
    }

    public function update(Request $request, string $resource, int $id)
    {
        [$def, $error] = $this->resolve($resource);
        if ($error) {
            return $error;
        }

        $record = $this->find($def, $id);
        if (! $record) {
            return $this->fail('العنصر غير موجود.', null, 404);
        }

        $request->validate($this->rules($def, $id));
        $record->update($this->payload($def, $request, applyDefaults: false));

        return $this->success($this->fresh($record, $def), 'تم التحديث بنجاح');
    }

    public function toggle(string $resource, int $id)
    {
        [$def, $error] = $this->resolve($resource);
        if ($error) {
            return $error;
        }

        if (! $this->hasField($def, 'is_active')) {
            return $this->fail('هذا المورد لا يدعم التفعيل/التعطيل.', null, 422);
        }

        $record = $this->find($def, $id);
        if (! $record) {
            return $this->fail('العنصر غير موجود.', null, 404);
        }

        $record->is_active = ! $record->is_active;
        $record->save();

        return $this->success($this->fresh($record, $def), 'تم تحديث الحالة');
    }

    public function destroy(string $resource, int $id)
    {
        [$def, $error] = $this->resolve($resource);
        if ($error) {
            return $error;
        }

        $record = $this->find($def, $id);
        if (! $record) {
            return $this->fail('العنصر غير موجود.', null, 404);
        }

        foreach ($def['dependencies'] ?? [] as $relation) {
            if ($record->{$relation}()->exists()) {
                return $this->fail(
                    'لا يمكن حذف هذا العنصر لأنه مستخدم في سجلات أخرى. يمكنك تعطيله بدلاً من حذفه.',
                    null,
                    409
                );
            }
        }

        $record->delete();

        return $this->success(null, 'تم الحذف بنجاح');
    }

    public function reorder(Request $request, string $resource)
    {
        [$def, $error] = $this->resolve($resource);
        if ($error) {
            return $error;
        }

        if (! $this->hasField($def, 'sort_order')) {
            return $this->fail('هذا المورد لا يدعم إعادة الترتيب.', null, 422);
        }

        $validated = $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['integer'],
        ]);

        /** @var class-string<Model> $model */
        $model = $def['model'];
        DB::transaction(function () use ($validated, $model) {
            foreach ($validated['order'] as $position => $id) {
                $record = $model::find($id);
                if ($record) {
                    $record->sort_order = $position;
                    $record->save();
                }
            }
        });

        return $this->success(null, 'تم حفظ الترتيب');
    }

    /**
     * @return array{0: array|null, 1: \Illuminate\Http\JsonResponse|null}
     */
    private function resolve(string $resource): array
    {
        $def = config("reference_data.$resource");

        if (! is_array($def)) {
            return [null, $this->fail('نوع البيانات المرجعية غير معروف.', null, 404)];
        }

        return [$def, null];
    }

    private function find(array $def, int $id): ?Model
    {
        /** @var class-string<Model> $model */
        $model = $def['model'];

        return $model::find($id);
    }

    private function fresh(Model $record, array $def): array
    {
        $record = $record->fresh();
        if (! empty($def['with'])) {
            $record->load($def['with']);
        }
        if (! empty($def['dependencies'])) {
            $record->loadCount($def['dependencies']);
        }

        return $this->transform($record, $def);
    }

    private function transform(Model $record, array $def): array
    {
        $data = $record->toArray();

        $inUse = false;
        foreach ($def['dependencies'] ?? [] as $relation) {
            if (($data["{$relation}_count"] ?? 0) > 0) {
                $inUse = true;
            }
        }
        $data['in_use'] = $inUse;

        return $data;
    }

    /**
     * Build validation rules from the resource definition. When $ignoreId is
     * provided, unique rules ignore that record (update path).
     */
    private function rules(array $def, ?int $ignoreId): array
    {
        /** @var class-string<Model> $model */
        $model = $def['model'];
        $table = (new $model)->getTable();
        $rules = [];

        foreach ($def['fields'] as $field) {
            $key = $field['key'];
            $required = $field['required'] ?? false;

            $rules[$key] = match ($field['type']) {
                'slug' => array_filter([
                    $required ? 'required' : 'nullable',
                    'string',
                    'max:'.($field['max'] ?? 100),
                    $field['unique'] ?? false
                        ? Rule::unique($table, $key)->ignore($ignoreId)
                        : null,
                ]),
                'text' => [$required ? 'required' : 'nullable', 'string', 'max:255'],
                'boolean' => ['sometimes', 'boolean'],
                'number' => ['sometimes', 'integer', 'min:0'],
                'relation' => [
                    $required ? 'required' : 'nullable',
                    'integer',
                    Rule::exists((new $field['ref_model'])->getTable(), 'id'),
                ],
                default => ['nullable'],
            };
        }

        return $rules;
    }

    /**
     * Extract and coerce the writable payload from the request based on the
     * field definitions. On create, applies declared defaults for absent fields.
     */
    private function payload(array $def, Request $request, bool $applyDefaults): array
    {
        $data = [];

        foreach ($def['fields'] as $field) {
            $key = $field['key'];

            if (! $request->has($key)) {
                if ($applyDefaults && array_key_exists('default', $field)) {
                    $data[$key] = $field['default'];
                }

                continue;
            }

            $value = match ($field['type']) {
                'boolean' => $request->boolean($key),
                'number' => (int) $request->input($key),
                default => $request->input($key),
            };

            if (($field['uppercase'] ?? false) && is_string($value)) {
                $value = strtoupper($value);
            }

            $data[$key] = $value;
        }

        return $data;
    }

    /**
     * Public-facing definition for the admin UI: labels, flags and, for
     * relation fields, the selectable options resolved from the referenced type.
     */
    private function publicDefinition(string $key, array $def): array
    {
        $fields = array_map(function (array $field) {
            $out = $field;
            unset($out['ref_model']);

            if (($field['type'] ?? null) === 'relation') {
                /** @var class-string<Model> $refModel */
                $refModel = $field['ref_model'];
                $out['options'] = $refModel::query()
                    ->orderBy('sort_order')
                    ->orderBy('id')
                    ->get(['id', 'name_ar', 'name_en', 'name_am']);
            }

            return $out;
        }, $def['fields']);

        return [
            'key' => $key,
            'label' => $def['label'],
            'icon' => $def['icon'] ?? null,
            'sortable' => $this->hasField($def, 'sort_order'),
            'fields' => $fields,
        ];
    }

    private function hasField(array $def, string $key): bool
    {
        foreach ($def['fields'] as $field) {
            if ($field['key'] === $key) {
                return true;
            }
        }

        return false;
    }
}
