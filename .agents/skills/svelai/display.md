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
- [ToggleButton](#togglebutton)
- [ToggleButtonGroup](#togglebuttongroup)
- [QRCode](#qrcode)
- [DocumentViewer](#documentviewer)
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
		<div class="w-3 h-3 rounded-full bg-success border-2 border-surface"></div>
	{/snippet}
</Avatar>
```

---

## Chip

`import { Chip } from 'svelai/chip'`

Compact tag/label element. Renders as `<button>` (if onclick/onenter/onleave), `<a>` (if href), or `<div>`.

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

DocumentViewer fills its nearest sized parent. The parent must provide a definite height.

```svelte
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

Each component exposes `set[Component]Theme()` from its import path (e.g., `setButtonTheme` from `'svelai/button'`).
