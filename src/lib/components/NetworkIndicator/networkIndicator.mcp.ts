export const networkIndicatorDescription = `
# NetworkIndicator Component

NetworkIndicator is a fixed top loading bar for SvelteKit navigation and explicit async work. Mount one instance near the root layout. It shows automatically during SvelteKit route transitions, can be driven by a controlled \`loading\` prop, and exposes imperative helpers for request lifecycles.

## Import

\`\`\`svelte
<script lang="ts">
	import { NetworkIndicator } from 'svelai/network-indicator';
</script>
\`\`\`

## Basic Usage

\`\`\`svelte
<!-- +layout.svelte -->
<script lang="ts">
	import { NetworkIndicator } from 'svelai/network-indicator';
</script>

<NetworkIndicator />

{@render children()}
\`\`\`

## Props

- **loading**: boolean = false
  - Controlled visibility. Use this when the owner already has request state or when rendering examples/previews.
- **variant**: 'bar' | 'trail' | 'trail-bounce' = 'bar'
  - \`bar\` progressively grows one indicator. \`trail\` renders one randomly sized moving segment at a time. \`trail-bounce\` sends that random trail fully off one edge, then returns from the opposite edge.
- **trailGap**: number = 0
  - Pause between trail passes in milliseconds. Only applies to \`variant="trail"\`.
- **color**: 'primary' | 'secondary' | 'neutral' | 'danger' | 'success' | 'warning' | 'info' = 'neutral'
  - Applies the semantic color token to the bar.
- **height**: number = 3
  - Height in pixels. Keep most navigation indicators between 2 and 6.
- Animation duration and easing come from the \`motion\` theme slot — \`theme={{ motion: { duration: 450, easing: 'expoOut' } }}\` — not from props; see Motion below.
- **label**: string = 'Loading'
  - Accessible label for the indeterminate \`role="progressbar"\`.
- **ref**: HTMLDivElement | null
  - Bindable root element reference while the indicator is visible.
- **class**: string
  - Additional classes for the root bar.
- **theme**: NetworkIndicatorThemeProps
  - Theme override for the root bar.

## Helper API

\`\`\`ts
import {
	hideNetworkIndicator,
	showNetworkIndicator,
	toggleNetworkIndicator
} from 'svelai/network-indicator';
\`\`\`

Prefer \`showNetworkIndicator()\` and \`hideNetworkIndicator()\` for async work. \`toggleNetworkIndicator()\` is available for simple demos or manual toggles, but it is easier to desynchronize in request lifecycles.

## Patterns

### Controlled Loading

\`\`\`svelte
<script lang="ts">
	import { NetworkIndicator } from 'svelai/network-indicator';

	let loading = $state(false);
</script>

<NetworkIndicator {loading} color="primary" label="Saving changes" />
\`\`\`

### Async Request

\`\`\`svelte
<script lang="ts">
	import { Button } from 'svelai/button';
	import {
		hideNetworkIndicator,
		showNetworkIndicator
	} from 'svelai/network-indicator';

	async function save() {
		showNetworkIndicator();
		try {
			await fetch('/api/save', { method: 'POST' });
		} finally {
			hideNetworkIndicator();
		}
	}
</script>

<Button onclick={save}>Save</Button>
\`\`\`

### Color Variations

\`\`\`svelte
<NetworkIndicator loading color="primary" />
<NetworkIndicator loading color="success" />
<NetworkIndicator loading color="warning" />
<NetworkIndicator loading color="danger" />
\`\`\`

### Trail Variant

\`\`\`svelte
<NetworkIndicator loading variant="trail" color="primary" theme={{ motion: { duration: 650 } }} trailGap={0} />
<NetworkIndicator loading variant="trail" color="success" height={5} theme={{ motion: { duration: 450 } }} trailGap={120} />
<NetworkIndicator loading variant="trail-bounce" color="info" theme={{ motion: { duration: 700 } }} trailGap={80} />
\`\`\`

### Height Variations

\`\`\`svelte
<NetworkIndicator loading height={2} />
<NetworkIndicator loading height={4} color="primary" />
<NetworkIndicator loading height={6} color="info" />
\`\`\`

### Motion Variations

\`\`\`svelte
<NetworkIndicator loading theme={{ motion: { duration: 300, easing: 'cubicInOut' } }} />
<NetworkIndicator loading theme={{ motion: { duration: 450, easing: 'expoOut' } }} />
<NetworkIndicator loading theme={{ motion: { duration: 500, easing: 'backOut' } }} />
\`\`\`

### Theme Override

\`\`\`svelte
<NetworkIndicator
	loading
	color="success"
	height={5}
	theme={{
		root: {
			base: 'ui-network-indicator fixed top-0 left-0 w-full z-[9999] origin-left rounded-none lift-4'
		}
	}}
/>
\`\`\`

## Theme

The theme has two parts:

- **root**: the fixed top bar.
  - \`base\`: positioning, origin, radius, z-index, and shared bar classes.
  - \`variant\`: \`bar\`, \`trail\`, or \`trail-bounce\` container styling.
  - \`color\`: semantic color variants.
- **segment**: trail segment styling.
  - \`base\`: segment positioning, radius, opacity, shadow, and transform hints.
  - \`color\`: semantic color variants for each trail segment.

The default root base includes \`ui-network-indicator\`; keep that class if overriding the base because \`toggleNetworkIndicator()\` uses it to read current state.

## Accessibility

The visible bar renders \`role="progressbar"\` without a value because progress is indeterminate. Use a specific \`label\` when the loading context matters, such as "Uploading files" or "Saving changes". If screen readers need richer lifecycle announcements, pair the indicator with app-level live region text.

## Motion

- **motion** theme slot, keyed by \`variant\`: one growth step of the \`bar\` loop (\`slow\`), or
  one pass of the \`trail\` / \`trail-bounce\` variants (the \`slower\` token, 500ms). Only \`duration\` / \`easing\` are read.
- Ladder: \`<Theme components={{ networkIndicator: { motion } }}>\` →
  \`setNetworkIndicatorTheme({ motion })\` → \`theme={{ motion: { duration, easing } }}\`.
- A resolved duration of 0 (reduced motion) holds the indicator still instead of looping.
`;
