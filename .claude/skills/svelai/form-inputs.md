# Svelai Form Inputs Reference

All form inputs extend the **Field** component, inheriting: `label`, `description`, `error`, `required`, `disabled`, `size` (`'small' | 'normal' | 'large'`), `prefix`, `suffix`, `class`, `theme`. Do not repeat these in each component usage.

Import pattern: `import { ComponentName } from 'svelai/kebab-case-name'`
Global theme setter: `import { setComponentNameTheme } from 'svelai/kebab-case-name'`

---

## Table of Contents

- [TextInput](#textinput)
- [TextArea](#textarea)
- [NumberInput](#numberinput)
- [RatingInput](#ratinginput)
- [PasswordInput](#passwordinput)
- [PhoneInput](#phoneinput)
- [DateInput](#dateinput)
- [TimeInput](#timeinput)
- [ColorInput](#colorinput)
- [ColorPicker](#colorpicker)
- [Select](#select)
- [Combobox](#combobox)
- [TagsInput](#tagsinput)
- [KeyValueInput](#keyvalueinput)
- [Switch](#switch)
- [RadioInput](#radioinput)
- [CheckboxesInput](#checkboxesinput)
- [FileInput](#fileinput)
- [Calendar](#calendar)
- [MiniCalendar](#minicalendar)
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

## RatingInput

`import { RatingInput } from 'svelai/rating-input'`

**Unique props:** `value: number | null` (bindable, default `null`), `max: number` (default 5, the star count and maximum value), `allowHalf: boolean` (default false, snaps to 0.5 increments), `readonly: boolean` (default false), `clearable: boolean` (default true, click the current value to clear), `dir` (`'ltr' | 'rtl'`, inherits ambient direction when omitted), `color` (default `'warning'`, the gold star fill), `star` (snippet, custom icon — see Rating in display.md)

Builds on the `Rating` display component (display.md) — same star rendering and theme. `role="slider"`: ArrowRight/Up increase, ArrowLeft/Down decrease by the step (0.5 if `allowHalf`, else 1), Home clears, End sets `max`. In RTL the stars render and fill right-to-left, but the numeric value never flips (Right always increases).

**Theme parts:** shared with Rating — `container`, `star`, `starBase`, `starFill` (variants: `size`, `color`, `disabled`, `interactive`); `setRatingTheme` themes both.

```svelte
<RatingInput label="Rating" bind:value={rating} allowHalf max={5} />
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

## ColorInput

`import { ColorInput } from 'svelai/color-input'`

**Unique props:** `value: string | null` (bindable, canonical hex `#rrggbb` / `#rrggbbaa`; accepts any parseable CSS color as typed input and normalizes to hex), `format` (`'hex' | 'rgb' | 'hsl'`, default `'hex'`, bindable -- the input's text representation; the value stays hex), `placeholder`, `i18n: Partial<Messages>` (also forwarded to the picker)

Shows a color swatch and text input inside the shared Field frame; the swatch (or focusing the input) opens a full `ColorPicker` (see below) in a Popover. Typing any parseable CSS color commits it; clearing the input sets `null`; the popover stays open while picking (continuous) and closes on click-outside or Escape. The swatch renders the color over a checkerboard so alpha < 1 reads through, and is a neutral square when the value is `null`. Form type: `'color'` (value is a hex string). Global setter: `setColorInputTheme`.

**Theme parts:** `input`, `inputContainer` (variants: `size`, `disabled`), `popover`, `swatch` (variants: `size`, `empty`). Field theme parts (`label`, `error`, ...) are accepted on the same `theme` prop.

```svelte
<ColorInput label="Brand color" bind:value={color} />
<ColorInput label="Overlay" value="#00000080" format="rgb" />
```

---

## ColorPicker

`import { ColorPicker } from 'svelai/color-picker'`

Standalone color picker panel (not Field-based) -- a saturation/brightness square, hue and alpha sliders, an eyedropper, and a format-aware text input. Used inside `ColorInput` or standalone.

**Unique props:**

- `value: string` (bindable, default `'#000000'`) -- canonical hex output (`#rrggbb`, or `#rrggbbaa` when alpha < 1); accepts any parseable CSS color as input
- `format` (`'hex' | 'rgb' | 'hsl'`, default `'hex'`, bindable) -- the input's text representation only; the bound value stays hex
- `size` (`'small' | 'normal' | 'large'`), `disabled`
- `onValueChange: (value: string) => void` -- fires on every committed change, including continuously while dragging (receives hex)
- `i18n: Partial<Messages>`

The square and both sliders support click-to-jump and pointer drag; the area thumb and slider thumbs are focusable `role="slider"` controls (arrows adjust, Shift for a larger step, Home/End to min/max). The eyedropper uses `window.EyeDropper` and hides where unsupported (SSR-safe). Hue and saturation are preserved internally, so dragging a color to black/white never loses the chosen hue. Global setter: `setColorPickerTheme`.

**Theme parts:** `root`, `area`, `areaSaturation`, `areaValue`, `areaThumb`, `controls`, `eyedropperButton`, `sliders`, `hueTrack`, `alphaTrack`, `alphaGradient`, `sliderThumb`, `inputs`, `select`, `input`, `alphaField`, `alphaInput`, `alphaSuffix` (each with a `size` variant).

```svelte
<ColorPicker bind:value={color} />
<ColorPicker value="#22c55e80" format="rgb" size="large" />
```

---

## Select

`import { Select } from 'svelai/select'`

**Unique props:** `value: string` (bindable), `options: Array<{ value: string, label: string }>` (required), `placeholder`

Native HTML select. Supports `prefix`/`suffix` snippets.

**Theme parts:** `input`, `inputContainer` (variants: `size`, `disabled`)

```svelte
<Select
	label="Country"
	bind:value={country}
	placeholder="Choose..."
	options={[
		{ value: 'us', label: 'United States' },
		{ value: 'uk', label: 'United Kingdom' }
	]}
/>
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
<Combobox options={async (q) => fetch(`/api?q=${q}`).then((r) => r.json())} bind:value={val} />
```

---

## TagsInput

`import { TagsInput } from 'svelai/tags-input'`

Multi-tag input: free text, or restricted to a searchable option list (like Combobox but multi-value). Tags render as animated `Chip`s.

**Unique props:**

- `value: string[] | null` (bindable, default `null`), `searchValue: string` (bindable), `loading: boolean` (bindable)
- `items`: `ComboboxOption[]` or `(searchValue?) => MaybePromise<ComboboxOption[]>` (optional) — when provided, behaves like Combobox (debounced 100ms, dropdown, async/static, loading/error/empty states)
- `allowCustom: boolean` (default `false`) — with `items`, also allow Enter to add free text not in the list
- `maxTags: number` — once reached, further adds are ignored
- `showAllOnFocus`, `getValueOption: (value) => MaybePromise<ComboboxOption>` (resolve labels for initial values)
- `placeholder`, `loadingText`, `noOptionsText`
- `onValueChange: (value: string[]) => void`, `onValidate`
- `errors: string[] | boolean` (bindable), `focused: boolean` (bindable)

Option format: `{ value: string, label: string, description?: string }` (reused from Combobox). Without `items` it is a plain free-text tag input; with `items` it is restricted to the list (unless `allowCustom`). Duplicate tags are never added. Keyboard: Enter (add current search), Backspace on empty input (remove last tag), Arrow keys / Home / End / Enter to navigate the dropdown, Escape blurs.

**Theme parts:** `input`, `inputContainer` (flex-wrap layout), `tag` (animated wrapper), `loading`, `error`, `noOptions`

```svelte
<TagsInput placeholder="Add tags..." bind:value={tags} />
<TagsInput items={technologies} showAllOnFocus allowCustom bind:value={tags} />
```

---

## KeyValueInput

`import { KeyValueInput } from 'svelai/key-value-input'`

An editable list of key/value string pairs. Each row is `[key input] [value input] [remove ×]`, with a full-width `Add` button below that appends an empty row. Rows animate on add/remove. No dropdown, async, or option list — it is a plain pair editor.

**Unique props:**

- `value: KeyValuePair[] | null` (bindable, default `null`) — `KeyValuePair` is `{ key: string; value: string }`. The value is an output mirror of the editor rows.
- `keyPlaceholder: string` — key input placeholder (defaults to the localized "Key" label)
- `valuePlaceholder: string` — value input placeholder (defaults to the localized "Value" label)
- `addLabel: string` — text on the Add button (defaults to the localized "Add" label)
- `maxRows: number` — once reached, the Add button is disabled
- `onValueChange: (value: KeyValuePair[]) => void`, `onValidate`
- `i18n: Partial<Messages>` — override the add/key/value/remove strings
- `errors: string[] | boolean` (bindable), `focused: boolean` (bindable)

Rows are keyed by a stable per-row id (not the key string), so empty or duplicate keys while typing are safe. Enter inside a row does not submit the enclosing form. Programmatically replacing `value` after mount is not reconciled back into the editor rows — seed the initial value instead. Convert to an object with `Object.fromEntries(value.map((p) => [p.key, p.value]))`.

**Theme parts:** `inputContainer` (vertical stack), `row` (animated flex wrapper), `input` (bordered key/value text input), `removeButton`, `addButton` (variants: `size`)

```svelte
<KeyValueInput label="Headers" bind:value={pairs} />
<KeyValueInput maxRows={5} addLabel="Add field" bind:value={pairs} />
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
<RadioInput
	label="Plan"
	bind:value={plan}
	orientation="horizontal"
	options={[
		{ value: 'free', label: 'Free' },
		{ value: 'pro', label: 'Pro', description: '$10/mo' }
	]}
/>
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
<CheckboxesInput
	label="Skills"
	mode="card"
	bind:value={skills}
	options={[
		{ value: 'js', label: 'JavaScript' },
		{ value: 'py', label: 'Python' }
	]}
/>
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

## MiniCalendar

`import { MiniCalendar } from 'svelai/mini-calendar'`

Compact horizontal strip of N consecutive days (not Field-based) with a prev/next chevron on each side that shifts the range by N days. Each cell stacks a short month label over the day number; the selected day gets an elevated fill and today is subtly highlighted.

**Unique props:**

- `value: Date | null` (bindable, default `null`), `startDate: Date` (bindable, default today), `days: number` (default 5)
- `size` (`'small' | 'normal' | 'large'`), `color` (default `'primary'`, accent of the selected day), `disabled`
- `locale: string` (month labels + date aria-labels; defaults to the active i18n catalog's locale), `dir` (`'ltr' | 'rtl'`, inherits ambient direction when omitted)
- `onValueChange: (date) => void`, `onStartDateChange: (startDate) => void`

Dates are handled at noon and compared by year/month/day (timezone-resistant). Navigation is chronological in both directions; in RTL the strip and chevrons mirror. Range shifts are a directional push — the old range slides out while the new slides in from the direction of travel (RTL-mirrored, reduced-motion aware). Custom cell content via the `day` snippet (payload `{ date, selected, today, monthLabel, dayNumber }`).

**Theme parts:** `root`, `navButton`, `days`, `track`, `day`, `dayMonth`, `dayNumber` (day variants: `size`, `color`, `selected`, `today`, `disabled`)

```svelte
<MiniCalendar bind:value={date} days={7} color="success" />
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
<Form
	inputs={{
		name: { type: 'text', label: 'Name', required: true, class: 'col-span-1' },
		email: { type: 'email', label: 'Email', required: true, class: 'col-span-1' }
	}}
	onSubmit={handleSubmit}
>
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
<MultiStepForm
	steps={[
		{ title: 'Account', inputs: { email: { type: 'email', label: 'Email', required: true } } },
		{ title: 'Profile', inputs: { name: { type: 'text', label: 'Name', required: true } } }
	]}
	bind:value={data}
	onSubmit={handleSubmit}
/>
```
