export const themeDescription = `
# Theme

\`Theme\` owns global theme selection, runtime design tokens, shared overlay state, and theme
transitions. Wrap the application once and use the \`ThemeState\` received by the children snippet.
Components below it read the same state with \`useTheme()\` from \`entasis/theme\`, called during
component initialisation; it throws when no \`Theme\` is above. For a palette computed at runtime,
see \`generateColorPalette\` in \`entasis/color-palette\`.

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
  Controls take the full multiplier; surface steps (\`lg\` and up) stop at \`large\` (1.5×).
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

## Content Security Policy

\`nonce\` is stamped on every \`<script>\` and \`<style>\` the Theme and the components below it
inject: the theme and viewport boot scripts, the design-token stylesheet, the \`transitionOnChange={false}\`
style, and the CDN loaders of PhoneInput, Map and Mermaid (the document print frame and Mermaid's own
svg \`<style>\` too). Drag-and-drop base styles are rules in the Tailwind plugin CSS, so nothing is
injected for them. Generate one nonce per request in \`hooks.server.ts\`, send it through \`locals\` to
\`<Theme nonce>\`, and send the Content-Security-Policy header yourself with that same nonce.
SvelteKit's \`kit.csp\` cannot be used for this: it generates its own nonce per request, exposes it
only as \`%sveltekit.nonce%\` in \`app.html\`, and has no option to take yours, so the header would
carry one nonce while the Theme's tags carry another. Leave \`kit.csp\` unset and put the nonce on
SvelteKit's own inline tags in \`transformPageChunk\`:

\`\`\`ts
// doc-fence: skip (needs nonce declared on the app's App.Locals)
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const nonce = crypto.randomUUID();
	event.locals.nonce = nonce;
	const response = await resolve(event, {
		// Adds the nonce to SvelteKit's inline <script> and <style> tags; tags that already carry one
		// (the Theme's) are left alone.
		transformPageChunk: ({ html }) =>
			html.replace(/<(script|style)(?=[\\s>])(?![^>]*\\snonce=)/g, \`<$1 nonce="\${nonce}"\`)
	});
	response.headers.set(
		'content-security-policy',
		\`script-src 'self' 'nonce-\${nonce}'; style-src 'self' 'nonce-\${nonce}'; style-src-attr 'unsafe-inline'\`
	);
	return response;
};
\`\`\`

\`\`\`ts
// doc-fence: skip (needs nonce declared on the app's App.Locals)
// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => ({ nonce: locals.nonce });
\`\`\`

\`\`\`svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import { Theme } from 'entasis/theme';

	let { data, children } = $props();
</script>

<Theme nonce={data.nonce}>
	{@render children()}
</Theme>
\`\`\`

Server-rendered \`style\` attributes (\`style:\` directives) are not covered by a nonce: allow them with
\`style-src-attr 'unsafe-inline'\` (as above). \`ThemeState.nonce\` exposes the value to your own injected code.

## Shadow DOM and portal containers

Dialogs, popovers, menus, tooltips and the floating-window layer mount in \`document.body\`. Inside a
shadow root they mount in that root so adopted styles keep applying. \`portalContainer\` overrides both:
an element or shadow root, or a function returning one for a container that is not rendered yet.
A function that reads \`$state\` (as below) moves the floating-window layer in as soon as the container
appears; a function over a plain variable is read each time a panel mounts, so the layer, which mounts
with the Theme, needs the container to exist by then.
Outside presses and Escape are heard on the document a panel lives in, so a panel rendered into an
iframe's document dismisses correctly.

\`\`\`svelte
<script lang="ts">
	import { Theme } from 'entasis/theme';

	let { children } = $props();
	let host = $state<HTMLElement>();
</script>

<div bind:this={host}></div>
<Theme portalContainer={() => host}>
	{@render children()}
</Theme>
\`\`\`

When several Themes are mounted, the most recently mounted one that sets \`portalContainer\` wins.

## Scroll lock and viewport variables

A dialog or popover locks page scroll with a \`data-entasis-scroll-lock\` attribute on \`<html>\` and one
rule in the Tailwind plugin CSS (\`overflow: hidden\`); nothing is written to inline styles, so a lock a
third-party library holds on the same element is neither overwritten nor released early. While
locked, the hidden scrollbar's room is kept with \`scrollbar-gutter: stable\` (padding where that is
unsupported) unless the page already reserves a gutter, so there is no double gutter. Two variables
describe the viewport for your own layout:

- \`--entasis-scrollbar-width\`: set on \`<html>\` while locked, the width in px of the scrollbar the
  lock hides (\`0px\` with overlay scrollbars). Add it to \`position: fixed\` bars:
  \`padding-inline-end: var(--entasis-scrollbar-width, 0px)\`.
- \`--keyboard-inset\`: the height in px the on-screen keyboard covers at the bottom of the layout
  viewport, measured from the visual viewport (\`0px\` without a keyboard, while pinch-zoomed, and in
  browsers that resize the layout viewport for the keyboard). Pin a bottom bar above the keyboard with
  \`bottom: var(--keyboard-inset)\`.

## Build-time boundary

The Tailwind plugin still generates color palettes and registers utility names, variants,
keyframes, and spinner CSS. Spacing, radius, typography scale, raised borders,
\`defaultColor\` and the four state roles (\`focusColor\`, \`selectedColor\`, \`hoverColor\`,
\`pressedColor\`) belong to \`Theme.designTokens\`; colors remain CSS variables and can be
overridden directly. \`ThemeState.defaultColor\` exposes the active role. Kit chrome should
resolve omitted \`color\` props with \`useDefaultColor\`.
`;
