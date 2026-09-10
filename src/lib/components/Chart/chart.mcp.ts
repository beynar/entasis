export const chartDescription = `
# Chart Component

Chart renders layered cartesian, polar, relation, or faceted marks from one typed data array. Consumers import only from \`svelai/chart\`; TanStack Charts and D3 remain private implementation dependencies.

## Basic usage

\`\`\`svelte
<script lang="ts">
  import { Chart } from 'svelai/chart'

  type Row = { month: Date; actual: number; forecast: number; low: number; high: number }
  const x = { scale: { type: 'utc' }, axis: { label: 'Month' } } as const
  const y = { scale: { type: 'linear' }, grid: true } as const
  const marks = [
      {
        type: 'series',
        x: 'month',
        y: 'forecast',
        interval: { lower: 'low', upper: 'high', fill: 'secondary' },
        analysis: [
          { type: 'reference', statistic: 'median' },
          { type: 'rolling', statistic: 'mean', window: 3 }
        ]
      },
      { type: 'series', x: 'month', y: 'actual', stroke: 'primary', points: true }
    ] as const
</script>

<Chart
  data={rows}
  {x}
  {y}
  {marks}
  tooltip
  viewport
  ariaLabel="Monthly revenue"
  initialDimensions={{ width: 800, height: 400 }}
/>
\`\`\`

## Contract

- \`data\` is one immutable array shared by every mark.
- \`marks\` is a required non-empty discriminated union; array order is paint order.
- A \`series\` mark renders a line by default. Set \`area\`, \`points\`, or \`line\` with booleans or local option objects to compose its visible layers.
- A series \`interval\` adds a non-interactive band behind the same line. Its required \`lower\` and \`upper\` numeric channels represent explicit bounds such as confidence, prediction, credible, or min/max intervals. \`interval\` and \`area\` are mutually exclusive because both own the filled surface.
- \`analysis\` is a non-empty list of derived statistical layers owned by a series, scatter, bar, or distribution mark. Reference analysis supports mean, median, quantile, and standard deviation. Series and scatter support linear regression with optional confidence or prediction intervals. Series also supports rolling mean and rolling median. Analysis can use the complete plot or each series independently and does not add tooltip points. Stacked layouts reject analysis because their displayed values differ from the source channels.
- A \`scatter\` mark renders independent observations with the default \`points\` variant. A numeric \`size\` is a constant pixel radius. A \`size\` data channel uses \`sqrt\` by default; \`sizeScale\` accepts \`linear\`, \`sqrt\`, \`log\`, \`exp\`, or an object with \`type\`, \`domain\`, \`range\`, and an optional \`base\` for logarithmic or exponential scales. The \`hexbin\` variant accepts numeric \`x\` and \`y\` channels and aggregates dense observations into responsive pixel-space hexagons; \`radius\` controls the bin size.
- A \`bar\` mark is simple by default. Its optional \`variant\` is \`group\` or \`stack\`. Use \`offset: 'normalize'\` on a stacked bar to compare proportions with a 0–1 value axis.
- A \`matrix\` mark uses the default \`grid\` variant with categorical \`x\` and \`y\` channels. Use \`colorBy\` for a categorical matrix, or use a numeric \`value\` with \`color\` for a heatmap. The \`calendar\` variant replaces \`x\` and \`y\` with a \`date\` channel and derives week and weekday axes automatically. Its optional \`colorScale\` accepts a \`quantize\` domain and an ordered color range.
- A data mark can own \`arrow\`, \`label\`, \`rule\`, \`band\`, and \`marker\` annotations. Targets resolve against the parent mark's final rendered coordinates. A band annotation uses \`thickness\` for its cross-axis size.
- Position scales use local string discriminants such as \`linear\`, \`utc\`, and \`band\`.
- \`tooltip: true\` groups cartesian marks on the categorical or x axis, renders native color rows, and stays inside the chart surface without adding chart focus states.
- \`legend: true\` shows native categorical color keys or numeric heatmap/hexbin scales. Use \`legend: { interactive: true }\` to hide and show series, bars, scatter points, and empirical distributions whose series and color identities match. Other layouts use static legends; facets keep their own labels. Visibility preserves axes, colors, and stack totals. The object accepts \`placement: 'top' | 'bottom'\`, \`label\`, controlled \`value\` and \`onValueChange\`, or an initial \`defaultValue\`; omitted visibility shows every series.
- Legend layout accepts \`align: 'left' | 'center' | 'right'\` and \`orientation: 'horizontal' | 'vertical'\`. Vertical stacks categorical entries in one column; numeric color ramps stay horizontal. Both static and interactive legends support alignment and top/bottom placement.
- Histogram and rolling preparation use native transforms. Regression uses native Student-t confidence bounds; prediction intervals add observation uncertainty to the fitted-mean bounds. Small samples therefore have wider intervals than a fixed normal approximation.
- Tooltip objects can override grouping with \`groupBy: 'x'\`, \`groupBy: 'y'\`, or \`groupBy: false\`.
- \`viewport: true\` enables native x-axis brush zoom with pointer and touch input, an accessible reset control, and a reduced-motion-aware transition. Numeric and date axes select continuous windows; categorical axes snap to values and also expose keyboard handles. The object form accepts \`reset\` and \`transition\` options. Native 2D brushing is not supported.
- A \`distribution\` mark reads one categorical \`group\` channel and one numeric \`value\` channel. Its summary variants are \`violin\`, \`box\`, and \`error-bar\`. Its raw-sample variants are \`histogram\`, \`density\`, and \`ecdf\`. Histogram accepts \`bins\`; density accepts \`bandwidth\` and \`samples\`; \`direction\` can be \`vertical\` or \`horizontal\`.
- Distribution tooltips use a built-in statistical summary. They do not accept custom \`tooltip.fields\`.
- A \`proportion\` mark reads one categorical \`category\` channel and one non-negative numeric \`value\` channel. Its \`variant\` is \`pie\`, \`donut\`, or \`waffle\`; consumers do not calculate angles or cells.
- A \`polar\` mark reads \`angle\` and \`radius\` channels. The \`circular\` and \`radar\` variants compose boolean \`area\`, \`line\`, and \`points\` layers. The \`radial-bar\` and \`rose\` variants render wedges and expose only bar options.
- A \`relation\` mark owns a complete topology layout. Its \`tree\` variant reads \`nodeId\` and \`parent\`; its \`network\` and \`sankey\` variants read \`nodeId\` and an outgoing \`relations\` channel. Relation marks cannot use axes, sibling marks, facets, or custom tooltip fields.
- A \`facet\` mark owns nested \`marks\` with the same public union and inherits the plot positions.
- Proportion tooltips show the category value and its share. They do not accept custom \`tooltip.fields\` or grouped axes.
- \`ariaLabel\` is required and \`ariaDescription\` is optional.
- With \`initialDimensions\`, Chart emits deterministic SVG during SSR and preserves that aspect ratio responsively.
- Without \`initialDimensions\`, SSR emits a stable empty host and the SVG mounts only in the browser.
- Replace \`data\`, \`marks\`, or another configuration prop to update a mounted chart. In-place mutation is not an update contract.
- Configuration errors throw a prefixed \`TypeError\`; dependency and accessor errors propagate.
`;
