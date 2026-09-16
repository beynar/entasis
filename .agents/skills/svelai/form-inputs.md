# Svelai Form Inputs Reference

All form inputs extend the **Field** component, inheriting: `label`, `description`, `error`, `required`, `disabled`, `size` (`'small' | 'normal' | 'large'`), `density`, `prefix`, `suffix`, `class`, `theme`. Do not repeat these in each component usage.

Import pattern: `import { ComponentName } from 'svelai/kebab-case-name'`
Global theme setter: `import { setComponentNameTheme } from 'svelai/kebab-case-name'` (shape: `{ slot: { base, variantName: { value: classes } } }`, see theming.md)

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
<script>
	import { TextInput } from 'svelai/text-input';

	let email = $state('');
</script>

<TextInput type="email" label="Email" placeholder="you@example.com" bind:value={email} required />
```

---

## TextArea

`import { TextArea } from 'svelai/text-area'`

**Unique props:** `value: string` (bindable), `placeholder`, `rows: number` (default 3), `maxLength: number`, `textareaAttrs` (extra native `<textarea>` attributes), `onPressEnter: (payload) => void`

When `maxLength` is set, a character counter is auto-displayed.

**Theme parts:** `input`, `inputContainer` (variants: `size`, `disabled`)

```svelte
<script>
	import { TextArea } from 'svelai/text-area';

	let bio = $state('');
</script>

<TextArea label="Bio" bind:value={bio} rows={4} maxLength={500} />
```

---

## NumberInput

`import { NumberInput } from 'svelai/number-input'`

**Unique props:** `value: number` (bindable), `min`, `max`, `step` (default 1), `showControls: boolean` (default true), `placeholder`

Keyboard: ArrowUp/Down (step), PageUp/Down (step\*10). Supports `prefix`/`suffix` for units.

**Theme parts:** `input`, `inputContainer` (variants: `size`, `disabled`)

```svelte
<script>
	import { NumberInput } from 'svelai/number-input';

	let price = $state(0);
</script>

<NumberInput label="Price" bind:value={price} min={0} step={0.01}>
	{#snippet prefix()}<span>$</span>{/snippet}
</NumberInput>
```

---

## RatingInput

`import { RatingInput } from 'svelai/rating-input'`

**Unique props:** `value: number | null` (bindable, default `null`), `max: number` (default 5, the star count and maximum value), `halfSteps: boolean` (default false, snaps to 0.5 increments), `readonly: boolean` (default false), `clearable: boolean` (default true, click the current value to clear), `dir` (`'ltr' | 'rtl'`, inherits ambient direction when omitted), `color` (default `'warning'`, the gold star fill), `star` (snippet, custom icon -- see Rating in display.md)

Builds on the `Rating` display component (display.md) -- same star rendering and theme. `role="slider"`: ArrowRight/Up increase, ArrowLeft/Down decrease by the step (0.5 if `halfSteps`, else 1), Home clears, End sets `max`. In RTL the stars render and fill right-to-left, but the numeric value never flips (Right always increases).

**Theme parts:** shared with Rating -- `container`, `star`, `starBase`, `starFill` (variants: `size`, `color`, `disabled`, `interactive`); `setRatingTheme` themes both.

```svelte
<script>
	import { RatingInput } from 'svelai/rating-input';

	let rating = $state(null);
</script>

<RatingInput label="Rating" bind:value={rating} halfSteps max={5} />
```

---

## PasswordInput

`import { PasswordInput } from 'svelai/password-input'`

**Unique props:** `value: string` (bindable), `placeholder`

Extends TextInput. Built-in visibility toggle (eye icon). Only `prefix` slot (suffix is the toggle).

**Theme parts:** `input`, `inputContainer` (same as TextInput)

```svelte
<script>
	import { PasswordInput } from 'svelai/password-input';
	import { lockIcon } from 'svelai/icons/lock';

	let password = $state('');
</script>

<PasswordInput label="Password" bind:value={password} required>
	{#snippet prefix()}{@render lockIcon()}{/snippet}
</PasswordInput>
```

---

## PhoneInput

`import { PhoneInput } from 'svelai/phone-input'`

**Unique props:** `value: string` (bindable), `country: string` (bindable ISO code, default `'fr'`), `strict: boolean`, `searchPlaceholder`, `placeholder`

Built-in country code selector with flags, auto-formatting per country. intl-tel-input is loaded from a CDN at runtime and never bundled.

**Theme parts:** `input`, `inputContainer` (variants: `size`, `disabled`)

```svelte
<script>
	import { PhoneInput } from 'svelai/phone-input';

	let phone = $state('');
</script>

<PhoneInput label="Phone" bind:value={phone} country="gb" required />
```

---

## DateInput

`import { DateInput } from 'svelai/date-input'`

**Unique props:** `value: Date | null` (bindable), `type` (`'date' | 'datetime'`, default `'date'`), `minDate`, `maxDate: Date`, `disabledDates: (Date | [Date, Date])[]`, `placeholder`, `format` (`'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy/mm/dd' | 'mm/yyyy' | 'yyyy/mm' | 'mm/yy' | 'yyyy'`), `locale`, `separator`, `presets`, `calendarView` (`'single' | 'double'`), `closeOnSelect`, `mobileSheet`

Opens a calendar picker.

**Theme parts:** `input`, `inputContainer` (variants: `size`, `disabled`)

```svelte
<script>
	import { DateInput } from 'svelai/date-input';

	let date = $state(null);
</script>

<DateInput type="datetime" label="Appointment" bind:value={date} minDate={new Date()} />
```

---

## TimeInput

`import { TimeInput } from 'svelai/time-input'`

**Unique props:** `value: number` (bindable, time as numeric value), `placeholder`, `as` (`'minuteSinceMidnight'` | `'secondSinceMidnight'` | `'millisecondSinceMidnight'`), `format` (MaskitoTimeParams mode), `maxValues`, `minValues`

**Theme parts:** `input`, `inputContainer` (variants: `size`, `disabled`)

```svelte
<script>
	import { TimeInput } from 'svelai/time-input';

	let time = $state(null);
</script>

<TimeInput label="Start Time" bind:value={time} />
```

---

## ColorInput

`import { ColorInput } from 'svelai/color-input'`

**Unique props:** `value: string | null` (bindable, canonical hex `#rrggbb` / `#rrggbbaa`; accepts any parseable CSS color as typed input and normalizes to hex), `format` (`'hex' | 'rgb' | 'hsl'`, default `'hex'`, bindable -- the input's text representation; the value stays hex), `placeholder`, `i18n: Partial<Messages>` (also forwarded to the picker)

Shows a color swatch and text input inside the shared Field frame; the swatch (or focusing the input) opens a full `ColorPicker` (see below) in a Popover. Typing any parseable CSS color commits it; clearing the input sets `null`; the popover stays open while picking (continuous) and closes on click-outside or Escape. The swatch renders the color over a checkerboard so alpha < 1 reads through, and is a neutral square when the value is `null`. Form type: `'color'` (value is a hex string). Global setter: `setColorInputTheme`.

**Theme parts:** `input`, `inputContainer` (variants: `size`, `disabled`), `popover`, `swatch` (variants: `size`, `empty`). Field theme parts (`label`, `error`, ...) are accepted on the same `theme` prop.

```svelte
<script>
	import { ColorInput } from 'svelai/color-input';

	let color = $state('#5f62ef');
</script>

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
<script>
	import { ColorPicker } from 'svelai/color-picker';

	let color = $state('#5f62ef');
</script>

<ColorPicker bind:value={color} />
<ColorPicker value="#22c55e80" format="rgb" size="large" />
```

---

## Select

`import { Select } from 'svelai/select'`

**Unique props:** `value: string` (bindable), `items: Array<{ value: string, label: string, disabled? } | { label?, items: SelectOption[] }>` (flat options or labelled groups), `placeholder`, `separators: boolean`

Native HTML select. Supports `prefix`/`suffix` snippets.

**Theme parts:** `input`, `inputContainer` (variants: `size`, `disabled`)

```svelte
<script>
	import { Select } from 'svelai/select';

	let country = $state('');
</script>

<Select
	label="Country"
	bind:value={country}
	placeholder="Choose..."
	items={[
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

- `items`: `ComboboxOption[]` or `(searchValue?) => MaybePromise<ComboboxOption[]>` (required)
- `value: string | null` (bindable), `searchValue: string` (bindable), `loading: boolean` (bindable)
- `showAllOnFocus`, `getValueOption: (value) => MaybePromise<ComboboxOption>` (async pre-selected)
- `placeholder`, `loadingText`, `noOptionsText`
- `onValueChange: ({ value, option }) => void`, `onValidate`
- `prefix`: default magnifying glass, set `false` to hide
- `errors: string[] | boolean` (bindable), `focused: boolean` (bindable)

Option format: `{ value: string, label: string, description?: string }`. Debounced 100ms.

**Theme parts:** `input`, `inputContainer`, `loading`, `error`, `noOptions`

```svelte
<script lang="ts">
	import { Combobox, type ComboboxOption } from 'svelai/combobox';

	let val = $state<string | null>(null);
	const search = async (q?: string): Promise<ComboboxOption[]> =>
		fetch(`/api?q=${q ?? ''}`).then((r) => r.json());
</script>

<Combobox label="City" items={search} bind:value={val} />
```

---

## TagsInput

`import { TagsInput } from 'svelai/tags-input'`

Multi-tag input: free text, or restricted to a searchable option list (like Combobox but multi-value). Tags render as animated `Chip`s.

**Unique props:**

- `value: string[] | null` (bindable, default `null`), `searchValue: string` (bindable), `loading: boolean` (bindable)
- `items`: `ComboboxOption[]` or `(searchValue?) => MaybePromise<ComboboxOption[]>` (optional) -- when provided, behaves like Combobox (debounced 100ms, dropdown, async/static, loading/error/empty states)
- `customTags: boolean` (default `false`) -- with `items`, also allow Enter to add free text not in the list
- `maxTags: number` -- once reached, further adds are ignored
- `showAllOnFocus`, `getValueOption: (value) => MaybePromise<ComboboxOption>` (resolve labels for initial values)
- `placeholder`, `loadingText`, `noOptionsText`
- `onValueChange: (value: string[]) => void`, `onValidate`
- `errors: string[] | boolean` (bindable), `focused: boolean` (bindable)

Option format: `{ value: string, label: string, description?: string }` (reused from Combobox). Without `items` it is a plain free-text tag input; with `items` it is restricted to the list (unless `customTags`). Duplicate tags are never added. Keyboard: Enter (add current search), Backspace on empty input (remove last tag), Arrow keys / Home / End / Enter to navigate the dropdown, Escape blurs.

**Theme parts:** `input`, `inputContainer` (flex-wrap layout), `tag` (animated wrapper), `loading`, `error`, `noOptions`

```svelte
<script>
	import { TagsInput } from 'svelai/tags-input';

	let tags = $state(null);
	const technologies = [
		{ value: 'svelte', label: 'Svelte' },
		{ value: 'tailwind', label: 'Tailwind' }
	];
</script>

<TagsInput placeholder="Add tags..." bind:value={tags} />
<TagsInput items={technologies} showAllOnFocus customTags bind:value={tags} />
```

---

## KeyValueInput

`import { KeyValueInput } from 'svelai/key-value-input'`

An editable list of key/value string pairs. Each row is `[key input] [value input] [remove x]`, with a full-width `Add` button below that appends an empty row. Rows animate on add/remove. No dropdown, async, or option list -- it is a plain pair editor.

**Unique props:**

- `value: KeyValuePair[] | null` (bindable, default `null`) -- `KeyValuePair` is `{ key: string; value: string }`. The value is an output mirror of the editor rows.
- `keyPlaceholder: string` -- key input placeholder (defaults to the localized "Key" label)
- `valuePlaceholder: string` -- value input placeholder (defaults to the localized "Value" label)
- `addLabel: string` -- text on the Add button (defaults to the localized "Add" label)
- `maxRows: number` -- once reached, the Add button is disabled
- `onValueChange: (value: KeyValuePair[]) => void`, `onValidate`
- `i18n: Partial<Messages>` -- override the add/key/value/remove strings
- `errors: string[] | boolean` (bindable), `focused: boolean` (bindable)

Rows are keyed by a stable per-row id (not the key string), so empty or duplicate keys while typing are safe. Enter inside a row does not submit the enclosing form. Programmatically replacing `value` after mount is not reconciled back into the editor rows -- seed the initial value instead. Convert to an object with `Object.fromEntries(value.map((p) => [p.key, p.value]))`.

**Theme parts:** `inputContainer` (vertical stack), `row` (animated flex wrapper), `input` (bordered key/value text input), `removeButton`, `addButton` (variants: `size`)

```svelte
<script>
	import { KeyValueInput } from 'svelai/key-value-input';

	let pairs = $state(null);
</script>

<KeyValueInput label="Headers" bind:value={pairs} />
<KeyValueInput maxRows={5} addLabel="Add field" bind:value={pairs} />
```

---

## Switch

`import { Switch } from 'svelai/switch'`

**State props:** `value: boolean | null` (bindable), `defaultValue: boolean | null`, `onValueChange: (value) => void`; the inherited `label` is painted beside the toggle and is also its accessible name

Label rendered beside the toggle. Global setter: `setSwitchInputTheme`.

**Theme parts:** `toggle` (variants: `checked`, `size`, `disabled`), `thumb` (variants: `checked`, `size`), `inputContainer`

```svelte
<script>
	import { Switch } from 'svelai/switch';

	let enabled = $state(false);
</script>

<Switch label="Enable notifications" bind:value={enabled} />
```

---

## RadioInput

`import { RadioInput } from 'svelai/radio-input'`

**Unique props:**

- `value: string` (bindable), `items: Array<{ value, label?, description?, icon?, disabled? }>` (required)
- `mode: 'normal' | 'card'` (default `'normal'`)

Layout is a single column; override `radiosInputContainer` (e.g. `grid-cols-2`) for other
arrangements. For a column count that responds, declare the container on the field
(`root: { base: '@container' }`) and query it on the grid
(`radiosInputContainer: { base: 'grid-cols-1 @md:grid-cols-3' }`), so the options follow the
field's host and not the device. Same pattern for `checkboxesInputContainer`. A bare
`md:grid-cols-3` here is rejected by `check-semantic-theme-tokens.mjs`, in `.mcp.ts` snippets too.

**Theme parts:** `root`, `radiosInputContainer`, `radiosInputItem`, `radiosInputItemTrack`, `radiosInputItemThumb`, `radiosInputItemLabel`, `radiosInputItemDescription`, `radiosInputItemIcon` (variants: `mode`, `checked`, `disabled`)

```svelte
<script>
	import { RadioInput } from 'svelai/radio-input';

	let plan = $state('free');
</script>

<RadioInput
	label="Plan"
	bind:value={plan}
	items={[
		{ value: 'free', label: 'Free' },
		{ value: 'pro', label: 'Pro', description: '$10/mo' }
	]}
/>
```

---

## CheckboxesInput

`import { CheckboxesInput } from 'svelai/checkboxes-input'`

**Unique props:**

- `value: string[]` (bindable), `items: Array<{ value, label?, description?, disabled? }>` (required)
- `mode: 'normal' | 'card'` (default `'normal'`), `onValidate: (value) => string[] | boolean`

Renders as `<fieldset>`. Card mode = elevated cards with selection ring. Global setter: `setCheckboxesInputTheme`.

Extra slots: `header`, `helper`, `footer`, `actions`, `errorsContainer`

**Theme parts:** `root`, `checkboxesInputContainer`, `checkboxesInputItem`, `checkboxesInputItemTrack`, `checkboxesInputItemThumb`, `checkboxesInputItemLabel`, `checkboxesInputItemDescription`, `checkboxesInputItemIcon`

```svelte
<script>
	import { CheckboxesInput } from 'svelai/checkboxes-input';

	let skills = $state([]);
</script>

<CheckboxesInput
	label="Skills"
	mode="card"
	bind:value={skills}
	items={[
		{ value: 'js', label: 'JavaScript' },
		{ value: 'py', label: 'Python' }
	]}
/>
```

---

## FileInput

`import { FileInput } from 'svelai/file-input'`

**Unique props:**

- `mode: 'single' | 'multiple'` (default `'single'`) -- `value: File | null` (bindable) in single mode, `File[] | null` in multiple mode
- `types: string[]` (MIME types or extensions), `maxSize: number` (bytes), `maxFiles: number`, `clickable: boolean`
- `placeholder`, `onValueChange: (value) => void`, `onReject: (rejections: FileRejection[]) => void`
- Slots: `fileList`, `file` (custom rendering of the selected files)

Drag-and-drop supported; rejected files (type, size, duplicate, count) are reported through `onReject`. Form type: `'file'` (single) or `'files'` (multiple).

**Theme parts:** `inputContainer` (variants: `size`, `state`), `placeholder`, `fileList`, `file`

```svelte
<script lang="ts">
	import { FileInput } from 'svelai/file-input';

	let avatar = $state<File | null>(null);
	let attachments = $state<File[] | null>(null);
</script>

<FileInput label="Avatar" bind:value={avatar} types={['image/*']} maxSize={2 * 1024 * 1024} />
<FileInput label="Attachments" mode="multiple" bind:value={attachments} maxFiles={5} />
```

---

## Calendar

`import { CalendarInput, CalendarPrimitive } from 'svelai/calendar'`

`CalendarInput` is the Field-based calendar (label, errors, form integration); `CalendarPrimitive` is the bare grid used inside DateInput. Both share these props:

- `type: 'calendar' | 'calendar-range' | 'calendar-multiple'` (required) -- value is `Date | null`, `[Date | null, Date | null] | null`, or `Date[]`
- `value` (bindable), `defaultValue`, `onValueChange: (value) => void`
- `minDate`, `maxDate: Date`, `disabledDates: (Date | [Date, Date])[]`, `today: Date`
- `weekStartsOn: 0..6` (or `weekStartsOnMonday`), `weekdayLength: 'narrow' | 'short'`, `locale`, `view: 'single' | 'double'`
- `events: Event[]` (`{ start, end, ... }` markers), `cell` snippet, `todayBadge` (Chip props), `buttons` (nav ButtonProps), `onViewChange`

**Theme parts:** see `calendarTheme` (`setCalendarInputTheme`); `CalendarInput` also accepts Field parts under `theme.field`.

```svelte
<script lang="ts">
	import { CalendarInput, CalendarPrimitive } from 'svelai/calendar';

	let range = $state<[Date | null, Date | null] | null>(null);
	let day = $state<Date | null>(null);
</script>

<CalendarInput label="Stay" type="calendar-range" bind:value={range} minDate={new Date()} />
<CalendarPrimitive type="calendar" bind:value={day} view="double" />
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

Dates are handled at noon and compared by year/month/day (timezone-resistant). Navigation is chronological in both directions; in RTL the strip and chevrons mirror. Range shifts are a directional push -- the old range slides out while the new slides in from the direction of travel (RTL-mirrored, reduced-motion aware). Custom cell content via the `day` snippet (payload `{ date, selected, today, monthLabel, dayNumber }`).

**Theme parts:** `root`, `navButton`, `days`, `track`, `day`, `dayMonth`, `dayNumber` (day variants: `size`, `color`, `selected`, `today`, `disabled`)

```svelte
<script>
	import { MiniCalendar } from 'svelai/mini-calendar';

	let date = $state(null);
</script>

<MiniCalendar bind:value={date} days={7} color="success" />
```

---

## Form

`import { Form } from 'svelai/form'`

Declarative form from config. Manages state, validation, layout.

**Unique props:**

- `inputs: FormInputs` (required) -- `{ fieldName: { type, ...fieldProps } }`
- `value` (bindable), `defaultValue`, `onValueChange`, `form: FormState` (bindable), `onSubmit: (value) => void | Promise`
- `actions: FormAction[]` (buttons rendered after the fields), `variant: 'plain' | 'sectioned' | 'card'`, `layout: 'vertical' | 'horizontal'`, `size`, `density`

**Slots:** `children`, `header`, `title`, `description`, `footer` -- all receive the `FormState` instance.

**Types:** `text`, `email`, `url`, `password`, `textarea`, `phone`, `rich-text`, `number`, `slider`, `slider-range`, `rating`, `voice`, `tag`, `tag-group`, `keyvalue`, `pin`, `date`, `datetime`, `time`, `switch`, `checkbox`, `select`, `radio`, `combobox`, `checkboxes`, `file`, `files`, `calendar`, `calendar-range`, `color`

**Layout:** 2-column grid. `class: 'col-span-1'` for single column.

**Responsive layout is a container query on the form, not the viewport.** `layout="horizontal"`
(and `labelPosition="left"` on a Field) moves the label beside its control once the _field itself_
is at least 32rem wide, and stacks below that — a form in a 400px drawer stays stacked on a 27"
screen. Form group `columns` switch at 42rem (2), 56rem (3) and 72rem (4) of form width, stepping
down through 2 columns and then to 1 as the form narrows. The action row shares the field label
grid, so its label column lines up with every other label. `Ask`'s dialog footer is its own
container: Cancel and Confirm stack until the _footer_ clears 24rem (`@sm:`), whatever the screen
is doing. Size the form's host, not the browser window, to get a particular column count, and write
`@`-prefixed container variants (never `sm:` / `md:` / `lg:`) in Form, Field or Ask theme
overrides.

**FormState:** `value`, `loading`, `hasError`, `fields`, `validate()`, `submit()`

**Theme parts:** `root`, `formHeader`, `formTitle`, `formDescription`, `formGroup`, `formGroupLabel`, `formGroupDescription`, `formGroupFields`, `formItem`, `formActions`, `formAction`, `formCustom`, `formFooter`

```svelte
<script>
	import { Form } from 'svelai/form';
	import { Button } from 'svelai/button';

	const handleSubmit = async (value) => {
		console.log(value);
	};
</script>

<Form
	inputs={{
		name: { type: 'text', label: 'Name', required: true, class: 'col-span-1' },
		email: { type: 'email', label: 'Email', required: true, class: 'col-span-1' }
	}}
	onSubmit={handleSubmit}
>
	{#snippet footer(form)}
		<Button type="submit" loading={form.loading}>Submit</Button>
	{/snippet}
</Form>
```

---

## MultiStepForm

`import { MultiStepForm } from 'svelai/multi-step-form'`

**Unique props:**

- `items: Array<{ title?, description?, inputs }>` (required)
- `value` (bindable, merged values of all steps), `defaultValue`
- `onSubmitForm: (values) => void | Promise`, `onSubmitStep: ({ value, step, index }) => boolean | void | Promise` (return `false` to block navigation)
- `showMeter`, `meterColor`, `previousText`, `nextText`, `submitText`, `previousButtonProps`, `nextButtonProps`, `submitButtonProps`, `variant`

**Slots:** `children` receives the `MultiStepFormState` (`activeStep`, `isLastStep`, `loading`, `value`, `submit()`, `stepper`).

Uses Stepper for progress. Validates per step. Data persists across steps.

**Theme parts:** `root`, `multiStepFormHeader`, `multiStepFormContent`, `multiStepFormFooter`, plus `theme.form` for the inner Form

```svelte
<script>
	import { MultiStepForm } from 'svelai/multi-step-form';

	let data = $state({});
	const handleSubmit = async (value) => {
		console.log(value);
	};
</script>

<MultiStepForm
	items={[
		{ title: 'Account', inputs: { email: { type: 'email', label: 'Email', required: true } } },
		{ title: 'Profile', inputs: { name: { type: 'text', label: 'Name', required: true } } }
	]}
	bind:value={data}
	onSubmitForm={handleSubmit}
/>
```
