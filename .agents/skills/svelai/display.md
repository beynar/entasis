# Svelai Display Components Reference

## Table of Contents

- [Button](#button)
- [ButtonGroup](#buttongroup)
- [Avatar / AvatarGroup](#avatar)
- [Chip](#chip)
- [Heading](#heading)
- [Code](#code)
- [Meter](#meter)
- [Stat](#stat)
- [MetadataList](#metadatalist)
- [Rating](#rating)
- [ToggleButton](#togglebutton)
- [ToggleButtonGroup](#togglebuttongroup)
- [Icons](#icons)
- [QRCode](#qrcode)
- [DocumentViewer](#documentviewer)

---

## Button

`import { Button } from 'svelai/button'`

### Unique Props

| Prop           | Type                          | Default | Notes                                           |
| -------------- | ----------------------------- | ------- | ----------------------------------------------- |
| fullWidth      | boolean                       | false   | Takes full container width                      |
| squared        | boolean                       | auto    | Auto-detected when only prefix/suffix provided  |
| loading        | boolean                       | false   | Shows loading state, disables interaction       |
| href           | string                        | -       | Renders as `<a>` instead of `<button>`          |
| target         | string                        | -       | Link target (with href)                         |
| rel            | string                        | -       | Link relationship (with href)                   |
| onclick        | (event: MouseEvent) => void   | -       | Native click handler                            |
| onpointerenter | (event: PointerEvent) => void | -       | Native pointer enter handler                    |
| onpointerleave | (event: PointerEvent) => void | -       | Native pointer leave handler                    |
| ref            | HTMLElement                   | -       | Element reference                               |
| label          | string                        | -       | Accessible name; required for icon-only buttons |

Defaults: `variant="solid"`, `size="normal"`, `color` = theme `defaultColor` (`neutral`).

### Theme Parts

`root` (base, size, color, variant, loading, disabled, squared, fullWidth), `prefix` (base, size), `suffix` (base, size)

### Key Example

```svelte
<script>
	import { Button } from 'svelai/button';
	import { floppyDiskIcon } from 'svelai/icons/floppyDisk';

	let saving = $state(false);
</script>

<Button variant="outline" color="primary" loading={saving}>
	{#snippet prefix()}{@render floppyDiskIcon()}{/snippet}
	Save
</Button>
```

---

## ButtonGroup

`import { ButtonGroup } from 'svelai/button-group'`

### Unique Props

| Prop  | Type                 | Notes                                             |
| ----- | -------------------- | ------------------------------------------------- |
| items | Array\<ButtonProps\> | **Required.** Each item supports all Button props |

Shared props (size, color, variant, disabled) apply to all buttons. Individual button props override shared ones.

### Theme Parts

`root` (base only -- handles border-radius/border connections)

### Key Example

```svelte
<script>
	import { ButtonGroup } from 'svelai/button-group';

	let selected = $state('day');
</script>

<ButtonGroup
	variant="outline"
	color="primary"
	items={[
		{
			children: 'Day',
			variant: selected === 'day' ? 'solid' : 'ghost',
			onclick: () => (selected = 'day')
		},
		{
			children: 'Week',
			variant: selected === 'week' ? 'solid' : 'ghost',
			onclick: () => (selected = 'week')
		}
	]}
/>
```

---

## Avatar

`import { Avatar, AvatarGroup } from 'svelai/avatar'`

### Avatar Props

| Prop    | Type    | Default      | Notes                                                      |
| ------- | ------- | ------------ | ---------------------------------------------------------- |
| name    | string  | **Required** | Display name; its initials render when no image shows      |
| src     | string  | -            | Image URL; initials render when omitted or when it fails   |
| alt     | string  | `name`       | Alternative text for the image                             |
| delay   | number  | 0            | Delay before revealing a loaded image (ms)                 |
| loading | boolean | false        | Bindable; `false` with no `src`, and once loaded or failed |

`name` / `src` / `alt` are the fields of the exported `AvatarItem` type.

prefix = bottom-left badge, suffix = bottom-right badge (both are `Slot`s and take no payload).

### AvatarGroup Props

| Prop           | Type                                    | Notes                                             |
| -------------- | --------------------------------------- | ------------------------------------------------- |
| items          | Array\<AvatarItem & I\>                 | **Required**; each item is `{ src?, alt?, name }` |
| max            | number                                  | Show "+N" indicator after this count              |
| avatar         | Snippet\<{ item, index, avatarProps }\> | Custom avatar rendering                           |
| remainingCount | Snippet\<{ items, remaining }\>         | Custom "+N" rendering                             |

### Theme Parts

`root` (base, size), `avatarImage` (base, size), `avatarPrefix` (base, size), `avatarSuffix` (base, size), `avatarInitials` (base, size)

### Key Example

```svelte
<script>
	import { Avatar, AvatarGroup } from 'svelai/avatar';

	const teamMembers = [{ name: 'Jane Doe' }, { name: 'John Roe' }, { name: 'Ada Lovelace' }];
</script>

<AvatarGroup items={teamMembers} max={3} />

<Avatar name="Jane Doe" src="/jane.jpg">
	{#snippet suffix()}
		<div class="border-surface bg-success h-3 w-3 rounded-full border-2"></div>
	{/snippet}
</Avatar>
```

---

## Chip

`import { Chip } from 'svelai/chip'`

Compact tag/label element. Renders as `<button>` (if onclick/onenter/onleave), `<a>` (if href), or `<div>`. There is no separate Badge component: the `position` prop turns a Chip into a corner badge.

### Unique Props

| Prop     | Type                                                         | Notes                                                                                                                                                                                                                                                                                                                                             |
| -------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onclick  | (event: MouseEvent) => void                                  | Makes chip interactive                                                                                                                                                                                                                                                                                                                            |
| onenter  | (event: PointerEvent) => void                                | Pointer enter                                                                                                                                                                                                                                                                                                                                     |
| onleave  | (event: PointerEvent) => void                                | Pointer leave                                                                                                                                                                                                                                                                                                                                     |
| href     | string                                                       | Renders as anchor                                                                                                                                                                                                                                                                                                                                 |
| target   | string                                                       | Link target                                                                                                                                                                                                                                                                                                                                       |
| rel      | string                                                       | Link relationship                                                                                                                                                                                                                                                                                                                                 |
| position | 'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right' | Absolute corner overlay; the parent must establish a positioning context                                                                                                                                                                                                                                                                          |
| selected | boolean                                                      | The whole chosen/unchosen axis: stamps `data-selected`, paints the shared soft selected fill on top of `variant`, and writes the accessible state -- `aria-pressed` on a chip that resolved to a button, `aria-current` on one that resolved to a link, nothing on a chip with neither `onclick` nor `href` (and `aria-disabled` from `disabled`) |

Variants limited to: `solid`, `outline`, `soft`. Default variant: `outline`. Default color: theme `defaultColor` (`neutral`).

Pair `selected` with `variant="soft"` for the chosen entry and `variant="outline"` for the rest; `TagGroup` does exactly this rather than reaching the selected recipe through its own theme part.

### Theme Parts

`root` (base, size, color, variant), `prefix` (base, size), `suffix` (base, size)

### Key Example

```svelte
<script>
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
	import { tagIcon } from 'svelai/icons/tag';
	import { xIcon } from 'svelai/icons/x';
</script>

<Chip color="primary" variant="soft">
	{#snippet prefix()}{@render tagIcon()}{/snippet}
	Category
	{#snippet suffix()}
		<button aria-label="Remove category">{@render xIcon({ size: 12 })}</button>
	{/snippet}
</Chip>

<div class="relative inline-block">
	<Button>Notifications</Button>
	<Chip color="danger" variant="solid" size="small" position="top-right">3</Chip>
</div>
```

---

## Heading

`import { Heading } from 'svelai/heading'`

### Unique Props

| Prop      | Type                                                    | Default  | Notes                                                 |
| --------- | ------------------------------------------------------- | -------- | ----------------------------------------------------- |
| size      | 'h1'-'h6'                                               | 'h2'     | Visual size + default HTML element                    |
| as        | 'h1'-'h6'                                               | -        | Override HTML element (decouple visual from semantic) |
| weight    | 'light' \| 'normal' \| 'medium' \| 'semibold' \| 'bold' | 'normal' | Font weight                                           |
| align     | 'left' \| 'center' \| 'right'                           | 'left'   | Text alignment                                        |
| underline | boolean                                                 | false    | Adds underline decoration                             |
| muted     | boolean                                                 | false    | Reduced opacity                                       |
| balanced  | boolean                                                 | true     | `text-wrap: balance`                                  |
| trim      | 'none' \| 'start' \| 'end' \| 'both'                    | 'both'   | Vertical rhythm trimming                              |

No prefix/suffix slots. No color/variant props.

### Theme Parts

`root` (base, size, weight, align, balanced, underline, muted)

### Key Example

```svelte
<script>
	import { Heading } from 'svelai/heading';
</script>

<Heading size="h1" as="h2" weight="bold" trim="both">Page Title</Heading>
<Heading size="h3" muted>Subtitle</Heading>
```

---

## Code

`import { Code } from 'svelai/code'`

### Unique Props

| Prop            | Type             | Default  | Notes                                                  |
| --------------- | ---------------- | -------- | ------------------------------------------------------ |
| code            | string           | -        | **Required.** Source string to highlight (also copied) |
| language        | string           | 'text'   | Language id or alias (`ts`, `svelte`, `css`, `bash`)   |
| title           | string           | language | Header label                                           |
| showLineNumbers | boolean          | false    | Line-number gutter                                     |
| wrap            | boolean          | false    | Soft-wrap long lines instead of scrolling              |
| maxHeight       | number \| string | -        | Caps height; number = px                               |
| showHeader      | boolean          | true     | Header row (title + copy button)                       |
| copyable        | boolean          | true     | Copy-to-clipboard button                               |

Block only (no inline mode). No color/variant/size props. Slots `header`/`footer` receive `{ language, label, copied, copy }`.

### Theme Parts

`root`, `header`, `title`, `container`, `footer`, `floatingCopy`

### Key Example

```svelte
<script>
	import { Code } from 'svelai/code';
</script>

<Code
	language="typescript"
	title="user.ts"
	code={'interface User { name: string; age: number; }'}
/>

<Code language="bash" showHeader={false} code="pnpm add svelai" />
```

---

## Meter

`import { Meter } from 'svelai/meter'`

Progress/measurement visualization with spring animations.

### Unique Props

| Prop                                   | Type                                         | Default      | Notes                                                                                                             |
| -------------------------------------- | -------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------- |
| value                                  | number \| MeterStep\<T\> \| MeterStep\<T\>[] | **Required** | Plain number, one segment, or stacked segments; a segment is `{ value, label?, color?, icon?, position?, data? }` |
| color                                  | Colors                                       | 'primary'    | Color for a numeric value, and the fallback for segments with no color                                            |
| min                                    | number                                       | 0            | Minimum value                                                                                                     |
| max                                    | number                                       | 100          | Maximum value                                                                                                     |
| showIndicatorAs                        | 'value' \| 'percentage'                      | -            | Indicator display format                                                                                          |
| showLegend                             | boolean                                      | false        | Lists each segment's label and percentage under the track                                                         |
| steps                                  | Array\<Step\>                                | -            | `{ start, end?, label: Slot, color, position?, class?, labelClass?, data? }`                                      |
| stiffness / damping / soft / precision | number                                       | -            | Spring animation params                                                                                           |

A numeric `value` renders one segment whose legend label defaults to the number itself.

The metadata generics are unconstrained and default to `unknown` (`MeterProps<T = unknown, S = unknown>`, `MeterStep<T = unknown>`), so `data` takes any shape. `steps` and `min` are currently accepted but never rendered.

Slots: `label`, `description`, `helper`, `header`, `indicator` (payload-less; use `showIndicatorAs` for the built-in value/percentage text)

### Theme Parts

`root` (base, size), `header` (base, size), `container` (base, first, last), `label` (base, size), `helper` (base, size), `description` (base, size), `progress` (base, size), `track` (base, size, labelsPosition), `indicator` (base, size, position), `legend` (base, size), `legendItem` (base, size), `legendIcon` (base, size), `legendLabel` (base, size), `legendPercentage` (base, size)

### Key Example

```svelte
<script>
	import { Meter } from 'svelai/meter';
</script>

<Meter value={72} color="success" label="Uptime" />

<Meter
	value={[
		{ value: 45, color: 'primary', label: 'Used' },
		{ value: 20, color: 'info', label: 'Cached' }
	]}
	max={100}
	steps={[
		{ start: 0, end: 50, label: 'Low', color: 'success' },
		{ start: 50, end: 100, label: 'High', color: 'danger' }
	]}
/>
```

---

## Stat

`import { Stat, statDefaultOrder, type StatPart } from 'svelai/stat'`

Single metric surface: label, value, unit, decorative indicator, hairline, trend row, description,
plus a top-right action button.

### Unique Props

| Prop             | Type                                      | Default                                               | Notes                                                                                                                                |
| ---------------- | ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| order            | readonly StatPart[]                       | `['label','value','indicator','trend','description']` | Regions to render, in order. A region left out is not rendered, so `'separator'` is opt-in — it is the only way to show the hairline |
| variant          | 'solid' \| 'outline' \| 'soft' \| 'ghost' | 'solid'                                               | Surface treatment                                                                                                                    |
| trendDirection   | 'up' \| 'down' \| 'neutral'               | 'neutral'                                             | Tones the trend text and appends the matching arrow after it                                                                         |
| indicatorVariant | 'default' \| 'icon' \| 'badge'            | 'default'                                             | Presentation of the decorative `indicator`; it is never a button                                                                     |
| indicatorColor   | Colors                                    | 'neutral'                                             | Color token for the `indicator`                                                                                                      |
| onAction         | (event: MouseEvent) => void               | -                                                     | Click handler for the `action` button                                                                                                |
| actionLabel      | string                                    | -                                                     | Accessible name for the `action` button; required when the action is icon-only                                                       |
| actionDisabled   | boolean                                   | -                                                     | Disables the `action` button                                                                                                         |

`order` is the single source of truth for what renders: `indicator` always sits in column 2 whatever
its position in the list, the first two listed regions sit beside it, and the rest span the full width.
`statDefaultOrder` is the exported default so a consumer can splice `'separator'` into it.

Slots: `label`, `value`, `unit` (inline after `value`, one type step down), `indicator`, `action`
(icon-only ghost button, top-right), `trendIcon` (leading, neutral), `trend` (text only — the arrow
comes from `trendDirection`), `description`, `children`

### Theme Parts

`root`, `region`, `label`, `value`, `unit`, `aside`, `action`, `indicator`, `trend`, `trendIcon`, `trendText`, `description`, `separator`

### Key Example

```svelte
<script lang="ts">
	import { Stat } from 'svelai/stat';
	import { lightningIcon } from 'svelai/icons/lightning';
	import { dotsThreeVerticalIcon } from 'svelai/icons/dotsThreeVertical';
</script>

<Stat
	variant="outline"
	size="large"
	order={['label', 'value', 'description', 'separator', 'trend']}
	label="Total Tasks"
	value="147"
	unit="task"
	description="Tasks moved, comments & edits"
	trend="+15% from last week"
	trendDirection="up"
	actionLabel="More actions for Total Tasks"
	onAction={() => {}}
>
	{#snippet action()}{@render dotsThreeVerticalIcon()}{/snippet}
	{#snippet trendIcon()}{@render lightningIcon()}{/snippet}
</Stat>
```

---

## MetadataList

`import { MetadataList } from 'svelai/metadata-list'`

Read-only key/value list (Notion page-properties panel). Muted key label (optional icon) on the left, a typed value on the right. Value `type` is auto-detected from the value and formatted (numbers/dates via `Intl`).

### Unique Props

| Prop            | Type                                   | Default  | Notes                                                                                      |
| --------------- | -------------------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| items           | MetadataListItem[]                     | []       | `{ id?, key?, title?, value?, type?, icon?, color?, href? }`; label = `key ?? title ?? id` |
| size            | 'small' \| 'normal' \| 'large'         | 'normal' | Typography only: text, key icons, chip size                                                |
| density         | 'compact' \| 'normal' \| 'comfortable' | 'normal' | Spacing only: section, row, label/value and chip-list gaps                                 |
| columns         | number                                 | 1        | Items flow into N grid columns                                                             |
| maxItems        | number                                 | -        | Collapse extras behind an animated "Show N more" toggle                                    |
| expanded        | boolean                                | false    | **Bindable.** Toggle state                                                                 |
| defaultExpanded | boolean                                | false    | Initial toggle state when `expanded` is omitted                                            |
| i18n            | Partial\<Messages\>                    | -        | Overrides `showMoreItems`, `showLess`, `trueLabel`, `falseLabel`                           |

Value types: `text`, `number`, `boolean`, `date`, `url`, `email`, `phone`, `chip`, `chips`. Auto-detected: boolean, number, `Date`, arrays (`chips`), `https?://` strings (`url`), emails. `phone` is never auto-detected -- set `type: 'phone'`. Nullish values render a muted em dash. Slots `key`/`value` (payload `{ item, index, type, label, formatted }`) replace a cell for every item; `title`/`description` are plain header slots.

### Theme Parts

`root` (density), `header` (density), `title` (size), `description` (size), `list` (density), `item` (density), `key` (size, density), `keyIcon` (size), `value` (size), `link`, `chips` (density), `toggle` (size, density), `toggleIcon` (expanded)

### Key Example

```svelte
<script lang="ts">
	import { MetadataList, type MetadataListItem } from 'svelai/metadata-list';

	const items: MetadataListItem[] = [
		{ key: 'Name', value: 'Design System v2' },
		{ key: 'Status', value: 'Active', type: 'chip', color: 'success' },
		{ key: 'Created', value: new Date('2025-01-15') },
		{ key: 'Repository', value: 'https://github.com/org/design-system' }
	];
</script>

<MetadataList title="Project Details" {items} />

<MetadataList {items}>
	{#snippet value({ item, formatted })}
		{#if item.key === 'Name'}
			<span class="flex items-center gap-2">
				<span class="bg-primary size-2 rounded-full"></span>
				{formatted}
			</span>
		{:else}
			{formatted}
		{/if}
	{/snippet}
</MetadataList>
```

---

## Rating

`import { Rating } from 'svelai/rating'`

Read-only star rating display: half/partial fills, configurable star count, RTL. `RatingInput` (see form-inputs.md) builds on it -- they share the same theme.

### Unique Props

| Prop  | Type                                    | Default    | Notes                                                  |
| ----- | --------------------------------------- | ---------- | ------------------------------------------------------ |
| value | number \| null                          | 0          | Fractions render as partial fills (e.g. 3.7)           |
| max   | number                                  | 5          | Star count = maximum value                             |
| color | Colors                                  | 'warning'  | Fill color (default is the classic gold)               |
| size  | 'small' \| 'normal' \| 'large'          | 'normal'   | Star box size and gap                                  |
| dir   | 'ltr' \| 'rtl'                          | ambient    | RTL orders and fills from the right                    |
| star  | Snippet\<[{ index, fraction, layer }]\> | star icons | Custom icon; rendered per layer (`'base'` \| `'fill'`) |
| i18n  | Partial\<Messages\>                     | -          | Per-instance i18n overrides                            |

Accessibility: the row is `role="img"` labelled "{value} of {max}" (localized); stars are aria-hidden.

### Theme Parts

`container` (size, disabled), `star` (size, interactive), `starBase`, `starFill` (color). Shared: `setRatingTheme` themes both `Rating` and `RatingInput`.

### Key Example

```svelte
<script>
	import { Rating } from 'svelai/rating';
	import { heartIcon, heartIconFill } from 'svelai/icons/heart';
</script>

<Rating value={3.7} />
<Rating value={7.5} max={10} color="primary" size="large" />
<Rating value={3.5}>
	{#snippet star({ layer })}
		{#if layer === 'base'}
			{@render heartIcon({ class: 'size-full' })}
		{:else}
			{@render heartIconFill({ class: 'size-full' })}
		{/if}
	{/snippet}
</Rating>
```

---

## ToggleButton

`import { ToggleButton } from 'svelai/toggle-button'`

Two-state toggle button. Default variant: `outline`.

### Unique Props

| Prop          | Type                     | Notes                                         |
| ------------- | ------------------------ | --------------------------------------------- |
| value         | boolean                  | **Bindable.** Pressed state                   |
| defaultValue  | boolean                  | Initial pressed state when `value` is omitted |
| onValueChange | (value: boolean) => void | Called after a user interaction               |
| label         | string                   | Required when the button has no visible text  |

Variants: `outline`, `ghost` only.

### Theme Parts

`root` (base, checked, disabled, color, variant, squared, size), `prefix` (base, size, checked), `suffix` (base, size, checked)

### Key Example

```svelte
<script>
	import { ToggleButton } from 'svelai/toggle-button';
	import { textBIcon } from 'svelai/icons/textB';

	let isBold = $state(false);
</script>

<ToggleButton bind:value={isBold}>
	{#snippet prefix()}{@render textBIcon()}{/snippet}
	Bold
</ToggleButton>
```

---

## ToggleButtonGroup

`import { ToggleButtonGroup } from 'svelai/toggle-button-group'`

### Unique Props

| Prop          | Type                    | Default      | Notes                                                                         |
| ------------- | ----------------------- | ------------ | ----------------------------------------------------------------------------- |
| items         | ToggleButtonGroupItem[] | **Required** | Each item is `{ value, ...ToggleButton props }` (no `variant`/`color`/`size`) |
| label         | string                  | **Required** | Accessible group name                                                         |
| type          | 'multiple' \| 'single'  | 'multiple'   | `'single'` renders a radiogroup of radios and holds one value                 |
| value         | string[] \| string      | -            | **Bindable.** Pressed values (`multiple`) or the checked value (`single`)     |
| defaultValue  | string[] \| string      | -            | Initial pressed state when `value` is omitted                                 |
| onValueChange | (value) => void         | -            | Called with the updated group value after a toggle                            |
| joined        | boolean                 | false        | Render buttons as contiguous segments                                         |

`type="multiple"` toggles every button independently; `size`, `color`, `variant` apply to all items.

### Theme Parts

`root` (base only)

### Key Example

```svelte
<script>
	import { ToggleButtonGroup } from 'svelai/toggle-button-group';
	import { textBIcon } from 'svelai/icons/textB';
	import { textItalicIcon } from 'svelai/icons/textItalic';

	let formats = $state(['bold']);
</script>

<ToggleButtonGroup
	bind:value={formats}
	label="Text formatting"
	joined
	items={[
		{ value: 'bold', prefix: textBIcon, label: 'Bold' },
		{ value: 'italic', prefix: textItalicIcon, label: 'Italic' }
	]}
/>
```

---

## Icons

`import { iconNameIcon } from 'svelai/icons/iconName'`

1500+ icons, each with 6 variants: `regular`, `bold`, `duotone`, `fill`, `light`, `thin`.

### Import Pattern

```ts
import { houseIcon, houseIconBold, houseIconFill } from 'svelai/icons/house';
```

### IconProps

| Prop     | Type             | Default | Notes                       |
| -------- | ---------------- | ------- | --------------------------- |
| size     | number \| string | 1lh     | Default matches line height |
| mirrored | boolean          | false   | Mirror horizontally         |
| color    | Colors \| string | inherit | Theme color or hex          |
| class    | string           | -       | Extra classes on the svg    |

### Usage

```svelte
<script>
	import { houseIcon } from 'svelai/icons/house';
</script>

{@render houseIcon({ size: 24, color: 'primary' })}
```

### withProps (passing to components)

```svelte
<script>
	import { Button } from 'svelai/button';
	import { eyeClosedIcon } from 'svelai/icons/eyeClosed';
</script>

<Button prefix={eyeClosedIcon.withProps({ color: 'danger' })}>Click me</Button>
```

This avoids verbose `{#snippet prefix()}...{/snippet}` markup. Icons inherit text color and default to `1lh` size, so props are often unnecessary.

---

## QRCode

`import { QRCode } from 'svelai/qr-code'`

Renders a QR code as an SVG. `size` maps to fixed dimensions (small: 96px, normal: 128px, large: 192px); `color` applies theme colors via `currentColor`.

### Unique Props

| Prop                       | Type                                                | Default   | Notes                                                                                  |
| -------------------------- | --------------------------------------------------- | --------- | -------------------------------------------------------------------------------------- |
| value                      | string \| string[]                                  | required  | Content to encode (array = multiple segments)                                          |
| level                      | 'L' \| 'M' \| 'Q' \| 'H'                            | 'M'       | Error correction level; use 'H' with an embedded image                                 |
| marginSize                 | number                                              | 4         | Quiet-zone modules                                                                     |
| background                 | string \| GradientSettings                          | -         | Transparent when omitted                                                               |
| gradient                   | GradientSettings                                    | -         | Applied to modules + finder patterns, overrides colors                                 |
| dataModulesSettings        | { style?, color?, scale?, lineWidth?, randomSize? } | -         | Styles: square, circle, rounded, leaf, circuit-board, star, heart, diamond, hashtag... |
| finderPatternOuterSettings | { style?, color? }                                  | -         | Styles: square, rounded, circle, leaf, inpoint, outpoint...                            |
| finderPatternInnerSettings | { style?, color? }                                  | -         | Outer styles plus diamond, star, heart, hashtag, microchip                             |
| imageSettings              | { src, width, height, excavate?, ... }              | -         | Embedded center image                                                                  |
| label                      | string                                              | 'QR Code' | Accessible label                                                                       |
| ref                        | SVGSVGElement (bindable)                            | -         | The SVG element                                                                        |

### Methods (via `bind:this`)

`download({ name?, format?: 'svg' | 'png' | 'jpeg', dimension? })` -- exports the QR code.

### Theme Parts

`root` (base, size, color)

### Key Example

```svelte
<script>
	import { QRCode } from 'svelai/qr-code';
	import { Button } from 'svelai/button';

	let qr;
</script>

<QRCode
	bind:this={qr}
	value="https://example.com"
	color="primary"
	dataModulesSettings={{ style: 'circle' }}
/>
<Button onclick={() => qr.download({ format: 'png' })}>Download</Button>
```

---

## DocumentViewer

`import { DocumentViewer } from 'svelai/document-viewer'`

Read-only PDF, Word, Excel, CSV, and PowerPoint viewer. Heavy parsing and rendering engines load from pinned CDN assets only for the active format; none are package dependencies. The toolbar adapts to format capabilities, paged formats use a thumbnail sidebar, and XLS/XLSX workbooks use a bottom sheet-tab rail.

The default CDN manifest requires its three origins in `script-src` and `connect-src`, plus `worker-src blob:` and `'wasm-unsafe-eval'` in `script-src`. Override `assets` to use self-hosted origins.

### Unique Props

| Prop                                        | Type                                               | Default             | Notes                                                                                                 |
| ------------------------------------------- | -------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------- |
| src                                         | string \| URL \| Blob \| Uint8Array \| ArrayBuffer | required            | URL or binary document source                                                                         |
| format                                      | pdf/docx/doc/xlsx/xls/csv/pptx/ppt/pages           | detected            | Explicit format override                                                                              |
| fileName                                    | string                                             | -                   | Detection and download name for anonymous binary input                                                |
| page / sheet                                | number (bindable, one-based)                       | 1                   | Current page, slide, or workbook sheet                                                                |
| scale / rotation / fit / mode / orientation | bindable viewer values                             | format defaults     | `mode` selects scroll or single; `orientation` applies to continuous PDF and Word layouts             |
| sidebar / sheetTabs                         | boolean                                            | true                | Thumbnail pager and workbook tab rail                                                                 |
| assets                                      | DocumentViewerAssetsOverride                       | pinned CDN manifest | Override module, worker, and WASM URLs for self-hosting                                               |
| controls                                    | array \| false                                     | all                 | Includes sidebar, navigation, pageInfo, zoom, fit, mode, orientation, rotate, search, download, print |
| onLoad / onError / onWarning                | functions                                          | -                   | Lifecycle and degraded-fidelity reporting                                                             |
| onPageChange / onSheetChange                | functions                                          | -                   | One-based navigation callbacks                                                                        |
| toolbar / error / thumbnail                 | snippets                                           | -                   | Customize the shell without replacing its state                                                       |

### Theme Parts

`root`, `toolbar`, `pageInfo`, `viewer`, `workspace`, `content`, `warning`, `sidebar`, `thumbnails`, `thumbnail`, `surface`, `pages`, `page`, `error`, `skeleton`, `search`, `sheetTabs`, `sheetTab`, `grid`, `gridCell`, `gridHeader`, `legacyPage`, `ooxmlPage`

### Key Example

DocumentViewer fills its nearest sized parent. The parent must provide a definite height. Its responsive
layout is keyed on the viewer's own width, not the window: the root is an `@container`, and below
`@2xl` (42rem / 672px) the thumbnail sidebar leaves the flow and floats over the page as a drawer.
Embed the viewer in any width of host — a split pane, a drawer, a dialog — and it adapts
(`documentViewer.sidebar` carries the `@max-2xl:*` classes; a `root` override must keep
`@container`).

```svelte
<script>
	import { DocumentViewer } from 'svelai/document-viewer';

	let sheet = $state(1);
</script>

<div class="h-[600px]">
	<DocumentViewer
		src="/quarterly-report.xlsx"
		bind:sheet
		controls={['zoom', 'search', 'download']}
	/>
</div>
```

---

## Global Theming Note

Each component exposes `set[Component]Theme()` from its import path (e.g., `setButtonTheme` from `'svelai/button'`). The shape is `{ root: { base, color: {...}, variant: {...}, size: {...} }, prefix: {...} }` -- see [theming.md](theming.md#component-theme-overrides).
