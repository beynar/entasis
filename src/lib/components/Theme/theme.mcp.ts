export const themeDescription = `
# Theme

\`Theme\` owns global theme selection, runtime design tokens, shared overlay state, and theme
transitions. Wrap the application once and use the \`ThemeState\` received by the children snippet.

## Runtime design tokens

\`\`\`svelte
<script lang="ts">
	import { Theme, type ThemeDesignTokenMap } from 'entasis/theme';

	let spacing = $state<'small' | 'normal' | 'large'>('normal');
	const designTokens = $derived({
		light: {
			spacing,
			spacingScale: { xs: 1, sm: 1.5, md: 2, lg: 3, xl: 4 },
			radius: 'normal',
			typeScale: 'default',
			raisedWithBorder: true,
			defaultColor: 'neutral'
		},
		dark: {
			spacing,
			spacingScale: { xs: 1, sm: 1.5, md: 2, lg: 3, xl: 4 },
			radius: 'small',
			typeScale: 'compact',
			raisedWithBorder: false,
			defaultColor: 'neutral'
		}
	} satisfies ThemeDesignTokenMap<readonly ['light', 'dark']>);
</script>

<Theme {designTokens} transition="radial-top-right">
	{#snippet children(theme)}
		<button onclick={() => (spacing = spacing === 'small' ? 'large' : 'small')}>
			Change density
		</button>
		<button onclick={() => (theme.theme = theme.resolvedTheme === 'dark' ? 'light' : 'dark')}>
			Toggle color scheme
		</button>
	{/snippet}
</Theme>
\`\`\`

\`designTokens\` is keyed by logical theme name and respects the \`attribute\` and \`value\` props.
Eleven presets ship as \`themePresets\` (\`dense\`, \`compact\`, \`balanced\`, \`comfortable\`, \`spacious\`,
\`sharp\`, \`rounded\`, \`display\`, \`editorial\`, \`glass\`, \`terminal\`): \`designTokens={{ light: themePresets.glass.tokens, dark: themePresets.glass.tokens }}\`.
Changing the controlled object updates already-rendered Tailwind utilities without rebuilding CSS.

### ThemeDesignTokens

- \`spacing\`: \`'small' | 'normal' | 'large' | number\`. Globally scales density.
- \`spacingScale\`: partial overrides for the strictly increasing \`xs\`, \`sm\`, \`md\`, \`lg\`,
  and \`xl\` spacing multipliers. Defaults to 1/1.5/2/3/4.
- \`radius\`: \`'none' | 'subtile' | 'small' | 'normal' | 'large' | 'round' | number\`.
- \`typeScale\`: \`'compact' | 'default' | 'comfortable' | 'large' | TypeScaleOptions\`.
- \`raisedWithBorder\`: toggles the border used by \`raised-*\` utilities.
- \`defaultColor\`: \`Colors\` role kit chrome inherits when a control omits \`color\`.
  Defaults to \`neutral\`. Set \`primary\` to restore an accent-colored kit. Compiles the
  current-color family (\`--color\`, \`--color-readable\`, muted/contrast/light/dark variants)
  and \`--default-color\` onto the theme selector. Do not set \`data-color\` on \`html\`.
- \`focusColor\`, \`selectedColor\`, \`hoverColor\`, \`pressedColor\`: the four \`Colors\` **state
  roles**. They pin, for the whole theme, what a focus ring, a persistent selection and the
  transient hover/pressed layer look like, independently of the role of the control the state
  lands on. They compile \`--color-focus\`, \`--color-selected\` (plus its \`-contrast\`,
  \`-readable\` and \`-muted-readable\` companions), \`--color-hover\` and
  \`--color-pressed\` onto the theme selector. There is no \`--color-selected-muted\`: the soft
  fill is a translucent tint of \`--color-selected\` at \`--state-selected-opacity\`, so it reads
  on any surface. None is declared at \`:root\`: every use site
  falls back to the matching current role (\`ring-focus\` is
  \`var(--color-focus, var(--color))\`, \`bg-selected-muted\` tints
  \`var(--color-selected, var(--color))\`, the state layer is
  \`var(--color-hover, currentColor)\` and on \`:active\`
  \`var(--color-pressed, var(--color-hover, currentColor))\`), so leaving them unset changes
  nothing and \`data-color\` keeps moving the states with \`--color\`. Theme-level only: there is
  no per-component override. An unknown role throws.

Component-level density remains a local variant. It selects utility classes whose values inherit
the active global spacing token.

Generated interfaces should use the public \`xs | sm | md | lg | xl\` vocabulary through component
props and named gap/padding utilities. \`micro\` and \`layout-*\` are internal recipe tokens. Prefer
parent-owned gaps over child margins; do not emit arbitrary spacing or unsupported radius values.

## Theme selection

The selection props wrap \`svelte-themes\`: \`themes\`, \`defaultTheme\`, \`forcedTheme\`,
\`systemTheme\`, \`syncColorScheme\`, \`transitionOnChange\`, \`storageKey\`, \`attribute\`,
\`value\`, and \`colorScheme\`. The default themes are light and dark, with system selection
enabled. \`systemTheme\`, \`syncColorScheme\`, and \`transitionOnChange\` all default to
\`true\`; they map onto the library's \`enableSystem\`, \`enableColorScheme\`, and
\`disableTransitionOnChange\` options.

\`ThemeState\` exposes \`theme\`, \`resolvedTheme\`, \`themes\`, and \`systemTheme\`. Assign
\`theme.theme\` to switch themes. The optional \`transition\` prop applies a named view transition;
unsupported browsers and reduced-motion users switch instantly.

\`spinnerVariant\` sets the global default spinner animation. The children snippet is required.

## Motion tokens

Motion is a token scale like spacing and radius: five duration steps and four easing roles.
\`motion\` retunes them app-wide; an omitted token keeps its default.

| Duration   | Default |     | Easing role  | Default       |
| ---------- | ------- | --- | ------------ | ------------- |
| \`instant\`  | 0ms     |     | \`standard\`   | \`cubicInOut\`  |
| \`fast\`     | 100ms   |     | \`enter\`      | \`cubicOut\`    |
| \`normal\`   | 200ms   |     | \`exit\`       | \`cubicIn\`     |
| \`slow\`     | 300ms   |     | \`emphasized\` | \`backOut\`     |
| \`slower\`   | 500ms   |     |              |               |

\`\`\`svelte
<script lang="ts">
	import { Theme } from 'entasis/theme';

	let { children } = $props();
</script>

<Theme motion={{ duration: { normal: 150, slow: 260 }, easing: { standard: 'quintOut' } }}>
	{@render children()}
</Theme>
\`\`\`

The Tailwind plugin emits the same scale as CSS variables on \`html\` (\`--duration-normal\`,
\`--ease-standard\`, ...) plus the matching \`duration-*\` / \`ease-*\` utilities, so CSS transitions
and Svelte transitions read one set of numbers. The \`motion\` prop rewrites those variables on
\`html\` at runtime and \`designTokens.motion\` rewrites them again per theme, layered over the prop;
\`ThemeState.motion\` resolves through the same two rungs, so the utilities and the presets never
disagree. \`ThemeState.transition\` is a deprecated alias for its \`normal\` duration and \`standard\`
easing. Reduced motion resolves every duration to 0 and collapses the \`--duration-*\` variables via
the \`data-entasis-reduce-motion\` attribute on \`html\`.

Components keep their own transition in a reserved \`motion\` slot on their theme, so the \`theme\`
prop covers motion as well as classes:

\`\`\`svelte
<script lang="ts">
	import { Dialog } from 'entasis/dialog';
</script>

<Dialog theme={{ motion: { duration: 'fast', easing: 'emphasized' } }} title="Quick">Body</Dialog>
\`\`\`

## Component theme registry

\`components\` sets app-wide component theme defaults without a wrapper component per component:
it is keyed by theme name (\`dialog\`, \`button\`, ...) and each entry takes the same slots as that
component's \`theme\` prop, the \`motion\` slot included. A \`set<Component>Theme\` call in a subtree
beats the registry, and an instance \`theme\` prop beats both — per slot: each rung layers on the one
below it, so a subtree that restyles one slot keeps the registry's others.

\`\`\`svelte
<script lang="ts">
	import { Theme } from 'entasis/theme';

	let { children } = $props();
</script>

<Theme
	components={{
		dialog: { motion: { duration: 'fast' }, content: { base: 'rounded-2xl' } },
		button: { root: { base: 'tracking-wide' } }
	}}
>
	{@render children()}
</Theme>
\`\`\`

## Reduced motion

\`reduceMotion\` forces reduced motion on (\`true\`) or off (\`false\`) for every entasis animation,
overriding the OS \`prefers-reduced-motion\` setting; omit it to follow the OS. The live result is
exposed as \`ThemeState.preferReducesMotion\` (reactive, so it updates when the OS setting changes)
and mirrored as a \`data-entasis-reduce-motion\` attribute on \`html\` for CSS-only animations.

\`\`\`svelte
<script>
	import { Theme } from 'entasis/theme';

	let { children } = $props();
</script>

<Theme reduceMotion>{@render children()}</Theme>
\`\`\`

## Build-time boundary

The Tailwind plugin still generates color palettes and registers utility names, variants,
keyframes, and spinner CSS. Spacing, radius, typography scale, raised borders,
\`defaultColor\` and the four state roles (\`focusColor\`, \`selectedColor\`, \`hoverColor\`,
\`pressedColor\`) belong to \`Theme.designTokens\`; colors remain CSS variables and can be
overridden directly. \`ThemeState.defaultColor\` exposes the active role. Kit chrome should
resolve omitted \`color\` props with \`useDefaultColor\`.
`;
