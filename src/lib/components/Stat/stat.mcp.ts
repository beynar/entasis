export const statDescription = `
# Stat Component

Stat renders a compact metric card. Every region — label, value (with an optional unit), indicator, separator, trend, description — is a named snippet, and the \`order\` prop decides which of them render and in what sequence. A decorative indicator and an interactive action share the top-right column.

## Basic Usage

\`\`\`svelte
<Stat label="Revenue" value="$45,231" trend="+20.1%" trendDirection="up">
	{#snippet indicator()}
		{@render trendUpIcon()}
	{/snippet}
</Stat>
\`\`\`

## Region Order

\`order\` lists the regions to render. A region left out of the list is not rendered at all, so the separator is opt-in: add \`'separator'\` where the hairline belongs.

\`\`\`svelte
<!-- default: ['label', 'value', 'indicator', 'trend', 'description'] -->
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
- **order**: readonly StatPart[] (default: ['label', 'value', 'indicator', 'trend', 'description']) - Regions to render, in order. StatPart is 'label' | 'value' | 'indicator' | 'separator' | 'trend' | 'description'.
- **theme**: StatThemeProps - Theme overrides for root and stat parts.

### Content Props
- **label**: Slot - Label content.
- **value**: Slot - Primary metric content.
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
- **trendDirection**: 'up' | 'down' | 'neutral' (default: 'neutral') - Tone for the trend text and the appended arrow.

## Structure

\`\`\`
<Stat>
	<!-- flow column, in the sequence given by order -->
	<label slot />
	<value slot><unit slot /></value>
	<separator />
	<trend slot><trendIcon slot /><text + direction arrow /></trend>
	<description slot />
	<!-- column 2, top-aligned -->
	<aside>
		<action slot />
		<indicator slot />
	</aside>
	<children slot />
</Stat>
\`\`\`

## Theme Parts

\`root\`, \`region\` (column placement for the flow regions), \`label\`, \`value\`, \`unit\`, \`aside\`, \`action\`, \`indicator\`, \`trend\`, \`trendIcon\`, \`trendText\`, \`description\`, \`separator\`.

## Accessibility

- The root is a non-interactive \`div\`; use surrounding landmarks/headings to provide page structure.
- \`action\` is the only interactive region and renders a native \`button\`; give it \`actionLabel\` when it holds an icon only.
- The indicator is decorative and never focusable.
- The separator is decorative.

## Notes

- \`Stat\` is the only public component; compose through props and named snippets.
- Trend colors use Svelai semantic tokens: success for up, danger for down, muted current color for neutral.
- Use string props for compact markup and named snippets when a region needs icon or richer content.
`;
