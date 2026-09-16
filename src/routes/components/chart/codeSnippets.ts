export const usageCode = `<script lang="ts">
  import { Chart } from 'svelai/chart';

  type Revenue = {
    quarter: string;
    product: string;
    value: number;
    low: number;
    high: number;
  };

  const revenue: readonly Revenue[] = [
    { quarter: 'Q1', product: 'Platform', value: 42, low: 37, high: 47 },
    { quarter: 'Q2', product: 'Platform', value: 51, low: 46, high: 56 },
    { quarter: 'Q1', product: 'Services', value: 29, low: 24, high: 34 },
    { quarter: 'Q2', product: 'Services', value: 34, low: 29, high: 39 }
  ];

  const x = { scale: { type: 'point' }, axis: { label: 'Quarter' } } as const;
  const y = { scale: { type: 'linear' }, grid: true } as const;
  const marks = [{
      type: 'series',
      x: 'quarter',
      y: 'value',
      key: 'quarter',
      series: 'product',
      colorBy: 'product',
      annotations: [
        {
          type: 'band',
          target: { key: 'Q2', series: 'Platform' },
          axis: 'x',
          thickness: 24
        }
      ],
      interval: { lower: 'low', upper: 'high' },
      analysis: [
        { type: 'reference', statistic: 'median' },
        { type: 'rolling', statistic: 'mean', window: 2 }
      ],
      points: true
    }] as const;
</script>

<Chart
  data={revenue}
  {x}
  {y}
  {marks}
  tooltip
  viewport
  legend={{ interactive: true, placement: 'bottom' }}
  label="Quarterly revenue line chart"
  aspectRatio={960 / 480}
/>`;

export const layeredCode = `<script lang="ts">
  import { Chart } from 'svelai/chart';

  type Revenue = {
    month: Date;
    actual: number;
    forecast: number;
    forecastLow: number;
    forecastHigh: number;
  };

  const revenue: readonly Revenue[] = [
    { month: new Date('2026-01-01'), actual: 42, forecast: 40, forecastLow: 35, forecastHigh: 45 },
    { month: new Date('2026-02-01'), actual: 48, forecast: 45, forecastLow: 39, forecastHigh: 51 },
    { month: new Date('2026-03-01'), actual: 46, forecast: 52, forecastLow: 45, forecastHigh: 59 }
  ];

  const x = { scale: { type: 'utc' }, axis: { label: 'Month' } } as const;
  const y = {
      scale: { type: 'linear' },
      axis: { label: 'Revenue (€k)' },
      grid: true
    } as const;
  const marks = [
      {
        type: 'series',
        id: 'Forecast',
        x: 'month',
        y: 'forecast',
        stroke: 'secondary',
        interval: {
          lower: 'forecastLow',
          upper: 'forecastHigh',
          fill: 'secondary',
          fillOpacity: 0.18
        }
      },
      {
        type: 'series',
        id: 'Actual',
        x: 'month',
        y: 'actual',
        stroke: 'primary',
        strokeWidth: 2.5,
        // 'surface' is a ChartColor, resolved to var(--color-surface).
        points: { fill: 'surface', stroke: 'primary', strokeWidth: 2, radius: 4 }
      }
    ] as const;
</script>

<Chart
  data={revenue}
  {x}
  {y}
  {marks}
  tooltip
  label="Monthly actual and forecast revenue"
  aspectRatio={960 / 420}
/>`;

export const barsCode = `<script lang="ts">
  import { Chart } from 'svelai/chart';

  type Revenue = {
    quarter: string;
    product: string;
    revenue: number;
  };

  const revenue: readonly Revenue[] = [
    { quarter: 'Q1', product: 'Platform', revenue: 38 },
    { quarter: 'Q1', product: 'Services', revenue: 24 },
    { quarter: 'Q2', product: 'Platform', revenue: 45 },
    { quarter: 'Q2', product: 'Services', revenue: 29 }
  ];

  const position = {
    x: { scale: { type: 'band', padding: 0.18 } },
    y: { scale: { type: 'linear' }, grid: true }
  } as const;

  const groupedMarks = [{
      type: 'bar',
      variant: 'group',
      x: 'quarter',
      y: 'revenue',
      series: 'product',
      colorBy: 'product',
      padding: 0.12
    }] as const;

  const stackedMarks = [{
      type: 'bar',
      variant: 'stack',
      x: 'quarter',
      y: 'revenue',
      series: 'product',
      colorBy: 'product'
    }] as const;
</script>

<div class="grid lg:grid-cols-2">
  <Chart
    data={revenue}
    x={position.x}
    y={position.y}
    marks={groupedMarks}
    tooltip
    label="Revenue grouped by product"
    aspectRatio={520 / 360}
  />
  <Chart
    data={revenue}
    x={position.x}
    y={position.y}
    marks={stackedMarks}
    tooltip
    label="Revenue stacked by product"
    aspectRatio={520 / 360}
  />
</div>`;

export const polarCode = `<script lang="ts">
  import { Chart } from 'svelai/chart';

  type Capability = { name: string; score: number };

  const capabilities: readonly Capability[] = [
    { name: 'Research', score: 82 },
    { name: 'Design', score: 74 },
    { name: 'Delivery', score: 91 },
    { name: 'Quality', score: 78 },
    { name: 'Operations', score: 68 }
  ];

  const marks = [{
      type: 'polar',
      variant: 'radar',
      angle: 'name',
      radius: 'score',
      domain: [0, 100],
      area: true,
      line: true,
      points: true,
      color: 'secondary'
    }] as const;
</script>

<Chart
  data={capabilities}
  {marks}
  label="Product capability profile"
  aspectRatio={640 / 480}
/>`;

export const clientOnlyCode = `<script lang="ts">
  import { Chart } from 'svelai/chart';

  type ResponseTime = { minute: number; milliseconds: number };

  const responseTimes: readonly ResponseTime[] = [
    { minute: 0, milliseconds: 182 },
    { minute: 5, milliseconds: 169 },
    { minute: 10, milliseconds: 214 }
  ];

  const x = { scale: { type: 'linear' }, axis: { label: 'Minute' } } as const;
  const y = {
      scale: { type: 'linear' },
      axis: { label: 'Response time (ms)' },
      grid: true
    } as const;
  const marks = [{
      type: 'series',
      x: 'minute',
      y: 'milliseconds',
      curve: 'monotone-x',
      stroke: 'info'
    }] as const;
</script>

<!-- No height and no aspectRatio: the SVG mounts only in the browser. -->
<Chart
  data={responseTimes}
  {x}
  {y}
  {marks}
  tooltip
  label="API response time"
/>`;

export const wideStackCode = `<script lang="ts">
  import { Chart, type ChartKey, type ChartProps } from 'svelai/chart';

  type StatusRow = { month: string; completed: number; inProgress: number; pending: number };

  // One row per month, one numeric column per status: no melting by hand.
  const monthlyStatus: readonly StatusRow[] = [
    { month: 'Jan', completed: 38, inProgress: 18, pending: 9 },
    { month: 'Feb', completed: 42, inProgress: 21, pending: 7 }
  ];

  const marks: ChartProps<StatusRow>['marks'] = [{
      type: 'bar',
      variant: 'stack',
      x: 'month',
      y: ['completed', 'inProgress', 'pending'],
      gap: 3,
      radius: 3
    }];

  const palette: ChartProps<StatusRow>['palette'] = {
    completed: 'secondary',
    inProgress: 'primary',
    pending: 'info'
  };

  const labels: Record<string, string> = {
    completed: 'Completed',
    inProgress: 'In progress',
    pending: 'Pending'
  };

  let pinned = $state<ChartKey | null>('Mar');
</script>

<Chart
  data={monthlyStatus}
  {marks}
  {palette}
  legend={{ placement: 'top', align: 'right', interactive: true, format: (key) => labels[String(key)] }}
  tooltip={{ groupBy: 'x', value: pinned, onValueChange: (value) => (pinned = value) }}
  x={{ scale: { type: 'band', padding: 0.5 } }}
  y={{ scale: { type: 'linear' }, grid: true }}
  label="Task status over the last six months"
  height={320}
/>`;
