export const statDescription = `
# Stat Component

Stat renders a compact metric card. A numeric \`value\` is drawn by AnimatedNumber, so each change of value is animated. Every region — label, value (with an optional unit), indicator, separator, trend, description — is a named snippet, and the \`order\` prop decides which of them render and in what sequence. A decorative indicator and an interactive action share the top-right column.

## Basic Usage

\`\`\`svelte
<Stat label="Revenue" value="$45,231" trend="+20.1%" trendDirection="up">
	{#snippet indicator()}
		{@render trendUpIcon()}
	{/snippet}
</Stat>
\`\`\`

## Animated Numbers

A number given to \`value\` is drawn by AnimatedNumber: when it changes, its digits turn to the new value. \`animatedNumber\` takes AnimatedNumber's props except \`value\` and \`ref\` (\`variant\`, \`format\`, \`locale\`, \`prefix\`, \`suffix\`, \`trend\`, \`continuous\`, \`duration\`, \`blur\`, \`animated\`, \`theme\`). \`animated: false\` keeps the format and changes the number at once; \`animatedNumber={false}\` renders no AnimatedNumber and writes the number as plain text in the I18n locale. A string or a snippet is drawn as it is, never animated.

\`\`\`svelte
<script lang="ts">
	let revenue = $state(45231);
	let orders = $state(1284);
</script>

<Stat
	label="Revenue"
	value={revenue}
	animatedNumber={{ format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } }}
/>
<Stat label="Orders" value={orders} animatedNumber={{ variant: 'blur' }} />
<Stat label="Orders" value={orders} animatedNumber={false} />
\`\`\`

## Region Order

\`order\` lists the regions to render. A region left out of the list is not rendered at all, so the separator is opt-in: add \`'separator'\` where the hairline belongs.

\`\`\`svelte
<!-- default: ['label', 'value', 'indicator', 'trend', 'description', 'sparkline'] -->
<Stat label="Tasks" value="147" trend="+12%" trendDirection="up" description="This sprint" />

<!-- description above the hairline, trend last -->
<Stat
	order={['label', 'value', 'description', 'separator', 'trend']}
	label="Tasks"
	value="147"
	description="Across every project"
	trend="8 completed today"
	trendDirection="up"
/>
\`\`\`

\`indicator\` always renders in column 2 whatever its position in \`order\`; the first two listed regions sit beside it, the rest span the full card width.

## Sparkline

\`sparkline\` draws a Sparkline across the card, last by default (\`order\` places it like any region). Give it the values, or an object of Sparkline props with its \`data\`. It takes the card's \`size\` (a band 32, 40 or 48 px tall), the color of the card's text unless given a \`color\`, the string \`label\` as its accessible name, and the \`format\` and \`locale\` of \`animatedNumber\` for its values. Without a \`trendDirection\`, the trend takes the way the sparkline goes.

\`\`\`svelte
<script lang="ts">
	let revenue = $state([1200, 1350, 990, 1640, 1480, 1720]);
</script>

<Stat
	label="Revenue"
	value={revenue[revenue.length - 1]}
	animatedNumber={{ format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } }}
	trend="+16% this month"
	sparkline={{ data: revenue, variant: 'area', color: 'primary', curved: true, tooltip: true }}
/>

<!-- Just the values -->
<Stat label="Visits" value={1284} sparkline={[120, 132, 101, 134, 190, 230, 210]} />

<!-- From one side of the card to the other, down to its bottom edge -->
<Stat label="Visits" value={1284} sparkline={{ data: [120, 132, 101, 134, 190, 230, 210], variant: 'area' }} sparklineBleed />
\`\`\`

\`sparklineBleed\` runs the sparkline past the card's padding, whatever the \`density\`: from one side of the card to the other, and down to its bottom edge when it is the last region (nothing under it in \`order\`, no \`children\`). The card then clips to its rounded corners, so a marker on the first or last value is cut at the edge.

## Unit

\`unit\` renders inline after \`value\`, one type step smaller and baseline-aligned.

\`\`\`svelte
<Stat label="Tasks" value="147" unit="task" />
\`\`\`

## Trend

\`trendIcon\` is a leading, always-neutral slot. \`trend\` is the text, and the component appends its own direction arrow from \`trendDirection\` ('up' → up-right, 'down' → down-right, 'neutral' → none). Only the text and the arrow take the trend colour.

\`\`\`svelte
<Stat label="Throughput" value="147" trend="12 more than last week" trendDirection="up">
	{#snippet trendIcon()}
		{@render lightningIcon()}
	{/snippet}
</Stat>
\`\`\`

## Action

\`action\` renders a ghost icon button in the top-right corner. \`actionLabel\` is the accessible name and is required whenever the action is icon-only. When an indicator is present too, the action sits above it in the same column.

\`\`\`svelte
<Stat
	label="Tasks"
	value="147"
	unit="task"
	indicatorVariant="badge"
	indicatorColor="success"
	indicator="Live"
	actionLabel="More actions for Tasks"
	onAction={() => openMenu()}
>
	{#snippet action()}
		{@render dotsThreeVerticalIcon()}
	{/snippet}
</Stat>
\`\`\`

## Sizes and Density

\`\`\`svelte
<!-- size scales the typography and icons -->
<Stat size="small" label="Small type" value="1,204" />
<Stat size="normal" label="Normal type (default)" value="1,204" />
<Stat size="large" label="Large type" value="1,204" />

<!-- density scales the padding and gaps -->
<Stat density="compact" label="Dense dashboard stat" value="1,204" />
<Stat density="normal" label="Everyday stat (default)" value="1,204" />
<Stat density="comfortable" label="Roomy detail stat" value="1,204" />
\`\`\`

## Props

### Core Props
- **ref**: HTMLElement | null - Bindable reference to the root element.
- **class**: string - Additional classes for the root element.
- **color**: Colors (default: 'neutral') - Semantic color token for the stat surface.
- **variant**: 'solid' | 'outline' | 'soft' | 'ghost' (default: 'solid') - Surface treatment.
- **size**: 'small' | 'normal' | 'large' (default: 'normal') - Scales typography and icons only. Combine with density to control spacing independently.
- **density**: 'compact' | 'normal' | 'comfortable' (default: 'normal') - Controls the surface padding and gaps between regions.
- **order**: readonly StatPart[] (default: ['label', 'value', 'indicator', 'trend', 'description', 'sparkline']) - Regions to render, in order. StatPart is 'label' | 'value' | 'indicator' | 'separator' | 'trend' | 'description' | 'sparkline'.
- **theme**: StatThemeProps - Theme overrides for root and stat parts.

### Content Props
- **label**: Slot - Label content.
- **value**: number | Slot - Primary metric. A number is drawn by AnimatedNumber and each change is animated; a string or a snippet is drawn as it is.
- **animatedNumber**: boolean | StatAnimatedNumber (default: true) - How a numeric \`value\` is drawn. An object passes AnimatedNumber's props except \`value\` and \`ref\`; \`false\` writes the plain number in the I18n locale with no AnimatedNumber.
- **unit**: Slot - Unit rendered inline after the value at a reduced size.
- **indicator**: Slot - Decorative indicator rendered in the top-right column.
- **action**: Slot - Icon button rendered above the indicator in the top-right column.
- **trendIcon**: Slot - Leading trend icon, always neutral ink.
- **trend**: Slot - Trend text; the direction arrow is appended by the component.
- **description**: Slot - Supporting description content.
- **children**: Slot - Additional custom content rendered after the named regions.

### Indicator Props
- **indicatorVariant**: 'default' | 'icon' | 'badge' (default: 'default') - Indicator presentation. The indicator is purely decorative.
- **indicatorColor**: Colors (default: 'neutral') - Semantic color for the indicator.

### Action Props
- **onAction**: (event: MouseEvent) => void - Click handler for the action button.
- **actionLabel**: string - Accessible name for the action button; required when it is icon-only.
- **actionDisabled**: boolean - Disabled state for the action button.

### Trend Props
- **trendDirection**: 'up' | 'down' | 'neutral' - Tone for the trend text and the appended arrow. Defaults to the way the \`sparkline\` goes when there is one, 'neutral' otherwise.

### Sparkline Props
- **sparkline**: readonly number[] | StatSparkline - A Sparkline across the card: the values, or an object of Sparkline props with its \`data\`.
- **sparklineBleed**: boolean (default: false) - Runs the sparkline past the card's padding to both sides of the card, and down to its bottom edge when it is the last region. The band carries \`data-bleed\` ('sides' or 'end').

## Structure

\`\`\`
<Stat>
	<!-- flow column, in the sequence given by order -->
	<label slot />
	<value slot><unit slot /></value>
	<separator />
	<trend slot><trendIcon slot /><text + direction arrow /></trend>
	<description slot />
	<sparkline><Sparkline /></sparkline>
	<!-- column 2, top-aligned -->
	<aside>
		<action slot />
		<indicator slot />
	</aside>
	<children slot />
</Stat>
\`\`\`

## Theme Parts

\`root\` (variant \`bleed\`: clips to the corners), \`region\` (column placement for the flow regions), \`label\`, \`value\`, \`unit\`, \`aside\`, \`action\`, \`indicator\`, \`trend\`, \`trendIcon\`, \`trendText\`, \`description\`, \`separator\`, \`sparkline\` (the band; variants \`bleed\` and \`density\`), \`sparklineChart\` (the Sparkline in it).

## Accessibility

- The root is a non-interactive \`div\`; use surrounding landmarks/headings to provide page structure.
- \`action\` is the only interactive region and renders a native \`button\`; give it \`actionLabel\` when it holds an icon only.
- The indicator is decorative and never focusable.
- The separator is decorative.

## Notes

- \`Stat\` is the only public component; compose through props and named snippets.
- Trend colors use Entasis semantic tokens: success for up, danger for down, muted current color for neutral.
- A numeric value reads as plain text to assistive technology, as AnimatedNumber's does; nothing moves under reduced motion.
- Use string props for compact markup and named snippets when a region needs icon or richer content.
`;
