import {
	cva,
	setComponentTheme,
	type InferComponentTheme,
	useComponentTheme
} from '$lib/utils/cva/index.js';
import type { Density, Sizes } from '$lib/types/theme.js';

type DensityClasses = Record<Density, string>;
type SizeClasses = Record<Sizes, string>;

const densityVariants: DensityClasses = {
	compact: '',
	normal: '',
	comfortable: ''
};

const sizeVariants: SizeClasses = {
	small: '',
	normal: '',
	large: ''
};

const ganttChartVariants = {
	size: sizeVariants,
	density: densityVariants,
	color: {
		primary: '',
		secondary: '',
		danger: '',
		success: '',
		warning: '',
		info: '',
		neutral: ''
	},
	selected: { true: 'ring-2 ring-selected/60', false: '' },
	disabled: { true: 'cursor-not-allowed opacity-50', false: '' },
	invalid: { true: 'cursor-not-allowed', false: '' },
	critical: { true: '', false: '' },
	readOnly: { true: '', false: '' },
	today: { true: '', false: '' },
	nonWorking: { true: '', false: '' },
	overAllocated: { true: '', false: '' }
} as const;

const defaultVariants = {
	size: 'normal',
	density: 'normal',
	color: 'neutral',
	selected: false,
	disabled: false,
	invalid: false,
	critical: false,
	readOnly: false,
	today: false,
	nonWorking: false,
	overAllocated: false
} as const;

function createGanttChartPart(
	base: string,
	variants: Readonly<{ size?: SizeClasses; density?: DensityClasses }> = {}
) {
	return cva({
		base,
		variants: {
			...ganttChartVariants,
			size: variants.size ?? sizeVariants,
			density: variants.density ?? densityVariants
		},
		defaultVariants
	});
}

// The `--gantt-*` properties on the root are INTERNAL geometry the header, rows and bars read
// back. Size, density and the props drive them; they are not a consumer hook.
const root = createGanttChartPart(
	'relative isolate flex min-w-0 flex-col overflow-hidden rounded-lg border border-neutral-muted/60 bg-surface text-neutral [container-type:inline-size] [--gantt-row-height:2rem] [--gantt-header-height:3rem] [--gantt-grid-width:22rem] [--gantt-task-height:1.25rem] [--gantt-task-color:var(--color)] [--gantt-workload-row-height:2rem] [--gantt-indent-size:0.75rem] motion-reduce:scroll-auto motion-reduce:[&_*]:!animate-none motion-reduce:[&_*]:!transition-none forced-colors:border-[CanvasText]',
	{
		density: {
			compact:
				'[--gantt-row-height:1.75rem] [--gantt-header-height:2.5rem] [--gantt-workload-row-height:1.75rem] [--gantt-indent-size:0.625rem]',
			normal: '',
			comfortable:
				'[--gantt-row-height:2.25rem] [--gantt-header-height:3.5rem] [--gantt-workload-row-height:2.5rem] [--gantt-indent-size:0.875rem]'
		},
		size: {
			small: '[--gantt-task-height:1rem]',
			normal: '',
			large: '[--gantt-task-height:1.5rem]'
		}
	}
);
const header = createGanttChartPart(
	'flex min-w-0 shrink-0 flex-wrap items-center border-b border-neutral-muted/60 bg-surface-raised',
	{
		density: {
			compact: 'gap-sm px-md py-sm',
			normal: 'gap-md px-lg py-md',
			comfortable: 'gap-lg px-xl py-lg'
		}
	}
);
const navigation = createGanttChartPart('flex min-w-0 items-center', {
	density: {
		compact: 'gap-xs',
		normal: 'gap-md',
		comfortable: 'gap-lg'
	}
});
const title = createGanttChartPart(
	'min-w-0 flex-1 truncate font-semibold tracking-tight text-neutral',
	{
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		}
	}
);
const zoomControl = createGanttChartPart('flex min-w-0 items-center', {
	density: {
		compact: 'gap-micro',
		normal: 'gap-xs',
		comfortable: 'gap-sm'
	}
});
const actions = createGanttChartPart('ms-auto flex min-w-0 items-center', {
	density: {
		compact: 'gap-xs',
		normal: 'gap-sm',
		comfortable: 'gap-md'
	}
});
const content = createGanttChartPart('relative min-h-0 min-w-0 flex-1');
const splitShell = createGanttChartPart('flex h-full min-h-0 min-w-0');
const gridPane = createGanttChartPart(
	'relative min-h-0 min-w-0 overflow-x-clip overflow-y-visible bg-surface'
);
const splitter = createGanttChartPart(
	'z-40 bg-neutral-muted/80 outline-none before:w-6 focus-visible:ring-2 focus-visible:ring-focus/50'
);
const timelinePane = createGanttChartPart(
	'relative h-full min-h-0 min-w-0 flex-1 overflow-x-clip overflow-y-visible bg-surface'
);
const viewport = createGanttChartPart('relative h-full min-h-0 min-w-0');
const gridHeader = createGanttChartPart(
	'relative flex h-[var(--gantt-header-height)] border-b border-neutral-muted/60 bg-surface-raised/95 backdrop-blur'
);
const columnHeader = createGanttChartPart(
	'flex min-w-0 items-center border-e border-neutral-muted/35 font-semibold text-neutral/70 outline-none last:border-e-0',
	{
		density: { compact: 'px-xs', normal: 'px-sm', comfortable: 'px-md' },
		size: { small: 'text-xs', normal: 'text-xs', large: 'text-xs' }
	}
);
const rows = createGanttChartPart('relative min-w-full');
const row = createGanttChartPart(
	'state-layer absolute inset-x-0 flex h-[var(--gantt-row-height)] outline-none transition-colors data-[gantt-reorder-parent]:bg-selected/6 data-[gantt-reorder-parent]:ring-1 data-[gantt-reorder-parent]:ring-inset data-[gantt-reorder-parent]:ring-selected/25 data-[gantt-touch-reordering]:opacity-45'
);
const rowDropIndicator = createGanttChartPart(
	'pointer-events-none absolute inset-e-0 z-50 h-0.5 -translate-y-1/2 rounded-full bg-color shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-surface)_65%,transparent)]'
);
const treeCell = createGanttChartPart(
	'flex min-w-0 items-center outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus/50',
	{
		density: { compact: 'px-xs', normal: 'px-sm', comfortable: 'px-md' },
		size: { small: 'text-xs', normal: 'text-xs', large: 'text-sm' }
	}
);
const expander = createGanttChartPart(
	'state-layer grid shrink-0 place-items-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-focus/50',
	{
		size: {
			small: 'size-6',
			normal: 'size-6',
			large: 'size-7'
		}
	}
);
const timeHeader = createGanttChartPart(
	'relative h-[var(--gantt-header-height)] border-b border-neutral-muted/60 bg-surface-raised/95 backdrop-blur'
);
const timeHeaderUpper = createGanttChartPart(
	'absolute top-0 flex h-1/2 items-center justify-center truncate border-e border-b border-neutral-muted/35 px-xs font-semibold text-neutral/70',
	{
		size: {
			small: 'text-xs',
			normal: 'text-xs',
			large: 'text-sm'
		}
	}
);
const timeHeaderLower = createGanttChartPart(
	'absolute bottom-0 flex h-1/2 items-center justify-center truncate border-e border-neutral-muted/35 px-xs text-neutral/70',
	{
		size: {
			small: 'text-xs',
			normal: 'text-xs',
			large: 'text-xs'
		}
	}
);
const timelineRows = createGanttChartPart('relative min-w-full overflow-x-clip');
const timelineRow = createGanttChartPart(
	'pointer-events-none absolute inset-x-0 h-[var(--gantt-row-height)]'
);
const gridLine = createGanttChartPart(
	'pointer-events-none absolute top-0 border-e border-neutral-muted/30'
);
const taskLayer = createGanttChartPart('pointer-events-none absolute inset-0 z-10');
const task = createGanttChartPart(
	'group/task pointer-events-auto absolute flex h-[var(--gantt-task-height)] min-w-0 touch-pan-y items-center rounded-sm border border-[color-mix(in_oklab,var(--gantt-task-color)_40%,transparent)] bg-[color-mix(in_oklab,var(--gantt-task-color)_18%,var(--color-surface))] text-neutral lift-1 outline-none data-[continues-before]:rounded-s-none data-[continues-after]:rounded-e-none data-[critical]:border-danger data-[critical]:shadow-[inset_0_-2px_0_color-mix(in_oklab,var(--color-danger)_55%,transparent)] data-[violated]:outline data-[violated]:outline-1 data-[violated]:outline-warning/70 focus-visible:ring-2 focus-visible:ring-focus/50 forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:focus-visible:outline-2'
);
const summaryTask = createGanttChartPart(
	'group/task pointer-events-auto absolute h-full touch-pan-y border-t-2 border-[var(--gantt-task-color)] before:absolute before:start-0 before:top-0 before:h-full before:border-s-2 before:border-[var(--gantt-task-color)] after:absolute after:end-0 after:top-0 after:h-full after:border-e-2 after:border-[var(--gantt-task-color)] outline-none data-[critical]:drop-shadow-[0_0_2px_var(--color-danger)] data-[violated]:outline data-[violated]:outline-1 data-[violated]:outline-warning/70 focus-visible:ring-2 focus-visible:ring-focus/50 forced-colors:border-[CanvasText]'
);
const milestone = createGanttChartPart(
	'group/task pointer-events-auto absolute touch-pan-y rotate-45 border border-[color-mix(in_oklab,var(--gantt-task-color)_55%,transparent)] bg-[var(--gantt-task-color)] outline-none data-[critical]:ring-2 data-[critical]:ring-danger/55 data-[violated]:outline data-[violated]:outline-1 data-[violated]:outline-warning/70 focus-visible:ring-2 focus-visible:ring-focus/50 forced-colors:border-[CanvasText] forced-colors:bg-[CanvasText]',
	{ size: { small: 'size-3.5', normal: 'size-4', large: 'size-5' } }
);
const segment = createGanttChartPart('absolute inset-y-0 rounded-sm bg-inherit');
const progress = createGanttChartPart(
	'pointer-events-none absolute inset-y-0 start-0 rounded-s-sm bg-[color-mix(in_oklab,var(--gantt-task-color)_55%,transparent)]'
);
const progressHandle = createGanttChartPart(
	'pointer-events-auto absolute z-30 grid size-7 -translate-x-1/2 -translate-y-1/2 touch-none cursor-ew-resize place-items-center rounded-full opacity-0 transition-opacity group-hover/gantt-task:opacity-100 group-focus-within/gantt-task:opacity-100 hover:opacity-100'
);
const resizeHandle = createGanttChartPart(
	'pointer-events-auto absolute z-40 grid size-6 -translate-x-1/2 -translate-y-1/2 touch-none cursor-ew-resize place-items-center rounded-sm opacity-0 transition-opacity group-hover/gantt-task:opacity-100 group-focus-within/gantt-task:opacity-100 hover:opacity-100'
);
const dependencyHandle = createGanttChartPart(
	'pointer-events-auto absolute z-30 grid size-6 -translate-x-1/2 -translate-y-1/2 touch-none cursor-crosshair place-items-center rounded-full opacity-0 transition-opacity group-hover/gantt-task:opacity-100 group-focus-within/gantt-task:opacity-100 hover:opacity-100 data-[target]:opacity-100 data-[target]:ring-2 data-[target]:ring-color'
);
const taskLabel = createGanttChartPart(
	'pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap font-medium text-neutral',
	{
		size: {
			small: 'text-xs',
			normal: 'text-xs',
			large: 'text-sm'
		}
	}
);
const resourceAssignments = createGanttChartPart(
	'ms-md inline-flex max-w-64 items-center rounded-sm bg-surface/85 font-normal text-neutral/70 lift-1 data-[over-allocated]:text-danger forced-colors:border forced-colors:border-[CanvasText]',
	{
		density: {
			compact: 'gap-xs px-xs py-micro',
			normal: 'gap-sm px-sm py-micro',
			comfortable: 'gap-md px-md py-xs'
		},
		size: { small: 'text-xs', normal: 'text-xs', large: 'text-xs' }
	}
);
const expectedProgress = createGanttChartPart(
	'pointer-events-none absolute inset-y-0 start-0 border-e border-dashed border-neutral/70 bg-neutral/8'
);
const baseline = createGanttChartPart(
	'pointer-events-none absolute h-1 rounded-full bg-neutral/40'
);
const deadline = createGanttChartPart(
	'pointer-events-none absolute size-3 -translate-x-1/2 rotate-45 border border-danger bg-danger/20'
);
const constraint = createGanttChartPart(
	'pointer-events-none absolute size-3 -translate-x-1/2 rounded-full border border-warning bg-warning/20 data-[violated]:border-danger data-[violated]:bg-danger/25 forced-colors:border-[CanvasText]'
);
const connectorLayer = createGanttChartPart(
	'pointer-events-none absolute inset-0 overflow-visible'
);
const connector = createGanttChartPart(
	'fill-none stroke-neutral/45 stroke-[1.5] forced-colors:stroke-[CanvasText]'
);
const connectorHitTarget = createGanttChartPart(
	'fill-none stroke-transparent stroke-[12] outline-none'
);
const todayIndicator = createGanttChartPart(
	'pointer-events-none absolute top-0 z-20 w-px bg-danger forced-colors:bg-[Highlight]'
);
const projectLine = createGanttChartPart(
	'pointer-events-none absolute top-0 z-10 w-px border-s border-dashed border-neutral/45'
);
const nonWorkingTime = createGanttChartPart(
	'pointer-events-none absolute top-0 bg-surface-recessed/65 forced-colors:bg-[CanvasText] forced-colors:opacity-10'
);
const holiday = createGanttChartPart('pointer-events-none absolute top-0 bg-warning/8');
const dragPreview = createGanttChartPart(
	'pointer-events-none absolute z-40 overflow-hidden rounded-sm border border-dashed border-[var(--gantt-task-color)] bg-[color-mix(in_oklab,var(--gantt-task-color)_12%,var(--color-surface))] lift-3',
	{
		size: {
			small: 'text-xs',
			normal: 'text-xs',
			large: 'text-sm'
		}
	}
);
const rangeSelection = createGanttChartPart(
	'pointer-events-none absolute z-40 rounded-sm border border-dashed border-color bg-color/10'
);
const workloadPanel = createGanttChartPart(
	'relative shrink-0 border-t border-neutral-muted bg-surface',
	{
		size: {
			small: 'text-xs',
			normal: 'text-xs',
			large: 'text-xs'
		}
	}
);
const workloadCell = createGanttChartPart(
	'absolute border-e border-neutral-muted/55 tabular-nums data-[over-allocated]:bg-danger/12 data-[over-allocated]:font-semibold data-[over-allocated]:text-danger forced-colors:border-[CanvasText]',
	{
		size: {
			small: 'text-xs',
			normal: 'text-xs',
			large: 'text-xs'
		}
	}
);
const overAllocation = createGanttChartPart(
	'ms-micro inline-block size-1.5 shrink-0 rounded-full bg-danger text-danger forced-colors:border forced-colors:border-[CanvasText]'
);
const loading = createGanttChartPart(
	'absolute inset-0 z-50 grid place-items-center bg-surface/75 backdrop-blur-[1px]'
);
const empty = createGanttChartPart(
	'absolute inset-0 grid place-items-center text-center text-neutral/70',
	{
		density: { compact: 'p-xl', normal: 'p-layout-md', comfortable: 'p-layout-lg' },
		size: { small: 'text-xs', normal: 'text-sm', large: 'text-base' }
	}
);
const liveRegion = createGanttChartPart('sr-only');

export const ganttChartTheme = {
	root,
	header,
	navigation,
	title,
	zoomControl,
	actions,
	content,
	splitShell,
	gridPane,
	splitter,
	timelinePane,
	viewport,
	gridHeader,
	columnHeader,
	rows,
	row,
	rowDropIndicator,
	treeCell,
	expander,
	timeHeader,
	timeHeaderUpper,
	timeHeaderLower,
	timelineRows,
	timelineRow,
	gridLine,
	taskLayer,
	task,
	summaryTask,
	milestone,
	segment,
	progress,
	progressHandle,
	resizeHandle,
	dependencyHandle,
	taskLabel,
	resourceAssignments,
	expectedProgress,
	baseline,
	deadline,
	constraint,
	connectorLayer,
	connector,
	connectorHitTarget,
	todayIndicator,
	projectLine,
	nonWorkingTime,
	holiday,
	dragPreview,
	rangeSelection,
	workloadPanel,
	workloadCell,
	overAllocation,
	loading,
	empty,
	liveRegion
};

export type GanttChartTheme = typeof ganttChartTheme;
export type GanttChartThemeProps = InferComponentTheme<GanttChartTheme>;
export const setGanttChartTheme = setComponentTheme<GanttChartTheme>('gantt-chart');
export const useGanttChartTheme = useComponentTheme<GanttChartTheme>('gantt-chart', ganttChartTheme);
export type GanttChartClasses = ReturnType<typeof useGanttChartTheme>;
