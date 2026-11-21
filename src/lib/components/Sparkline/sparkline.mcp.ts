export const sparklineDescription = `
# Sparkline Component

Import from \`entasis/sparkline\`. A small chart with no axes, read at a glance beside a figure: in a Stat, a table row, a list item. It draws a series of numbers as a \`line\`, a line over a shaded \`area\`, a \`bar\` for each value, or a \`dot\` for each value.

Use it to show the shape of a series (rising, falling, steady, a spike) where the exact values matter less. For axes, several series, a legend or zoom, use Chart.

## Basic Usage

\`\`\`svelte
<script>
	import { Sparkline } from 'entasis/sparkline';
</script>

<Sparkline data={[3, 5, 2, 8, 4, 7, 1, 6]} label="Signups this week" />
\`\`\`

It is drawn in the color of the text round it. \`color\` gives it a semantic color instead.

## Size

\`size\` sets the box (small 64 × 24, normal 96 × 32, large 128 × 48 px) and the weight of the line (1.5, 2 and 2.5 px). Width and height classes on the root stretch the box to any size: the series stretches with it, and the line and the dots keep their weight.

\`\`\`svelte
<script>
	import { Sparkline } from 'entasis/sparkline';

	const visits = [120, 132, 101, 134, 190, 230, 210];
</script>

<Sparkline data={visits} size="small" />
<Sparkline data={visits} size="large" />
<!-- As wide as its container -->
<Sparkline data={visits} variant="area" class="h-12 w-full" />
\`\`\`

## Variants

\`\`\`svelte
<script>
	import { Sparkline } from 'entasis/sparkline';

	const data = [4, 6, 3, 9, 5, 8, 2, 7];
</script>

<Sparkline {data} variant="line" curved />
<Sparkline {data} variant="area" color="primary" />
<Sparkline {data} variant="bar" barGap={0.3} />
<Sparkline {data} variant="dot" />
\`\`\`

Bars stand on zero: a negative value hangs under it. Lines, areas and dots run from the lowest value to the highest. \`min\` and \`max\` fix either end of the scale, so several sparklines can be compared.

## Markers, trend and tooltip

\`\`\`svelte
<script>
	import { Sparkline } from 'entasis/sparkline';

	const revenue = [1200, 1350, 990, 1640, 1480, 1720];
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
</script>

<Sparkline
	data={revenue}
	labels={months}
	markers={['min', 'max', 'last']}
	showTrend
	tooltip
	format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
/>

<!-- A tooltip in a color of its own, with content of its own -->
<Sparkline data={revenue} labels={months} color="primary" tooltip="neutral">
	{#snippet tooltipContent(point)}
		{point.label}: {point.text}
	{/snippet}
</Sparkline>
\`\`\`

- \`markers\` puts a dot on the lowest value (\`min\`, danger color), the highest (\`max\`, success color), the \`first\` and the \`last\`. The lowest and the highest are drawn over a first or last marker on the same point.
- \`showTrend\` puts an arrow on the last value, on the side the line does not come from (over a value the line rises to, under one it falls to) unless that side lacks room, and over a last bar; it takes no room of its own: up-right in the success color, down-right in the danger color, right when the series is steady. The trend goes from the first value to the last and ignores a change under a twentieth of the range. Up is always drawn in the success color: leave the arrow out for a figure where lower is better, such as a latency. \`sparklineTrend(data)\` returns the same \`'up' | 'down' | 'neutral'\`, the vocabulary of Stat's \`trendDirection\`.
- \`tooltip\` shows the value under the pointer, after its label from \`labels\`, with a hairline and a dot on it (bars: the others step back). It is filled with the color of the series, and written in its contrast color; \`tooltip="neutral"\` (any semantic color) fills it with that color instead. \`tooltipContent\` draws its content from \`{ value, index, label, text }\`.

## Animation

The series appears with \`animation\` and moves to new values of the same length; \`duration\` and \`easing\` set both, in the Theme's motion vocabulary. A springing or bouncing easing is traced exactly in CSS with \`linear()\`.

\`\`\`svelte
<script>
	import { Sparkline } from 'entasis/sparkline';

	const data = [4, 6, 3, 9, 5, 8, 2, 7];
</script>

<Sparkline {data} variant="bar" animation="grow" duration={800} easing="backOut" />
<Sparkline {data} animation="fade" duration="fast" />
<Sparkline {data} easing="elasticOut" />
<Sparkline {data} animated={false} />
\`\`\`

## Props

- **data** (required): readonly number[]. The values, in order.
- **labels**: readonly string[]. A label for each value, shown in the tooltip.
- **variant**: 'line' | 'area' | 'bar' | 'dot' (default: 'line').
- **size**: 'small' | 'normal' | 'large' (default: 'normal'). The box and the weight of the line.
- **color**: Colors. Semantic color of the series. Defaults to the color of the text round it.
- **curved**: boolean (default: false). Draws the line as a curve that never overshoots a value.
- **strokeWidth**: number. Width of the line in pixels. Defaults to 1.5, 2 or 2.5 with the size.
- **min**, **max**: number. Either end of the scale. Default to the lowest and highest value; bars always reach zero.
- **markers**: readonly ('min' | 'max' | 'first' | 'last')[].
- **showTrend**: boolean (default: false). An arrow for the way the series goes.
- **tooltip**: boolean | Colors (default: false). The value under the pointer. \`true\` fills the tooltip with the color of the series; a semantic color fills it with that color.
- **tooltipContent**: Snippet<[SparklinePoint]>. The tooltip's content, instead of the label and the value.
- **format**: Intl.NumberFormatOptions. For the values in the tooltip and in the accessible name.
- **locale**: Intl.LocalesArgument. Defaults to the I18n locale.
- **barGap**: number (default: 0.2). The share of each bar's slot left empty, from 0 to 0.9.
- **animated**: boolean (default: true). Animates the series when it appears and moves it to new values of the same length; \`false\` turns both off.
- **animation**: 'draw' | 'grow' | 'fade' | 'none' (default: 'draw'). How the series appears: revealed from the left, raised from the bottom (bars from zero), faded in, or at once.
- **duration**: MotionDurationToken | number. A Theme duration token (\`instant\`, \`fast\`, \`normal\`, \`moderate\`, \`slow\`, \`slower\`) or milliseconds, for both the appearance and the move. Defaults to \`slower\` to appear and \`slow\` to move.
- **easing**: MotionEasingToken | Easing (default: 'enter'). A Theme easing role (\`standard\`, \`enter\`, \`exit\`, \`emphasized\`) or an easing name (\`linear\`, \`cubicOut\`, \`backOut\`, \`elasticOut\`, \`bounceOut\`…), for both.
- **label**: string. What the series shows; starts the accessible name.
- **ref**: HTMLElement | null. Bindable reference to the root.
- **class**: string. Classes for the root: size it with width and height classes.
- **theme**: SparklineThemeProps.

Other HTML attributes are passed to the root \`span\`.

## Structure

\`\`\`
<span data-slot="sparkline" role="img">
	<span data-slot="sparkline-plot">
		<svg data-slot="sparkline-svg" aria-hidden="true">
			sparkline-area · sparkline-line · sparkline-bar · sparkline-dot
			sparkline-marker (data-marker) · sparkline-cursor · sparkline-cursor-dot
		</svg>
		<span data-slot="sparkline-tooltip" data-color><span data-slot="sparkline-tooltip-text" /></span>
	</span>
	<span data-slot="sparkline-trend" />
</span>
\`\`\`

The root carries \`data-variant\`, \`data-size\`, \`data-color\` and, with \`showTrend\`, \`data-trend\`. A bar that steps back under the pointer carries \`data-dimmed\`.

## Theme Parts

\`root\`, \`plot\`, \`svg\`, \`area\`, \`line\`, \`bar\`, \`dot\`, \`marker\` (variant \`marker\`), \`cursor\`, \`cursorDot\`, \`tooltip\` (variant \`color\`), \`tooltipText\` (variant \`color\`), \`tooltipLabel\`, \`trend\` (variant \`trend\`).

## Accessibility

- The sparkline is one image. Its accessible name is \`label\` followed by a summary of the values from the I18n catalog: how many, the first, the last, the lowest, the highest and the trend ("8 values from 3 to 6, lowest 1, highest 8, trending up"). An empty series is named "No data".
- The tooltip follows a pointer only and is hidden from assistive technology: the summary carries what it shows at a glance. When each value matters, give them in a table as well.
- Nothing moves under reduced motion (the Theme's \`reduceMotion\`, or the system's setting).

## Notes

- The series is drawn in a box of 100 × 100 that the SVG stretches; strokes and dots are drawn in pixels (\`vector-effect: non-scaling-stroke\`), so the root can take any width and height.
- The series is drawn inside the root, inset by half its stroke (or its dot): a line at either end of the scale is never cut. The area's fill, and bars standing on the bottom (or hanging from the top) of the box, still reach the root's edges. Markers and the dot under the pointer may reach a few pixels past the root; turning them on never changes the size of the series.
- A change of \`data\` with the same number of values moves each value to its new place; a change of length is drawn at once.

## Credits

Adapted from react-tiny-sparkline by Franz Benthin (MIT).
`;
