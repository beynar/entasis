export const meterDescription = `
# Meter Component

The Meter component visualizes a measurement or progress along a known scale, with support for stacked segments, labels, and animations.

## Basic Usage

\`\`\`svelte
<Meter value={75} label="Progress" />
\`\`\`

## Props

### Core Props
- **value**: number | MeterStep<T> | Array<MeterStep<T>> (required) - A plain number, one segment, or a stacked set of segments
  - A number renders a single segment coloured by \`color\`; its legend label defaults to the number itself
  - Each segment object: { value: number, label?: string, color?: Colors, icon?: Snippet, position?: 'top' | 'bottom', data?: T }
- **color**: Colors (default: 'primary') - Color used for a numeric value and as the fallback for segments with no color of their own

- **min**: number (default: 0) - Minimum value of the scale; a segment fills (value - min) / (max - min) of the track
- **max**: number (default: 100) - Maximum value of the scale; values are clamped into [min, max], so a bar never passes the track
- **size**: 'small' | 'normal' | 'large' - Visual size of the meter

### Display Props
- **showIndicatorAs**: 'value' | 'percentage' - How to display the indicator label
- **format**: Intl.NumberFormatOptions - Formats the clamped value in value mode (for example { style: 'unit', unit: 'megabyte' }); the percentage text is always the share of the scale
- **getAriaValueText**: (payload: { value, formattedValue, min, max }) => string - Overrides aria-valuetext, which otherwise mirrors the indicator text
- **locale**: Intl.LocalesArgument - Locale of the value and percentage text (default: the I18n locale, so French reads "50 %")

### Content Slots
- **label**: string | Snippet - Label rendered in the header; it names the meter (or the group of stacked meters)
- **description**: string | Snippet - Description text; describes the meter
- **helper**: string | Snippet - Helper text shown beside the label; describes the meter
- **header**: Snippet - Custom header
- **indicator**: string | Snippet - Custom indicator content (no payload); combine with \`showIndicatorAs\` for the built-in value/percentage text

### Animation Props
- **stiffness**: number - Spring animation stiffness
- **damping**: number - Spring animation damping
- **soft**: number - Softness of animation
- **precision**: number - Precision of animated values

### Styling Props
- **class**: string - Additional CSS classes
- **theme**: ComponentTheme - Custom theme overrides

## Structure

\`\`\`
<Meter>
	<Header>
		<Label />
		<Description />
	</Header>
	<Track>
		<Progress />
		<Indicator />
	</Track>
	<Helper />
</Meter>
\`\`\`

## Examples

### Simple Progress Bar
\`\`\`svelte
<Meter value={65} />
\`\`\`

### Basic Meter
\`\`\`svelte
<Meter value={60} label="Completion" />
\`\`\`

### With Label and Description
\`\`\`svelte
<Meter 
	value={75}
>
	{#snippet label()}
		<span>Progress</span>
	{/snippet}
	{#snippet description()}
		<span>75% complete</span>
	{/snippet}
</Meter>
\`\`\`

### Different Colors
\`\`\`svelte
<Meter value={30} color="danger" label="Low" />
<Meter value={60} color="warning" label="Medium" />
<Meter value={90} color="success" label="High" />
\`\`\`

### Multiple Values (Stacked)
\`\`\`svelte
<Meter 
	value={[
		{ value: 40, color: 'primary', label: 'Used' },
		{ value: 30, color: 'secondary', label: 'Reserved' }
	]}
	max={100}
/>
\`\`\`

### Formatted Value
\`\`\`svelte
<Meter
	value={1536}
	max={4096}
	showIndicatorAs="value"
	format={{ style: 'unit', unit: 'megabyte', unitDisplay: 'short' }}
	getAriaValueText={({ formattedValue, max }) => \`\${formattedValue} of \${max} megabytes used\`}
	label="Memory"
/>
\`\`\`

### Show as Percentage
\`\`\`svelte
<Meter 
	value={45}
	showIndicatorAs="percentage"
/>
\`\`\`

### Different Sizes
\`\`\`svelte
<Meter size="small" value={50} />
<Meter size="normal" value={50} />
<Meter size="large" value={50} />
\`\`\`

### Custom Range
\`\`\`svelte
<Meter 
	min={0}
	max={1000}
	value={350}
	label="Score"
/>
\`\`\`

### Storage Usage Example
\`\`\`svelte
<script>
	let storage = {
		used: 45,
		cached: 20,
		available: 35
	};
</script>

<Meter 
	value={[
		{ value: storage.used, color: 'primary', label: 'Used' },
		{ value: storage.cached, color: 'info', label: 'Cached' }
	]}
	max={100}
>
	{#snippet header()}
		<div class="flex justify-between">
			<span>Storage</span>
			<span>{storage.used + storage.cached}GB / 100GB</span>
		</div>
	{/snippet}
	{#snippet helper()}
		{storage.available}GB available
	{/snippet}
</Meter>
\`\`\`

### Task Progress
\`\`\`svelte
<script>
	let tasks = {
		completed: 12,
		total: 20
	};
	let progress = (tasks.completed / tasks.total) * 100;
</script>

<Meter 
	value={progress}
	color="success"
>
	{#snippet label()}
		Task Progress
	{/snippet}
	{#snippet description()}
		{tasks.completed} of {tasks.total} tasks completed
	{/snippet}
</Meter>
\`\`\`

### With Custom Indicator
\`\`\`svelte
<!-- indicator is a payload-less slot; use showIndicatorAs for the built-in value/percentage text -->
<Meter value={75}>
	{#snippet indicator()}
		<div class="custom-indicator">75 / 100</div>
	{/snippet}
</Meter>
\`\`\`

### Skill Level Meter
\`\`\`svelte
<Meter value={85} color="success" label="JavaScript Proficiency" />
\`\`\`

## Accessibility

- A single value makes the root \`role="meter"\` with \`aria-valuemin\` (\`min\`), \`aria-valuemax\` (\`max\`), \`aria-valuenow\` (the value clamped to the scale) and \`aria-valuetext\` (the indicator text computed from the clamped value over the scale, e.g. "65%" or "50 %" in French, or the formatted raw value with \`showIndicatorAs="value"\`; \`getAriaValueText\` overrides it)
- The meter is named by the rendered \`label\` (\`aria-labelledby\`). With a custom \`header\`, a string \`label\` names it through \`aria-label\`; without any label it falls back to a single segment's own \`label\`, then to the i18n \`meter\` text
- \`helper\` and \`description\` describe the root (the meter, or the group of stacked meters) through \`aria-describedby\`
- Several segments make the root a \`role="group"\` named by \`label\`, containing one \`role="meter"\` per segment named by the segment's \`label\` (or "Segment 1 of 3", i18n \`meterSegment\`)
- Each meter contains a visually hidden presentational text node, and the rendered label element is \`role="presentation"\`, so NVDA reads its name

## Notes

- Values are animated with spring physics for smooth transitions
- Multiple values stack horizontally
- Indicator position can be top or bottom
- Progress bar fills from left to right
- The root \`color\` prop colors the whole meter; a segment's own \`color\` overrides it

## Theme Customization

The Meter component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **root**: Main meter container styles
- **header**: Header section styles
- **container**: Progress container styles
- **label**: Label text styles
- **helper**: Helper text styles
- **description**: Description text styles
- **progress**: Progress bar element styles
- **track**: Track/background styles
- **indicator**: Value indicator styles
- **legend**: Legend container styles
- **legendItem**: Legend item styles
- **legendIcon**: Legend icon styles
- **legendLabel**: Legend label text styles
- **legendPercentage**: Legend percentage text styles

### Available Variants

**root**:
- base: Base classes for main container
- Variants:
  - size: 'small' | 'normal' | 'large' - Container gap size

**header**:
- base: Base classes for header section
- Variants:
  - size: 'small' | 'normal' | 'large' - Gap between elements

**container**:
- base: Base classes for progress container
- Variants:
  - first: boolean - First segment styling (rounded left)
  - last: boolean - Last segment styling (rounded right)

**label**:
- base: Base classes for label text
- Variants:
  - size: 'small' | 'normal' | 'large' - Text size

**helper**:
- base: Base classes for helper text
- Variants:
  - size: 'small' | 'normal' | 'large' - Text size

**description**:
- base: Base classes for description text
- Variants:
  - size: 'small' | 'normal' | 'large' - Text size

**progress**:
- base: Base classes for progress bar
- Variants:
  - size: 'small' | 'normal' | 'large' - Bar height

**track**:
- base: Base classes for track/background
- Variants:
  - size: 'small' | 'normal' | 'large' - Track height
  - labelsPosition: 'top' | 'bottom' | 'both' - Margin based on label position

**indicator**:
- base: Base classes for value indicator
- Variants:
  - size: 'small' | 'normal' | 'large' - Text size
  - position: 'top' | 'bottom' - Indicator position

**legend**:
- base: Base classes for legend container
- Variants:
  - size: 'small' | 'normal' | 'large' - Legend size

**legendItem**:
- base: Base classes for legend items
- Variants:
  - size: 'small' | 'normal' | 'large' - Gap between elements

**legendIcon**:
- base: Base classes for legend icons
- Variants:
  - size: 'small' | 'normal' | 'large' - Icon size

**legendLabel**:
- base: Base classes for legend labels
- Variants:
  - size: 'small' | 'normal' | 'large' - Text size

**legendPercentage**:
- base: Base classes for legend percentages
- Variants:
  - size: 'small' | 'normal' | 'large' - Text size

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<Meter 
  value={75}
  theme={{
    root: {
      base: 'flex flex-col',
      size: {
        normal: 'gap-2'
      }
    },
    track: {
      base: 'rounded-full bg-gray-200',
      size: {
        normal: 'h-2'
      }
    }
  }}
/>
\`\`\`

**Custom Progress Bar**:
\`\`\`svelte
<Meter 
  value={60}
  theme={{
    progress: {
      base: 'bg-gradient-to-r from-primary to-secondary',
      size: {
        large: 'h-4'
      }
    },
    track: {
      base: 'bg-gray-100 rounded-full',
      size: {
        large: 'h-4'
      }
    },
    indicator: {
      base: 'text-sm font-semibold',
      position: {
        top: 'bottom-full mb-2'
      }
    }
  }}
/>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setMeterTheme } from 'entasis/meter';
  
  setMeterTheme({
    root: {
      base: 'flex flex-col',
      size: {
        normal: 'gap-2'
      }
    },
    track: {
      base: 'rounded-full bg-gray-200',
      size: {
        normal: 'h-2'
      }
    },
    progress: {
      base: 'bg-primary rounded-full'
    }
  });
</script>
\`\`\`
`;
