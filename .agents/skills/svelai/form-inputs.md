# Svelai Form Inputs Reference

All form inputs extend the **Field** component, inheriting: `label`, `description`, `error`, `required`, `disabled`, `size` (`'small' | 'normal' | 'large'`), `prefix`, `suffix`, `class`, `theme`. Do not repeat these in each component usage.

Import pattern: `import { ComponentName } from 'svelai/kebab-case-name'`
Global theme setter: `import { setComponentNameTheme } from 'svelai/kebab-case-name'`

---

## Table of Contents

- [TextInput](#textinput)
- [TextArea](#textarea)
- [NumberInput](#numberinput)
- [PasswordInput](#passwordinput)
- [PhoneInput](#phoneinput)
- [DateInput](#dateinput)
- [TimeInput](#timeinput)
- [Select](#select)
- [Combobox](#combobox)
- [Switch](#switch)
- [RadioInput](#radioinput)
- [CheckboxesInput](#checkboxesinput)
- [FileInput](#fileinput)
- [Calendar](#calendar)
- [Form](#form)
- [MultiStepForm](#multistepform)

---

## TextInput

`import { TextInput } from 'svelai/text-input'`

**Unique props:** `type` (`'text' | 'email' | 'url'`, default `'text'`), `value: string` (bindable), `placeholder`

Auto-validates email/url formats. Supports `prefix` and `suffix` snippets.

**Theme parts:** `input`, `inputContainer` (variants: `size`, `disabled`)

```svelte
<TextInput type="email" label="Email" placeholder="you@example.com" bind:value={email} required />
```

---

## TextArea

`import { TextArea } from 'svelai/text-area'`

**Unique props:** `value: string` (bindable), `placeholder`, `rows: number` (default 3), `resize` (`'none' | 'vertical' | 'horizontal' | 'both'`, default `'vertical'`), `autoResize: boolean`, `maxLength: number`

When `maxLength` is set, a character counter is auto-displayed.

**Theme parts:** `input`, `inputContainer` (variants: `size`, `disabled`)

```svelte
<TextArea label="Bio" bind:value={bio} rows={4} maxLength={500} autoResize />
```

---

## NumberInput

`import { NumberInput } from 'svelai/number-input'`

**Unique props:** `value: number` (bindable), `min`, `max`, `step` (default 1), `showControls: boolean` (default true), `placeholder`

Keyboard: ArrowUp/Down (step), PageUp/Down (step*10). Supports `prefix`/`suffix` for units.

**Theme parts:** `input`, `inputContainer` (variants: `size`, `disabled`)

```svelte
<NumberInput label="Price" bind:value={price} min={0} step={0.01}>
  {#snippet prefix()}<span>$</span>{/snippet}
</NumberInput>
```

---

## PasswordInput

`import { PasswordInput } from 'svelai/password-input'`

**Unique props:** `value: string` (bindable), `placeholder`, `showToggle: boolean` (default true)

Extends TextInput. Built-in visibility toggle (eye icon). Only `prefix` slot (suffix is the toggle).

**Theme parts:** `input`, `inputContainer` (same as TextInput)

```svelte
<script>
  import { PasswordInput } from 'svelai/password-input';
  import { lockIcon } from 'svelai/icons/lock';
</script>

<PasswordInput label="Password" bind:value={password} required>
  {#snippet prefix()}{@render lockIcon()}{/snippet}
</PasswordInput>
```

---

## PhoneInput

`import { PhoneInput } from 'svelai/phone-input'`

**Unique props:** `value: string` (bindable), `defaultCountry: string` (default `'US'`), `placeholder`

Built-in country code selector with flags, auto-formatting per country. intl-tel-input is loaded from a CDN at runtime and never bundled.

**Theme parts:** `input`, `inputContainer` (variants: `size`, `disabled`)

```svelte
<PhoneInput label="Phone" bind:value={phone} defaultCountry="GB" required />
```

---

## DateInput

`import { DateInput } from 'svelai/date-input'`

**Unique props:** `value: Date | string` (bindable), `type` (`'date' | 'datetime'`, default `'date'`), `min`, `max: Date | string`, `placeholder`, `format: string`

Opens calendar picker. Formats: `MM/DD/YYYY`, `DD/MM/YYYY`, `YYYY-MM-DD`.

**Theme parts:** `input`, `inputContainer` (variants: `size`, `disabled`)

```svelte
<DateInput type="datetime" label="Appointment" bind:value={date} min={new Date()} />
```

---

## TimeInput

`import { TimeInput } from 'svelai/time-input'`

**Unique props:** `value: number` (bindable, time as numeric value), `placeholder`, `as` (`'minuteSinceMidnight'` | `'secondSinceMidnight'` | `'millisecondSinceMidnight'`), `format` (MaskitoTimeParams mode), `maxValues`, `minValues`

**Theme parts:** `input`, `inputContainer` (variants: `size`, `disabled`)

```svelte
<TimeInput label="Start Time" bind:value={time} />
```

---

## Select

`import { Select } from 'svelai/select'`

**Unique props:** `value: string` (bindable), `options: Array<{ value: string, label: string }>` (required), `placeholder`

Native HTML select. Supports `prefix`/`suffix` snippets.

**Theme parts:** `input`, `inputContainer` (variants: `size`, `disabled`)

```svelte
<Select label="Country" bind:value={country} placeholder="Choose..." options={[
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' }
]} />
```

---

## Combobox

`import { Combobox } from 'svelai/combobox'`

Searchable dropdown with async support.

**Unique props:**
- `options`: `ComboboxOption[]` or `(searchValue?) => MaybePromise<ComboboxOption[]>` (required)
- `value: string | null` (bindable), `searchValue: string` (bindable), `loading: boolean` (bindable)
- `showAllOnFocus`, `getValueOption: (value) => MaybePromise<ComboboxOption>` (async pre-selected)
- `placeholder`, `loadingText`, `noOptionsText`
- `onValueChange: ({ value, option }) => void`, `onValidate`
- `prefix`: default magnifying glass, set `false` to hide
- `errors: string[] | boolean` (bindable), `focused: boolean` (bindable)

Option format: `{ value: string, label: string, description?: string }`. Debounced 100ms.

**Theme parts:** `input`, `inputContainer`, `loading`, `error`, `noOptions`, `option` (variant: `highlighted`), `optionLabel`, `optionDescription`

```svelte
<Combobox options={async (q) => fetch(`/api?q=${q}`).then(r => r.json())} bind:value={val} />
```

---

## Switch

`import { Switch } from 'svelai/switch'`

**State props:** `value: boolean | null` (bindable), `defaultValue: boolean | null`, `onValueChange: (value) => void`

Label rendered beside the toggle. Global setter: `setSwitchInputTheme`.

**Theme parts:** `toggle` (variants: `checked`, `size`, `disabled`), `thumb` (variants: `checked`, `size`), `inputContainer`

```svelte
<Switch label="Enable notifications" bind:checked={enabled} />
```

---

## RadioInput

`import { RadioInput } from 'svelai/radio-input'`

**Unique props:**
- `value: string` (bindable), `options: Array<{ value, label, description?, disabled? }>` (required)
- `orientation: 'vertical' | 'horizontal'` (default `'vertical'`), `mode: 'normal' | 'card'`

**Theme parts:** `radiosInput`, `radiosInputContainer`, `radiosInputItem`, `radiosInputItemTrack`, `radiosInputItemThumb`, `radiosInputItemLabel`, `radiosInputItemDescription`, `radiosInputItemIcon` (variants: `mode`, `checked`, `disabled`)

```svelte
<RadioInput label="Plan" bind:value={plan} orientation="horizontal" options={[
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro', description: '$10/mo' }
]} />
```

---

## CheckboxesInput

`import { CheckboxesInput } from 'svelai/checkboxes-input'`

**Unique props:**
- `value: string[]` (bindable), `options: Array<{ value, label?, description? }>` (required)
- `mode: 'normal' | 'card'` (default `'normal'`), `onValidate: (value) => string[] | boolean`

Renders as `<fieldset>`. Card mode = elevated cards with selection ring. Global setter: `setCheckBoxesInputTheme`.

Extra slots: `header`, `helper`, `footer`, `actions`, `errorsContainer`

**Theme parts:** `checkboxesInput`, `checkboxesInputContainer`, `checkboxesInputItem`, `checkboxesInputItemTrack`, `checkboxesInputItemThumb`, `checkboxesInputItemLabel`, `checkboxesInputItemDescription`, `checkboxesInputItemIcon`

```svelte
<CheckboxesInput label="Skills" mode="card" bind:value={skills} options={[
  { value: 'js', label: 'JavaScript' }, { value: 'py', label: 'Python' }
]} />
```

---

## FileInput

`import { FileInput } from 'svelai/file-input'`

**Unique props:**
- `value: File | File[]` (bindable), `type: 'file' | 'files'`
- `accept: string`, `maxSize: number` (bytes), `multiple: boolean`
- `showPreview: boolean` (default true), `placeholder`, `onUpload: (files) => void`

Drag-and-drop supported. Images show thumbnail preview.

**Theme parts:** `fileInput`, `fileInputDropzone` (variants: `disabled`, `dragging`), `fileInputPreview`, `fileInputPreviewItem`

```svelte
<FileInput label="Avatar" bind:value={avatar} accept="image/*" maxSize={2 * 1024 * 1024} />
```

---

## Calendar

`import { Calendar } from 'svelai/calendar'`

Standalone calendar (not Field-based). Used inside DateInput or standalone.

**Unique props:**
- `value: Date | { start, end }` (bindable), `type: 'calendar' | 'calendar-range'`
- `month`, `year`, `showWeekNumbers`, `firstDayOfWeek: 0 | 1`
- `min`, `max: Date`, `disabledDates: Date[]`, `disabledDays: number[]`
- `onValueChange`, `onMonthChange`

**Theme parts:** `calendar`, `calendarHeader`, `calendarGrid`, `calendarDay` (variants: `selected`, `today`, `disabled`, `inRange`)

```svelte
<Calendar type="calendar-range" bind:value={range} min={new Date()} disabledDays={[0, 6]} />
```

---

## Form

`import { Form } from 'svelai/form'`

Declarative form from config. Manages state, validation, layout.

**Unique props:**
- `inputs: FormInputs` (required) -- `{ fieldName: { type, ...fieldProps } }`
- `value` (bindable), `form: FormState` (bindable), `onSubmit: (value) => void | Promise`

**Slots:** `children`, `header`, `title`, `description`, `footer` -- all receive `{ form }`.

**Types:** `text`, `email`, `url`, `password`, `number`, `select`, `radio`, `checkboxes`, `switch`, `date`, `datetime`, `calendar`, `calendar-range`, `textarea`, `phone`, `file`, `files`

**Layout:** 2-column grid. `class: 'col-span-1'` for single column.

**FormState:** `isValid`, `isDirty`, `isSubmitting`, `errors`, `reset()`, `submit()`

**Theme parts:** `form`, `field`

```svelte
<Form inputs={{
  name: { type: 'text', label: 'Name', required: true, class: 'col-span-1' },
  email: { type: 'email', label: 'Email', required: true, class: 'col-span-1' }
}} onSubmit={handleSubmit}>
  {#snippet footer({ form })}
    <Button type="submit" disabled={!form.isValid}>Submit</Button>
  {/snippet}
</Form>
```

---

## MultiStepForm

`import { MultiStepForm } from 'svelai/multi-step-form'`

**Unique props:**
- `steps: Array<{ title, description?, inputs }>` (required)
- `value` (bindable), `currentStep: number` (bindable)
- `validateOnStepChange` (default true), `allowStepSkipping` (default false)
- `onSubmit`, `onStepChange`, `onStepValidate`

**Slots:** `header`, `footer` (`{ currentStep, totalSteps, next, prev, submit }`), `step` (`{ step, index, data }`)

Uses Stepper for progress. Validates per step. Data persists across steps.

**Theme parts:** `multiStepForm`, `form`

```svelte
<MultiStepForm steps={[
  { title: 'Account', inputs: { email: { type: 'email', label: 'Email', required: true } } },
  { title: 'Profile', inputs: { name: { type: 'text', label: 'Name', required: true } } }
]} bind:value={data} onSubmit={handleSubmit} />
```
