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

Peer dependencies: `svelte ^5`, `@sveltejs/kit ^2`, `tailwindcss ^4` (via `@tailwindcss/vite`). There is no `tailwind.config.js`; all configuration lives in your CSS.

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

Options accepted by each `@plugin 'svelai/tailwind-plugin/theme'` block:

| Option                  | Type              | Description                                                                   |
| ----------------------- | ----------------- | ----------------------------------------------------------------------------- |
| `name`                  | string            | Theme name; scopes variables to `html[data-theme="<name>"]` and `.<name>`     |
| `default`               | boolean           | Applies to bare `html` and installs the shared engine (exactly one per build) |
| `colorscheme`           | `light` \| `dark` | Drives mode-aware defaults for the generated palette                          |
| `prefersDark`           | boolean           | Also emits the palette under `@media (prefers-color-scheme: dark)`            |
| `luminance`             | number            | Lightness adjustment applied to every seed color                              |
| `saturation`            | number            | Saturation adjustment applied to every seed color                             |
| `state-hover-opacity`   | number            | `.state-layer` hover opacity (default 0.05 light / 0.16 dark)                 |
| `state-pressed-opacity` | number            | `.state-layer` pressed opacity (default 0.10 light / 0.32 dark)               |
| `spinner`               | object            | Custom `.ui-spinner` keyframes and style                                      |

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

Spacing, radius, type scale, raised borders, and the default component color are not plugin options. They are set per theme name through `<Theme designTokens>` and compiled to CSS variables on `html[data-theme="<name>"]`:

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

| Token              | Values                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `spacing`          | `small` (0.8x) \| `normal` \| `large` (1.2x) \| number multiplier                            |
| `spacingScale`     | Partial `{ xs, sm, md, lg, xl }` multipliers behind `gap-md`, `p-lg`, ...                    |
| `radius`           | `none` \| `subtile` \| `small` \| `normal` \| `large` \| `round` \| number                   |
| `typeScale`        | `compact` \| `default` \| `comfortable` \| `large` \| `{ baseMinPx, baseMaxPx, scale, ... }` |
| `raisedWithBorder` | boolean; adds a 1px border to `raised-*` surfaces                                            |
| `defaultColor`     | Role used by components that omit `color` (default `neutral`)                                |

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
