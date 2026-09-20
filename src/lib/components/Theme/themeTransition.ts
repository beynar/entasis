export const themeTransitions = [
	'radial-top-left',
	'radial-top-right',
	'radial-bottom-left',
	'radial-bottom-right',
	'line-top',
	'line-right',
	'line-bottom',
	'line-left',
	'shutter-top',
	'shutter-right',
	'shutter-bottom',
	'shutter-left',
	'random-grid',
	'column-grid-left',
	'column-grid-right'
] as const;

export type ThemeTransition = (typeof themeTransitions)[number];

type RadialThemeTransition = Extract<ThemeTransition, `radial-${string}`>;
type LineThemeTransition = Extract<ThemeTransition, `line-${string}`>;
type ShutterThemeTransition = Extract<ThemeTransition, `shutter-${string}`>;
type BandThemeTransition = LineThemeTransition | ShutterThemeTransition;
type ColumnGridThemeTransition = Extract<ThemeTransition, `column-grid-${string}`>;

type Viewport = {
	width: number;
	height: number;
};

type MaskBox = {
	x: number;
	y: number;
	width: number;
	height: number;
};

type MaskCell = {
	hidden: MaskBox;
	visible: MaskBox;
};

type ShutterCell = MaskCell & {
	partial: MaskBox;
};

type GridMask = {
	cells: MaskCell[];
	columns: number;
	rows: number;
};

type ThemeTransitionAnimation = {
	duration: number;
	easing: string;
	keyframes: Keyframe[];
};

const radialOrigins: Record<RadialThemeTransition, string> = {
	'radial-top-left': '0% 0%',
	'radial-top-right': '100% 0%',
	'radial-bottom-left': '0% 100%',
	'radial-bottom-right': '100% 100%'
};

const GRID_TARGET_CELL_SIZE = 160;
const GRID_MIN_COLUMNS = 6;
const GRID_MAX_COLUMNS = 12;
const GRID_MAX_ROWS = 12;
const GRID_RANDOM_PHASES = 14;
const COLUMN_PHASES = 3;
const BAND_COUNT = 12;
const SHUTTER_PHASES_PER_BAND = 3;
const SHUTTER_START_INTERVAL = 1;
const SHUTTER_PHASE_DURATION = 50;

let activeTransitionId = 0;

export function updateThemeWithTransition(
	transition: ThemeTransition | undefined,
	update: () => void | Promise<void>
) {
	if (!canAnimateThemeChange(transition)) {
		void update();
		return;
	}

	const root = document.documentElement;
	const transitionId = ++activeTransitionId;
	const animation = createThemeTransitionAnimation(transition);
	root.dataset.entasisThemeTransition = transition;

	let viewTransition: ViewTransition;
	try {
		viewTransition = document.startViewTransition(update);
	} catch {
		root.removeAttribute('data-entasis-theme-transition');
		void update();
		return;
	}
	let revealAnimation: Animation | undefined;
	const playAnimation = () => {
		if (transitionId !== activeTransitionId) return;

		const effect = new KeyframeEffect(root, animation.keyframes, {
			duration: animation.duration,
			easing: animation.easing,
			fill: 'both',
			pseudoElement: '::view-transition-new(root)'
		});
		revealAnimation = new Animation(effect, document.timeline);
		revealAnimation.play();
	};
	const skipAnimation = () => {
		if (transitionId === activeTransitionId) {
			root.removeAttribute('data-entasis-theme-transition');
		}
	};

	void viewTransition.ready.then(playAnimation, skipAnimation);
	void viewTransition.finished.finally(() => {
		revealAnimation?.cancel();
		if (transitionId === activeTransitionId) {
			root.removeAttribute('data-entasis-theme-transition');
		}
	});
}

function canAnimateThemeChange(
	transition: ThemeTransition | undefined
): transition is ThemeTransition {
	return Boolean(
		transition &&
		typeof document !== 'undefined' &&
		document.visibilityState === 'visible' &&
		typeof document.startViewTransition === 'function'
	);
}

function createThemeTransitionAnimation(transition: ThemeTransition): ThemeTransitionAnimation {
	switch (transition) {
		case 'radial-top-left':
		case 'radial-top-right':
		case 'radial-bottom-left':
		case 'radial-bottom-right':
			return createRadialAnimation(transition);
		case 'line-top':
		case 'line-right':
		case 'line-bottom':
		case 'line-left':
			return createLineAnimation(transition);
		case 'shutter-top':
		case 'shutter-right':
		case 'shutter-bottom':
		case 'shutter-left':
			return createShutterAnimation(transition);
		case 'random-grid':
			return createRandomGridAnimation();
		case 'column-grid-left':
		case 'column-grid-right':
			return createColumnGridAnimation(transition);
	}
}

function createRadialAnimation(transition: RadialThemeTransition): ThemeTransitionAnimation {
	const origin = radialOrigins[transition];
	return {
		duration: 400,
		easing: 'ease-in-out',
		keyframes: [
			{ clipPath: `circle(0 at ${origin})`, opacity: 0.7 },
			{ clipPath: `circle(150% at ${origin})`, opacity: 1 }
		]
	};
}

function createLineAnimation(transition: LineThemeTransition): ThemeTransitionAnimation {
	const { cells, order } = createDirectionalBands(transition);
	return {
		duration: 850,
		easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
		keyframes: createMaskKeyframes(
			cells,
			order.map((cellIndex) => [cellIndex])
		)
	};
}

function createShutterAnimation(transition: ShutterThemeTransition): ThemeTransitionAnimation {
	const { cells, order } = createDirectionalBands(transition);
	const phaseCount = (order.length - 1) * SHUTTER_START_INTERVAL + SHUTTER_PHASES_PER_BAND;
	return {
		duration: phaseCount * SHUTTER_PHASE_DURATION,
		easing: 'linear',
		keyframes: createShutterKeyframes(cells, order)
	};
}

function createDirectionalBands(transition: BandThemeTransition) {
	const viewport = getViewport();
	const isHorizontal = transition.endsWith('-top') || transition.endsWith('-bottom');
	const cells = isHorizontal
		? createHorizontalBands(viewport, transition.endsWith('-bottom'))
		: createVerticalBands(viewport, transition.endsWith('-right'));
	const order = cells.map((_, index) => index);
	if (transition.endsWith('-bottom') || transition.endsWith('-right')) order.reverse();

	return { cells, order };
}

function createRandomGridAnimation(): ThemeTransitionAnimation {
	const grid = createGridMask(getViewport());
	const order = shuffle(Array.from({ length: grid.cells.length }, (_, index) => index));
	const groupSize = Math.ceil(order.length / GRID_RANDOM_PHASES);

	return {
		duration: 750,
		easing: 'linear',
		keyframes: createMaskKeyframes(grid.cells, chunk(order, groupSize), true)
	};
}

function createColumnGridAnimation(
	transition: ColumnGridThemeTransition
): ThemeTransitionAnimation {
	const grid = createGridMask(getViewport());
	const columns = Array.from({ length: grid.columns }, (_, index) => index);
	if (transition === 'column-grid-right') columns.reverse();

	const groups = columns.flatMap((column) => {
		const columnCells = shuffle(
			Array.from({ length: grid.rows }, (_, row) => row * grid.columns + column)
		);
		return chunk(columnCells, Math.ceil(columnCells.length / COLUMN_PHASES));
	});

	return {
		duration: 900,
		easing: 'linear',
		keyframes: createMaskKeyframes(grid.cells, groups, true)
	};
}

function createMaskKeyframes(
	cells: MaskCell[],
	groups: number[][],
	isDiscrete = false
): Keyframe[] {
	const maskImage = cells.map(() => 'linear-gradient(#000 0 0)').join(', ');
	const visibleCells = new Set<number>();

	return Array.from({ length: groups.length + 1 }, (_, phase) => {
		if (phase > 0) groups[phase - 1].forEach((index) => visibleCells.add(index));

		const boxes = cells.map((cell, index) =>
			visibleCells.has(index) ? cell.visible : cell.hidden
		);
		return createMaskKeyframe(maskImage, boxes, phase / groups.length, isDiscrete);
	});
}

function createShutterKeyframes(cells: ShutterCell[], order: number[]): Keyframe[] {
	const maskImage = cells.map(() => 'linear-gradient(#000 0 0)').join(', ');
	const phaseCount = (order.length - 1) * SHUTTER_START_INTERVAL + SHUTTER_PHASES_PER_BAND;

	return Array.from({ length: phaseCount + 1 }, (_, phase) => {
		const boxes = cells.map((cell) => cell.hidden);
		order.forEach((cellIndex, index) => {
			const bandPhase = phase - index * SHUTTER_START_INTERVAL;
			if (bandPhase >= SHUTTER_PHASES_PER_BAND) {
				boxes[cellIndex] = cells[cellIndex].visible;
			} else if (bandPhase >= 1) {
				boxes[cellIndex] = cells[cellIndex].partial;
			}
		});

		return createMaskKeyframe(maskImage, boxes, phase / phaseCount);
	});
}

function createMaskKeyframe(
	maskImage: string,
	boxes: MaskBox[],
	offset: number,
	isDiscrete = false
): Keyframe {
	return {
		offset,
		easing: isDiscrete ? 'steps(1, end)' : undefined,
		maskImage,
		maskRepeat: 'no-repeat',
		maskPosition: boxes.map(({ x, y }) => `${pixels(x)} ${pixels(y)}`).join(', '),
		maskSize: boxes.map(({ width, height }) => `${pixels(width)} ${pixels(height)}`).join(', ')
	};
}

function createGridMask(viewport: Viewport): GridMask {
	const columns = Math.min(
		GRID_MAX_COLUMNS,
		Math.max(GRID_MIN_COLUMNS, Math.ceil(viewport.width / GRID_TARGET_CELL_SIZE))
	);
	const cellWidth = viewport.width / columns;
	const rows = Math.min(GRID_MAX_ROWS, Math.ceil(viewport.height / cellWidth));
	const cellHeight = viewport.height / rows;
	const cells = Array.from({ length: columns * rows }, (_, index) => {
		const column = index % columns;
		const row = Math.floor(index / columns);
		const visible = {
			x: column * cellWidth - 0.5,
			y: row * cellHeight - 0.5,
			width: cellWidth + 1,
			height: cellHeight + 1
		};

		return {
			visible,
			hidden: {
				x: visible.x + visible.width / 2,
				y: visible.y + visible.height / 2,
				width: 0,
				height: 0
			}
		};
	});

	return { cells, columns, rows };
}

function createHorizontalBands(viewport: Viewport, opensFromBottom: boolean): ShutterCell[] {
	const height = viewport.height / BAND_COUNT;

	return Array.from({ length: BAND_COUNT }, (_, index) => {
		const visible = {
			x: -0.5,
			y: index * height - 0.5,
			width: viewport.width + 1,
			height: height + 1
		};
		return {
			visible,
			partial: {
				x: visible.x,
				y: visible.y + visible.height * 0.43,
				width: visible.width,
				height: visible.height * 0.14
			},
			hidden: {
				x: visible.x,
				y: opensFromBottom ? visible.y + visible.height : visible.y,
				width: visible.width,
				height: 0
			}
		};
	});
}

function createVerticalBands(viewport: Viewport, opensFromRight: boolean): ShutterCell[] {
	const width = viewport.width / BAND_COUNT;

	return Array.from({ length: BAND_COUNT }, (_, index) => {
		const visible = {
			x: index * width - 0.5,
			y: -0.5,
			width: width + 1,
			height: viewport.height + 1
		};
		return {
			visible,
			partial: {
				x: visible.x + visible.width * 0.43,
				y: visible.y,
				width: visible.width * 0.14,
				height: visible.height
			},
			hidden: {
				x: opensFromRight ? visible.x + visible.width : visible.x,
				y: visible.y,
				width: 0,
				height: visible.height
			}
		};
	});
}

function getViewport(): Viewport {
	return {
		width: Math.max(1, window.innerWidth),
		height: Math.max(1, window.innerHeight)
	};
}

function chunk(values: number[], size: number): number[][] {
	const chunks: number[][] = [];
	for (let index = 0; index < values.length; index += size) {
		chunks.push(values.slice(index, index + size));
	}
	return chunks;
}

function shuffle(values: number[]): number[] {
	const shuffled = [...values];
	for (let index = shuffled.length - 1; index > 0; index -= 1) {
		const nextIndex = Math.floor(Math.random() * (index + 1));
		[shuffled[index], shuffled[nextIndex]] = [shuffled[nextIndex], shuffled[index]];
	}
	return shuffled;
}

function pixels(value: number): string {
	return `${Math.round(value * 100) / 100}px`;
}
