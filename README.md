# svelai

Svelte 5 component library for SvelteKit, styled through a Tailwind CSS v4 plugin. One theme declaration in your CSS generates the palette; components consume it through semantic utilities (`bg-primary`, `text-neutral-contrast`, `bg-surface-raised`) and can be restyled per subtree or per instance without forking them.

- 130+ components, each on its own import path (`svelai/button`, `svelai/dialog`, ...)
- Light and dark palettes generated from a handful of seed colors
- Runtime design tokens (spacing, radius, type scale) through the `<Theme>` component
- 1500+ icons as Svelte snippets (`svelai/icons/<name>`)

## Install

```bash
pnpm add svelai
```

Peer dependencies: `svelte ^5`, `@sveltejs/kit ^2` and `tailwindcss ^4` (via `@tailwindcss/vite`). There is no `tailwind.config.js`; all configuration lives in your CSS. The library reads SvelteKit's `$app/environment` and, in `NetworkIndicator`, the `navigating` store, so it runs inside a SvelteKit app.

### Optional peers

svelai installs 21 runtime dependencies. Four rendering libraries stay out of them, declared as optional peer dependencies so they never land in a bundle that does not use them. Install a row only if you import one of the components on it; every other component works with svelai alone.

| Component                                                      | Install                                                                                                                                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Chart`                                                        | `pnpm add @tanstack/charts d3-array d3-force d3-hierarchy d3-sankey d3-scale d3-shape` (TypeScript: `pnpm add -D @types/d3-shape`, for the D3 `CurveFactory` on `curve`) |
| `RichTextInput`, and the `AIComposer` / `AIChat` that embed it | `pnpm add lexical @lexical/history @lexical/link @lexical/list @lexical/markdown @lexical/rich-text @lexical/selection @lexical/utils`                                   |
| `Globe`                                                        | `pnpm add cobe`                                                                                                                                                          |

A missing peer fails the build, not the browser — but Vite substitutes a stub module rather than reporting an unresolved import, so the message names the export before it names the package. Importing `Chart` without the row above fails with a wall of `[MISSING_EXPORT] "bandX" is not exported by "__vite-optional-peer-dep:@tanstack/charts:svelai"`. The package to install and `svelai` are both in that virtual module id.

Row highlighting (`@tanstack/highlight`) and row virtualization (`@tanstack/svelte-virtual`) stay runtime dependencies: `Markdown` renders `Code`, and `AIChat` / `AIConversation` render `AIThread`, so an optional peer there would make the library's most-used components fail to build out of the box — and `svelte-streamdown` already depends on `@tanstack/highlight`, so moving it would remove nothing from the install.

## Tailwind setup

Replace the contents of `src/app.css`. The `@source` line lets Tailwind see the utility classes used inside the packaged components (Tailwind skips `node_modules` by default). The theme marked `default: true` also installs the shared engine (utilities, variants, spinner, `raised-*`), so no second plugin is needed.

```css
@import 'tailwindcss';
@source '../node_modules/svelai/dist';

@plugin 'svelai/tailwind-plugin/theme' {
	name: light;
	default: true;
	colorscheme: light;
	surface: #fafafa;
	neutral: #18181b;
	primary: #5f62ef;
	secondary: #e4e4e7;
	danger: #dc2626;
	success: #15803d;
	warning: #f59e0b;
	info: #2563eb;
}

@plugin 'svelai/tailwind-plugin/theme' {
	name: dark;
	colorscheme: dark;
	surface: #09090b;
	surface-floating: #27272a;
	neutral: #fafafa;
	primary: #5f62ef;
	secondary: #27272a;
	danger: #dc2626;
	success: #15803d;
	warning: #f59e0b;
	info: #2563eb;
	state-hover-opacity: 0.16;
	state-pressed-opacity: 0.32;
}
```

Each named theme is scoped to `html[data-theme="<name>"]` (and `.<name>`); the default theme also applies to bare `html`. If you manage colors yourself and only want the engine, use `@plugin 'svelai/tailwind-plugin';` on its own instead of a default theme (never both).

## Layout setup

Wrap your app once in `<Theme>` and mount a single `<Toaster />`. `<Theme>` sets `data-theme` on `<html>` (light, dark, or system), injects runtime design tokens, and hosts the dialog backdrop and tooltip layer.

```svelte nocheck
<script lang="ts">
	import '../app.css';
	import { Theme } from 'svelai/theme';
	import { Toaster } from 'svelai/toast';

	let { children } = $props();
</script>

<Theme>
	{@render children()}
	<Toaster />
</Theme>
```

## First components

Every component lives on its own subpath; there is no root `svelai` export.

```svelte
<script lang="ts">
	import { Button } from 'svelai/button';
	import { Dialog } from 'svelai/dialog';
	import { toast } from 'svelai/toast';
	import { plusIcon } from 'svelai/icons/plus';

	let open = $state(false);
</script>

<Button color="primary" prefix={plusIcon} onclick={() => toast.success({ title: 'Saved' })}>
	Save
</Button>

<Button variant="outline" onclick={() => (open = true)}>Open dialog</Button>

<Dialog bind:open title="Confirm" description="This cannot be undone." closable>
	<p>Dialog body.</p>
	{#snippet footer()}
		<Button color="danger" onclick={() => (open = false)}>Delete</Button>
	{/snippet}
</Dialog>
```

Shared props across interactive components: `color` (`primary | secondary | neutral | danger | success | warning | info`), `variant` (`solid | outline | soft | ghost | link`), `size` (`small | normal | large`), `class`, `theme`, `ref`. Slot-style props (`prefix`, `suffix`, `title`, `footer`, ...) accept a string or a snippet.

### Prop conventions

The same words mean the same thing on every component, and `node tooling/check-public-api-contract.mjs` enforces it:

- **State comes in threes.** A bindable `value` always ships with `defaultValue` and `onValueChange`; a bindable `open` always ships with `defaultOpen` and `onOpenChange`. `bind:` one, or drive it with the pair. The one-way exceptions (Rating, Meter, ProgressCircle, QRCode display a value they never edit) are marked `@readonly-value` in their props file.
- **Callbacks name the change, not the gesture.** `onValueChange`, `onOpenChange`, `onWidthChange` — never `onChange`, `onClick`, `onToggle`, or a past tense like `onWidthChanged` — and each takes one payload object.
- **`api` is the instance handle.** A component that hands back a state object exposes it as a bindable `api`: `bind:api` on Tabs, Stepper, DataTable, Tree, AIChat, AIConversation.
- **`label` is the one prop that names a component.** It is painted where the component has a visible label (every Field input, Select, Checkbox, Switch, Slider, Rating, Meter, Stat) and spoken where it has none (Button, ToggleButton, SegmentedControl, Pagination, Chart, ScrollArea, AudioPlayer, VideoPlayer, QRCode). There is no `ariaLabel` prop anywhere; where a component hides its visible label — Checkbox `mode="control"` — the string `label` becomes the control's `aria-label` instead.
- **Sizes are `small | normal | large`** (the exported `Sizes` type), everywhere. `xs`/`sm`/`md`/`lg`/`xl` are Tailwind breakpoint and spacing words, not component sizes.
- **Literal unions are kebab-case**: `position="top-right"`, `variant="outline"`, `icon="plus-minus"`. Disclosure controls share one `DisclosureIndicator` union — `'chevron' | 'plus-minus' | 'none'`.

## Theming

### Plugin tokens

Options accepted by each `@plugin 'svelai/tailwind-plugin/theme'` block (the `ThemeOptions` type in `src/lib/tailwind/theme.ts`). These are read at build time and baked into the stylesheet:

| Option                   | Type                                                                                     | Default              | Description                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------- |
| `name`                   | string                                                                                   | —                    | Theme name; scopes variables to `html[data-theme="<name>"]` and `.<name>`     |
| `default`                | boolean                                                                                  | `false`              | Applies to bare `html` and installs the shared engine (exactly one per build) |
| `colorscheme`            | `light` \| `dark`                                                                        | `light`              | Drives mode-aware defaults for the generated palette                          |
| `prefersDark`            | boolean                                                                                  | `false`              | Also emits the palette under `@media (prefers-color-scheme: dark)`            |
| `luminance`              | number                                                                                   | `0`                  | Lightness adjustment applied to every seed color                              |
| `saturation`             | number                                                                                   | `0`                  | Saturation adjustment applied to every seed color                             |
| `state-hover-opacity`    | number                                                                                   | `0.05` / `0.16` dark | `.state-layer` hover opacity                                                  |
| `state-pressed-opacity`  | number                                                                                   | `0.10` / `0.32` dark | `.state-layer` pressed opacity                                                |
| `state-selected-opacity` | number                                                                                   | `0.07` / `0.10` dark | Alpha of the `bg-selected*` tint (persistent selection), not the state layer  |
| `spinner`                | `spinDynamicThin` \| `spinDynamicThick` \| `spinLargeThreeQuarter` \| `spinlargeQuarter` | `spinDynamicThin`    | Which `.ui-spinner` keyframes and style the engine emits                      |

`ThemeOptions` also intersects `EngineOptions` (`src/lib/tailwind/scales.ts`). The engine is installed once, by the block carrying `default: true`, and `applyGlobalEngine` reads these five keys only from that block — they are ignored on every other theme block:

| Option      | Type                                                                       | Default                      | Description                                                                   |
| ----------- | -------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------- |
| `spacing`   | `small` (0.8x) \| `normal` \| `large` (1.2x) \| number                     | unset (Tailwind's `0.25rem`) | Factor on the base spacing unit; writes `--spacing` and the geometry family   |
| `radius`    | `none` \| `subtile` \| `small` \| `normal` \| `large` \| `round` \| number | `normal`                     | Factor on the whole radius ramp; writes `--radius` and `--radius-xs` … `-4xl` |
| `typeScale` | `compact` \| `default` \| `comfortable` \| `large` \| `TypeScaleOptions`   | `default`                    | Fluid type ramp; writes every `--text-*` step as a `clamp()`                  |
| `elevation` | `flat` \| `normal` \| `high`                                               | `normal`                     | Strength of the shadow ramp behind `raised-*` / `lift-*`                      |
| `motion`    | `DeepPartial<{ duration, easing }>`                                        | library scale                | Duration steps and easing roles; writes `--duration-*` and `--ease-*`         |

`motion` is object-valued, so it is only expressible when the plugin is configured from JavaScript; a CSS `@plugin` block carries flat values and can set the other four.

**Build time versus runtime.** These five keys are the same tokens `<Theme designTokens>` compiles at runtime, and both emit the same CSS variables. The plugin writes them on `html`; `<Theme designTokens>` writes them on `html[data-theme="<name>"]`, which is more specific, so **a runtime token always wins for that theme** and every key a theme omits keeps the build-time value. Use the plugin for the app-wide baseline (it applies before hydration, with no flash) and `designTokens` for anything that differs per theme or changes at runtime.

Color seeds. Each role accepts a hex value or a Tailwind color name (`indigo`, `emerald`, uses the 500 shade):

| Key                                                                                | Generates                                                                                                  |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `primary`, `secondary`, `neutral`, `danger`, `success`, `warning`, `info`          | `--color-<role>` plus `-light`, `-lighter`, `-dark`, `-muted`, `-contrast`, `-readable`, `-muted-readable` |
| `<role>-light`, `<role>-lighter`, `<role>-dark`, `<role>-muted`, `<role>-contrast` | Explicit override for one generated variant                                                                |
| `surface`                                                                          | Page background; seeds the elevation ladder                                                                |
| `surface-recessed`, `surface-canvas`, `surface-raised`, `surface-floating`         | Explicit override for one elevation step (derived from `surface` when omitted)                             |

These become ordinary Tailwind color utilities: `bg-primary`, `text-primary-contrast`, `border-neutral-muted`, `text-danger-readable`, `bg-surface-raised`. Inside an element with `data-color="<role>"` the role-relative utilities `bg-color`, `text-color-contrast`, `bg-color-muted` resolve to that role; this is how components implement their `color` prop.

The engine also provides `raised-*` (shadow plus theme-aware border, same values as `shadow-*`), `h-window` / `w-window` (viewport size tracked by `<Theme>`), the `state-layer` component class, and the `dark:`, `checked:`, `highlight:`, `child:` variants.

### Runtime design tokens

The same scales the engine bakes in, plus the state roles and the default component color, are set per theme name through `<Theme designTokens>` and compiled to CSS variables on `html[data-theme="<name>"]`, overriding the build-time values for that theme:

```svelte
<script lang="ts">
	import { Theme, type ThemeDesignTokenMap } from 'svelai/theme';

	let { children } = $props();

	const designTokens = {
		light: { spacing: 'normal', radius: 'normal', typeScale: 'default', raisedWithBorder: true },
		dark: { spacing: 'normal', radius: 'normal', typeScale: 'default', raisedWithBorder: false }
	} satisfies ThemeDesignTokenMap<readonly ['light', 'dark']>;
</script>

<Theme {designTokens}>
	{@render children()}
</Theme>
```

Every key of `ThemeDesignTokens` (`src/lib/components/Theme/theme.designTokens.ts`), with the value the compiler falls back to when the key is omitted. The four state roles emit nothing at all when unset, so each use site keeps following the control's own role:

| Token              | Type                                                                                  | Default                                     | Description                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `spacing`          | `small` (0.8x) \| `normal` \| `large` (1.2x) \| number                                | `normal`                                    | Factor on the 0.25rem base unit, so spaces, control heights, rows and icons scale together; writes `--spacing`           |
| `spacingScale`     | `Partial<Record<'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl', number>>`                       | `{ xs: 1, sm: 1.5, md: 2, lg: 3, xl: 4 }`   | Multiplier per named step, applied to `--spacing`; must stay strictly increasing; writes `--space-xs` … `--space-xl`     |
| `radius`           | `none` \| `subtile` \| `small` \| `normal` \| `large` \| `round` \| number            | `normal`                                    | Factor on the whole radius ramp; writes `--radius` and `--radius-xs` … `--radius-4xl`                                    |
| `typeScale`        | `compact` \| `default` \| `comfortable` \| `large` \| `TypeScaleOptions`              | `default`                                   | Fluid type ramp: base size at the narrow and wide viewport plus the ratio between steps; writes every `--text-*`         |
| `elevation`        | `flat` \| `normal` \| `high`                                                          | `normal`                                    | Strength of the shadow ramp `raised-*` and `lift-*` read; `flat` removes shadows; writes `--elevation-*`                 |
| `motion`           | `DeepPartial<{ duration, easing }>`                                                   | library scale                               | The five duration steps in ms and the four easing roles; writes `--duration-*` and `--ease-*`                            |
| `raisedWithBorder` | boolean                                                                               | `true`                                      | Whether `raised-*` draws its hairline border alongside the shadow; writes `--raised-border`                              |
| `defaultColor`     | `primary` \| `secondary` \| `danger` \| `success` \| `warning` \| `info` \| `neutral` | `neutral`                                   | Semantic role chrome inherits when a control omits `color`; repoints `--color` and its companions                        |
| `focusColor`       | one of the seven roles                                                                | unset — each ring follows `--color`         | State role for the focus ring: every `ring-focus` rings in this role; writes `--color-focus`                             |
| `selectedColor`    | one of the seven roles                                                                | unset — each selection follows `--color`    | State role for a persistent highlight (sidebar row, menu option, selected row); writes the whole `--color-selected*` kit |
| `hoverColor`       | one of the seven roles                                                                | unset — the layer tints with `currentColor` | State role for the transient hover tint `state-layer` paints; writes `--color-hover`                                     |
| `pressedColor`     | one of the seven roles                                                                | unset — falls back to `hoverColor`          | State role for the transient pressed tint; writes `--color-pressed`                                                      |

Switching themes at runtime: the `children` snippet receives the `ThemeState`.

```svelte
<script lang="ts">
	import { Theme } from 'svelai/theme';
	import { Button } from 'svelai/button';

	let { children: page } = $props();
</script>

<Theme transition="radial-top-right">
	{#snippet children(theme)}
		<Button onclick={() => (theme.theme = theme.resolvedTheme === 'dark' ? 'light' : 'dark')}>
			Toggle dark mode
		</Button>
		{@render page()}
	{/snippet}
</Theme>
```

### Component overrides

Every component exposes its class recipe as named slots (Button: `root`, `prefix`, `suffix`). An override object carries an optional `base` string and one string per variant value; classes are merged on top of the defaults, or replace them when `override: true`.

Set it once for a subtree with `set<Component>Theme` (it uses Svelte context, so call it during component initialisation, typically a layout):

```svelte
<script lang="ts">
	import { setButtonTheme } from 'svelai/button';

	let { children } = $props();

	setButtonTheme({
		root: {
			base: 'rounded-full tracking-wide',
			color: { primary: 'shadow-md shadow-primary/30' }
		}
	});
</script>

{@render children()}
```

Or per instance through the `theme` prop:

```svelte
<script lang="ts">
	import { Button } from 'svelai/button';
</script>

<Button theme={{ root: { base: 'uppercase' } }}>Uppercase</Button>
<Button
	theme={{
		override: true,
		root: { base: 'inline-flex h-10 px-4 bg-primary text-primary-contrast' }
	}}
>
	From scratch
</Button>
```

Resolution order: default recipe, then `set<Component>Theme` context, then the `theme` prop, then `class`.

### Motion

Motion is a token scale too: five duration steps (`instant`, `fast`, `normal`, `slow`, `slower`) and four easing roles (`standard`, `enter`, `exit`, `emphasized`), exposed as the `--duration-*` / `--ease-*` variables behind the `duration-normal` and `ease-emphasized` utilities. `<Theme motion>` retunes the scale app-wide and every component transition resolves against it; `<Theme components>` sets per-component defaults — class slots and the reserved `motion` slot alike — without a wrapper component per component. `reduceMotion` (or the OS `prefers-reduced-motion` setting) collapses every duration to 0, after every override.

```svelte
<script lang="ts">
	import { Theme } from 'svelai/theme';

	let { children } = $props();
</script>

<Theme
	motion={{ duration: { normal: 150 }, easing: { standard: 'quintOut' } }}
	components={{
		dialog: { motion: { duration: 'slow', easing: 'emphasized' } },
		button: { root: { base: 'tracking-wide' } }
	}}
>
	{@render children()}
</Theme>
```

## Icons

Icons are Phosphor-style snippets, one file per icon, exported in six weights: `<name>Icon` (regular), `<name>IconBold`, `<name>IconDuotone`, `<name>IconFill`, `<name>IconLight`, `<name>IconThin`. Render them directly or pass them to any slot-style prop.

```svelte
<script lang="ts">
	import { arrowRightIcon, arrowRightIconBold } from 'svelai/icons/arrowRight';
	import { Button } from 'svelai/button';
</script>

<span class="text-primary">{@render arrowRightIcon({ size: 20 })}</span>
<Button suffix={arrowRightIconBold}>Next</Button>
```

Snippet props: `size` (px number or CSS length, default `1lh`), `color` (a role name or any CSS color, default `currentColor`), `mirrored`, `class`.

## Docs and agent skills

- `pnpm dev` runs the documentation site with a page per component under `/components/<name>`.
- `.claude/skills/svelai/` (mirrored in `.agents/skills/svelai/`) holds the coding-agent skill: import conventions, per-component references, theming notes.
- Each component folder ships a `*.mcp.ts` description used by the MCP integration.

## License

MIT
