export const statDescription = `
# Stat Component

Stat renders a compact metric card with semantic regions for label, value, indicator, trend, separator, and description. It is adapted from the Dice UI stat card pattern but uses Svelai tokens, theme overrides, props, named snippets, and size semantics.

## Basic Usage

\`\`\`svelte
<Stat label="Revenue" value="$45,231" trend="+20.1%" trendDirection="up">
	{#snippet indicator()}
		{@render trendUpIcon()}
	{/snippet}
</Stat>
\`\`\`

## Snippet Usage

\`\`\`svelte
<Stat
	size="large"
	label="Total users"
	value="24,892"
	indicatorVariant="icon"
	indicatorColor="info"
	trendDirection="up"
	description="Compared with the previous period"
	showSeparator
>
	{#snippet indicator()}
		{@render usersIcon()}
	{/snippet}
	{#snippet trend()}
		+12.4%
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
<Stat density="small" label="Dense dashboard stat" value="1,204" />
<Stat density="normal" label="Everyday stat (default)" value="1,204" />
<Stat density="large" label="Roomy detail stat" value="1,204" />
\`\`\`

## Props

### Core Props
- **ref**: HTMLElement | null - Bindable reference to the root element.
- **class**: string - Additional classes for the root element.
- **color**: Colors (default: 'neutral') - Semantic color token for the stat surface.
- **variant**: 'solid' | 'outline' | 'soft' | 'ghost' (default: 'solid') - Surface treatment.
- **size**: 'small' | 'normal' | 'large' (default: 'normal') - Scales typography and icons only (label, value, trend, description, indicator). Combine with density to control spacing independently.
- **density**: 'small' | 'normal' | 'large' (default: 'normal') - Controls the surface padding and gaps between regions (small: p-3 / gap-x-3, normal: p-4 / gap-x-4, large: p-5 / gap-x-5).
- **theme**: StatThemeProps - Theme overrides for root and stat parts.

### Content Props
- **label**: Slot - Label content.
- **value**: Slot - Primary metric content.
- **indicator**: Slot - Indicator content rendered in the top-right region.
- **trend**: Slot - Trend content.
- **description**: Slot - Supporting description content.
- **children**: Slot - Additional custom content rendered after the named regions.
- **showSeparator**: boolean (default: false) - Renders a decorative separator before trend/description content.

### Indicator Props
- **indicatorVariant**: 'default' | 'icon' | 'badge' | 'action' (default: 'default') - Indicator presentation.
- **indicatorColor**: Colors (default: 'neutral') - Semantic color for the indicator.
- **onclick**: (event: MouseEvent) => void - Native click handler that renders the indicator as a button.
- **indicatorLabel**: string - Accessible label for icon-only clickable indicators.
- **indicatorType**: HTMLButtonAttributes['type'] (default: 'button') - Button type used for clickable indicators.
- **indicatorDisabled**: boolean - Disabled state used for clickable indicators.

### Trend Props
- **trendDirection**: 'up' | 'down' | 'neutral' (default: 'neutral') - Tone for the trend region.

## Structure

\`\`\`
<Stat>
	<label slot />
	<value slot />
	<indicator slot />
	<separator />
	<trend slot />
	<description slot />
	<children slot />
</Stat>
\`\`\`

## Accessibility

- The root is a non-interactive \`div\`; use surrounding landmarks/headings to provide page structure.
- The indicator renders as a native \`button\` only when \`onclick\` is supplied.
- Icon-only clickable indicators should provide \`indicatorLabel\`.
- The separator is decorative.

## Notes

- \`Stat\` is the only public component; compose through props and named snippets.
- Trend colors use Svelai semantic tokens: success for up, danger for down, muted current color for neutral.
- Use string props for compact markup and named snippets when a region needs icon or richer content.
`;
