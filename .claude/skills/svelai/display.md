# Svelai Display Components Reference

## Table of Contents

- [Button](#button)
- [ButtonGroup](#buttongroup)
- [Badge](#badge)
- [Avatar / AvatarGroup](#avatar)
- [Chip](#chip)
- [Heading](#heading)
- [Code](#code)
- [Meter](#meter)
- [MetadataList](#metadatalist)
- [Rating](#rating)
- [ToggleButton](#togglebutton)
- [ToggleButtonGroup](#togglebuttongroup)
- [QRCode](#qrcode)
- [PDFViewer](#pdfviewer)
- [Icons](#icons)

---

## Button

`import { Button } from 'svelai/button'`

### Unique Props

| Prop      | Type               | Default | Notes                                          |
| --------- | ------------------ | ------- | ---------------------------------------------- |
| fullWidth | boolean            | false   | Takes full container width                     |
| squared   | boolean            | auto    | Auto-detected when only prefix/suffix provided |
| loading   | boolean            | false   | Shows loading state, disables interaction      |
| href      | string             | -       | Renders as `<a>` instead of `<button>`         |
| target    | string             | -       | Link target (with href)                        |
| rel       | string             | -       | Link relationship (with href)                  |
| onclick   | (event: MouseEvent) => void | - | Native click handler                         |
| onpointerenter | (event: PointerEvent) => void | - | Native pointer enter handler            |
| onpointerleave | (event: PointerEvent) => void | - | Native pointer leave handler            |
| ref       | HTMLElement        | -       | Element reference                              |

### Theme Parts

`button` (base, size, color, variant, loading, disabled, squared, fullWidth), `prefix` (base, size), `suffix` (base, size)

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

| Prop    | Type                 | Notes                                             |
| ------- | -------------------- | ------------------------------------------------- |
| buttons | Array\<ButtonProps\> | **Required.** Each item supports all Button props |

Shared props (size, color, variant, disabled) apply to all buttons. Individual button props override shared ones.

### Theme Parts

`buttonGroup` (base only -- handles border-radius/border connections)

### Key Example

```svelte
<ButtonGroup
	variant="outline"
	color="primary"
	buttons={[
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

## Badge

`import { Badge } from 'svelai/badge'`

Absolute-positioned indicator. **Parent must have `position: relative`.**

### Unique Props

| Prop     | Type                                                     | Default    | Notes                       |
| -------- | -------------------------------------------------------- | ---------- | --------------------------- |
| position | 'topLeft' \| 'topRight' \| 'bottomLeft' \| 'bottomRight' | 'topRight' | Position relative to parent |

Variants limited to: `solid`, `outline`, `soft`. Default color: `primary`. Default size: `small`.

### Theme Parts

`badge` (base, size, color, variant, position)

### Key Example

```svelte
<div class="relative inline-block">
	<Button>Notifications</Button>
	<Badge color="danger">3</Badge>
</div>
```

---

## Avatar

`import { Avatar, AvatarGroup } from 'svelai/avatar'`

### Avatar Props

| Prop         | Type                                             | Default      | Notes                             |
| ------------ | ------------------------------------------------ | ------------ | --------------------------------- |
| user         | { name: string; avatar?: string } & T            | **Required** | Initials auto-extracted from name |
| delay        | number                                           | 0            | Delay before showing avatar (ms)  |
| loadingState | 'waiting' \| 'loading' \| 'errored' \| 'success' | 'waiting'    | Bindable                          |

prefix = bottom-left badge, suffix = bottom-right badge (both receive `{ name, avatar }` as snippet args).

### AvatarGroup Props

| Prop           | Type                                           | Notes                                |
| -------------- | ---------------------------------------------- | ------------------------------------ |
| users          | Array\<{ name: string; avatar?: string } & T\> | **Required**                         |
| max            | number                                         | Show "+N" indicator after this count |
| avatar         | Snippet\<{ user, index, avatarProps }\>        | Custom avatar rendering              |
| remainingCount | Snippet\<{ users, remaining }\>                | Custom "+N" rendering                |

### Theme Parts

`avatar` (base, size), `avatarImage` (base, size), `avatarPrefix` (base, size), `avatarSuffix` (base, size), `avatarInitials` (base, size)

### Key Example

```svelte
<AvatarGroup users={teamMembers} max={3} />

<Avatar user={{ name: 'Jane Doe', avatar: '/jane.jpg' }}>
	{#snippet suffix()}
		<div class="w-3 h-3 rounded-full bg-success border-2 border-background"></div>
	{/snippet}
</Avatar>
```

---

## Chip

`import { Chip } from 'svelai/chip'`

Small tag/label element. Renders as `<button>` (if onclick/onenter/onleave), `<a>` (if href), or `<div>`.

### Unique Props

| Prop    | Type                          | Notes                  |
| ------- | ----------------------------- | ---------------------- |
| onclick | (event: MouseEvent) => void   | Makes chip interactive |
| onenter | (event: PointerEvent) => void | Pointer enter          |
| onleave | (event: PointerEvent) => void | Pointer leave          |
| href    | string                        | Renders as anchor      |
| target  | string                        | Link target            |
| rel     | string                        | Link relationship      |

Variants limited to: `solid`, `outline`, `soft`. Default color: `primary`.

### Theme Parts

`chip` (base, size, color, variant), `prefix` (base, size), `suffix` (base, size)

### Key Example

```svelte
<script>
	import { Chip } from 'svelai/chip';
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

`heading` (base, size, weight, align, balanced, underline, muted)

### Key Example

```svelte
<Heading size="h1" as="h2" weight="bold" trim="both">Page Title</Heading>
<Heading size="h3" muted>Subtitle</Heading>
```

---

## Code

`import { Code } from 'svelai/code'`

### Unique Props

| Prop     | Type    | Default | Notes                                  |
| -------- | ------- | ------- | -------------------------------------- |
| language | string  | -       | Language for syntax highlighting       |
| inline   | boolean | false   | Inline `<code>` vs block `<pre><code>` |

No color/variant/size props.

### Theme Parts

`code` (base), `header` (base), `footer` (base), `container` (base), `pre` (base), `line` (base)

### Key Example

```svelte
<p>Use <Code inline>$state()</Code> for reactivity.</p>

<Code language="typescript">
	{'interface User { name: string; age: number; }'}
</Code>
```

---

## Meter

`import { Meter } from 'svelai/meter'`

Progress/measurement visualization with spring animations.

### Unique Props

| Prop                                   | Type                              | Default      | Notes                                                                        |
| -------------------------------------- | --------------------------------- | ------------ | ---------------------------------------------------------------------------- |
| value                                  | Meter\<T\> \| Array\<Meter\<T\>\> | **Required** | `{ value, label?, color?, position?, data? }`                                |
| min                                    | number                            | 0            | Minimum value                                                                |
| max                                    | number                            | 100          | Maximum value                                                                |
| showIndicatorAs                        | 'value' \| 'percentage'           | -            | Indicator display format                                                     |
| steps                                  | Array\<Step\>                     | -            | `{ start, end?, label: Slot, color, position?, class?, labelClass?, data? }` |
| stiffness / damping / soft / precision | number                            | -            | Spring animation params                                                      |

Slots: `label`, `description`, `helper`, `header`, `indicator` (receives `{ value, percentage, min, max }`)

### Theme Parts

`meter` (base, size), `header` (base, size), `container` (base, first, last), `label` (base, size), `helper` (base, size), `description` (base, size), `progress` (base, size), `track` (base, size, labelsPosition), `indicator` (base, size, position), `legend` (base, size), `legendItem` (base, size), `legendIcon` (base, size), `legendLabel` (base, size), `legendPercentage` (base, size)

### Key Example

```svelte
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

## MetadataList

`import { MetadataList } from 'svelai/metadata-list'`

Read-only key/value list (Notion page-properties panel). Muted key label (optional icon) on the left, a typed value on the right. Value `type` is auto-detected from the value and formatted (numbers/dates via `Intl`).

### Unique Props

| Prop        | Type                            | Default | Notes                                                                     |
| ----------- | ------------------------------- | ------- | ------------------------------------------------------------------------- |
| items       | MetadataListItem[]              | []      | `{ id?, key?, title?, value?, type?, icon?, color?, href? }`; label = `key ?? title ?? id` |
| size        | 'small' \| 'normal' \| 'large'  | 'normal'| Typography only: text, key icons, chip size                               |
| density     | 'small' \| 'normal' \| 'large' | 'normal'| Spacing only: section, row, label/value and chip-list gaps        |
| columns     | number                          | 1       | Items flow into N grid columns                                            |
| maxItems    | number                          | -       | Collapse extras behind an animated "Show N more" toggle                   |
| expanded    | boolean                         | false   | **Bindable.** Toggle state                                                |
| i18n        | Partial\<Messages\>             | -       | Overrides `showMoreItems`, `showLess`, `trueLabel`, `falseLabel`          |

Value types: `text`, `number`, `boolean`, `date`, `url`, `email`, `phone`, `chip`, `chips`. Auto-detected: boolean, number, `Date`, arrays (`chips`), `https?://` strings (`url`), emails. `phone` is never auto-detected — set `type: 'phone'`. Nullish values render a muted em dash. Slots `key`/`value` (payload `{ item, index, type, label, formatted }`) replace a cell for every item; `title`/`description` are plain header slots.

### Theme Parts

`root` (density), `header` (density), `title` (size), `description` (size), `list` (density), `item` (density), `key` (size, density), `keyIcon` (size), `value` (size), `link`, `chips` (density), `toggle` (size, density), `toggleIcon` (expanded)

### Key Example

```svelte
<MetadataList
	title="Project Details"
	items={[
		{ key: 'Name', value: 'Design System v2' },
		{ key: 'Status', value: 'Active', type: 'chip', color: 'success' },
		{ key: 'Created', value: new Date('2025-01-15') },
		{ key: 'Repository', value: 'https://github.com/org/design-system' }
	]}
/>

<MetadataList items={items}>
	{#snippet value({ item, formatted })}
		{#if item.key === 'Owner'}<span class="flex items-center gap-2"><span class="bg-primary size-2 rounded-full"></span>{formatted}</span>{:else}{formatted}{/if}
	{/snippet}
</MetadataList>
```

---

## Rating

`import { Rating } from 'svelai/rating'`

Read-only star rating display: half/partial fills, configurable star count, RTL. `RatingInput` (see form-inputs.md) builds on it — they share the same theme.

### Unique Props

| Prop        | Type                            | Default     | Notes                                                        |
| ----------- | ------------------------------- | ----------- | ------------------------------------------------------------ |
| value       | number \| null                  | 0           | Fractions render as partial fills (e.g. 3.7)                 |
| max         | number                          | 5           | Star count = maximum value                                   |
| color       | Colors                          | 'warning'   | Fill color (default is the classic gold)                     |
| size        | 'small' \| 'normal' \| 'large'  | 'normal'    | Star box size and gap                                        |
| dir         | 'ltr' \| 'rtl'                  | ambient     | RTL orders and fills from the right                          |
| star        | Snippet\<[{index, fraction, layer}]\> | star icons | Custom icon; rendered per layer (`'base'` \| `'fill'`) |
| i18n        | Partial\<Messages\>             | -           | Per-instance i18n overrides                                  |

Accessibility: the row is `role="img"` labelled "{value} of {max}" (localized); stars are aria-hidden.

### Theme Parts

`container` (size, disabled), `star` (size, interactive), `starBase`, `starFill` (color). Shared: `setRatingTheme` themes both `Rating` and `RatingInput`.

### Key Example

```svelte
<Rating value={3.7} />
<Rating value={7.5} max={10} color="primary" size="large" />
<Rating value={3.5}>
	{#snippet star({ layer })}
		{#if layer === 'base'}{@render heartIcon({ class: 'size-full' })}{:else}{@render heartIconFill({ class: 'size-full' })}{/if}
	{/snippet}
</Rating>
```

---

## ToggleButton

`import { ToggleButton } from 'svelai/toggle-button'`

Two-state toggle button. Default variant: `outline`.

### Unique Props

| Prop     | Type                       | Notes                      |
| -------- | -------------------------- | -------------------------- |
| checked  | boolean                    | **Bindable.** Toggle state |
| value    | any                        | Value when used in a group |
| onValueChange | (checked: boolean) => void | State change callback      |

Variants: `solid`, `outline`, `soft`, `ghost` (no `link`).

### Theme Parts

`button` (base, checked, disabled, color, variant, squared, size), `prefix` (base, size, checked), `suffix` (base, size, checked)

### Key Example

```svelte
<script>
	import { ToggleButton } from 'svelai/toggle-button';
	import { textBIcon } from 'svelai/icons/textB';

	let isBold = $state(false);
</script>

<ToggleButton bind:checked={isBold}>
	{#snippet prefix()}{@render textBIcon()}{/snippet}
	Bold
</ToggleButton>
```

---

## ToggleButtonGroup

`import { ToggleButtonGroup } from 'svelai/toggle-button-group'`

### Unique Props

| Prop     | Type                       | Default      | Notes                                    |
| -------- | -------------------------- | ------------ | ---------------------------------------- |
| buttons  | Array\<ToggleButtonProps\> | **Required** | Each needs `value` and `children`        |
| value    | any \| Array\<any\>        | -            | **Bindable.** Selected value(s)          |
| multiple | boolean                    | false        | Allow multi-select (value becomes array) |
| onValueChange | (value) => void            | -            | Selection change callback                |

### Theme Parts

`buttonGroup` (base only)

### Key Example

```svelte
<script>
	import { ToggleButtonGroup } from 'svelai/toggle-button-group';
	import { textBIcon } from 'svelai/icons/textB';
	import { textItalicIcon } from 'svelai/icons/textItalic';

	let formats = $state([]);
</script>

<ToggleButtonGroup
	bind:value={formats}
	multiple
	buttons={[
		{ value: 'bold', prefix: textBIcon.withProps({}) },
		{ value: 'italic', prefix: textItalicIcon.withProps({}) }
	]}
/>
```

---

## Icons

`import { iconNameIcon } from 'svelai/icons/iconName'`

1513 icons, each with 6 variants: `regular`, `bold`, `duotone`, `fill`, `light`, `thin`.

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

### Usage

```svelte
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

| Prop                       | Type                                               | Default   | Notes                                                                                |
| -------------------------- | -------------------------------------------------- | --------- | ------------------------------------------------------------------------------------ |
| value                      | string \| string[]                                 | required  | Content to encode (array = multiple segments)                                        |
| level                      | 'L' \| 'M' \| 'Q' \| 'H'                           | 'M'       | Error correction level; use 'H' with an embedded image                               |
| marginSize                 | number                                             | 4         | Quiet-zone modules                                                                   |
| background                 | string \| GradientSettings                         | -         | Transparent when omitted                                                             |
| gradient                   | GradientSettings                                   | -         | Applied to modules + finder patterns, overrides colors                               |
| dataModulesSettings        | { style?, color?, scale?, lineWidth?, randomSize? } | -         | Styles: square, circle, rounded, leaf, circuit-board, star, heart, diamond, hashtag… |
| finderPatternOuterSettings | { style?, color? }                                 | -         | Styles: square, rounded, circle, leaf, inpoint, outpoint…                            |
| finderPatternInnerSettings | { style?, color? }                                 | -         | Outer styles plus diamond, star, heart, hashtag, microchip                           |
| imageSettings              | { src, width, height, excavate?, … }               | -         | Embedded center image                                                                |
| ariaLabel                  | string                                             | 'QR Code' | Accessible label                                                                     |
| ref                        | SVGSVGElement (bindable)                           | -         | The SVG element                                                                      |

### Methods (via `bind:this`)

`download({ name?, format?: 'svg' | 'png' | 'jpeg', dimension? })` — exports the QR code.

### Theme Parts

`qrCode` (base, size, color)

### Key Example

```svelte
<script>
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

## PDFViewer

`import { PDFViewer } from 'svelai/pdf-viewer'`

Continuous-scroll PDF reader on pdf.js (loaded from cdnjs at runtime — not bundled — client-only, SSR-safe). Renders every page lazily in a ScrollArea with a selectable text layer, in-document search + highlighting, clickable link overlays, zoom, fit-to-width, pinch/Ctrl-wheel zoom, rotation, download and print. `size`/`color` style the toolbar. A strict CSP must allow cdnjs.cloudflare.com.

### Unique Props

| Prop                            | Type                                       | Default      | Notes                                                                                                             |
| ------------------------------- | ------------------------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------- |
| src                             | string \| URL \| Uint8Array \| ArrayBuffer | required     | Document url or binary content                                                                                    |
| page                            | number (bindable)                          | 1            | Current page (nearest viewport middle); set it to scroll                                                          |
| scale                           | number (bindable)                          | 1            | Zoom scale, clamped to minScale/maxScale (0.5/3)                                                                  |
| rotation                        | number (bindable)                          | 0            | Degrees, added to each page's intrinsic /Rotate                                                                   |
| fit                             | 'width' \| 'page' \| null (bindable)       | 'width'      | Fit mode; derives scale from viewport, re-applies on resize/rotation; zooming clears it                           |
| mode                            | 'scroll' \| 'single' (bindable)            | 'scroll'     | Continuous scroll of all pages, or one page at a time                                                             |
| orientation                     | 'vertical' \| 'horizontal' (bindable)      | 'vertical'   | Direction pages flow and scroll                                                                                   |
| pageTransition                  | boolean                                    | true         | Single mode: animate page changes as a card stack (next slides in from the right)                                 |
| toolbarPosition                 | 'top' \| 'bottom' \| 'left' \| 'right'     | 'top'        | Toolbar placement; 'left'/'right' stack the controls vertically                                                   |
| color                           | Colors                                     | 'foreground' | Toolbar control color (neutral by default)                                                                        |
| totalPages                      | number (bindable)                          | 0            | Read-only output                                                                                                  |
| controls                        | array \| false                             | all          | Subset of 'navigation', 'pageInfo', 'zoom', 'fit', 'mode', 'orientation', 'rotate', 'search', 'download', 'print' |
| password                        | string                                     | -            | For protected documents                                                                                           |
| downloadFileName                | string                                     | -            | Name used by the download control                                                                                 |
| onLoad / onError / onPageChange | functions                                  | -            | Lifecycle callbacks                                                                                               |
| toolbar / error                 | Snippet<[PDFViewerState]>                  | -            | Replace the default toolbar or error display                                                                      |

### Theme Parts

`container`, `toolbar`, `pageInfo`, `viewer`, `pages`, `single`, `singlePage`, `scroller`, `page`, `canvas`, `pageError`, `error`, `skeleton`, `search`, `searchInput`, `searchCount`

### Key Example

```svelte
<PDFViewer
	src="/document.pdf"
	fit="width"
	color="secondary"
	controls={['pageInfo', 'search', 'download']}
/>
```

---

## Global Theming Note

Each component exposes `set[Component]Theme()` from its import path (e.g., `setButtonTheme` from `'svelai/button'`).
