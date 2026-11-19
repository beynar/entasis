import type { WithAttachments } from '$lib/types/props.js';
import type { Colors, Sizes } from '$lib/types/theme.js';
import type { ThinkingOrbFrameFunction } from './thinkingOrb.core.js';
import type { ThinkingOrbThemeProps } from './thinkingOrb.theme.js';

/**
 * What the agent is doing, each with its own drawing:
 * - `working`: particles on tilted orbits.
 * - `searching`: a scan meridian sweeps a dotted globe.
 * - `solving`: bands of a sphere scramble in quarter turns, then click back into place.
 * - `listening`: a waveform rolls through the rings of a sphere.
 * - `connecting`: a constellation wires itself, packets running along its edges.
 * - `weaving`: three strands plait around a sphere.
 * - `composing`: an undulating sash of parallel strands.
 * - `breathing`: a ring seen from the front, slowly changing shape.
 * - `shaping`: a dotted outline turns from a circle to a triangle to a square.
 */
export type ThinkingOrbState =
	| 'working'
	| 'searching'
	| 'solving'
	| 'listening'
	| 'connecting'
	| 'weaving'
	| 'composing'
	| 'breathing'
	| 'shaping';

/** Whether the orb is drawn for a dark or a light surface. */
export type ThinkingOrbColorScheme = 'auto' | 'light' | 'dark';

/**
 * Fine tuning of a state's drawing. Each part is read by the states named, and defaults to that
 * state's own value at the orb's size.
 */
export type ThinkingOrbTuning = {
	/** `working`: opacity of the orbit paths, 0 to 1. Default 0.5. */
	trailOpacity?: number;
	/** `working`: particles on each orbit. Default 3. */
	particles?: number;
	/** `searching`: how fast the scan sweeps, relative to the globe's spin. Default about 4.1. */
	scanSpeed?: number;
	/** `searching`: opacity of the dots the scan is not on, 0 to 1. Default 0.45. */
	dim?: number;
	/**
	 * `connecting`: how far apart two nodes may be and still be joined, on a sphere of radius 1.
	 * Default 0.72.
	 */
	reach?: number;
	/** `connecting`: packets running between nodes. Default 7 at 64px, 1 at 20px. */
	signals?: number;
	/** `connecting`: width of the edges, in pixels at a 300px size. Default 0.8. */
	lineWidth?: number;
	/**
	 * `connecting`, `shaping`: size of the figure inside the orb. Default 1 for `connecting`, 1.45
	 * for `shaping`.
	 */
	spread?: number;
	/** `weaving`: how many times each strand winds from pole to pole. Default 3. */
	turns?: number;
	/**
	 * `composing`, `breathing`: depth of the undulation; 0 is a clean band. Default 1 for
	 * `composing`, about 0.4 for `breathing`.
	 */
	wobble?: number;
	/** `composing`, `breathing`: width of the band, as a multiplier on its strands. Default about 4. */
	bands?: number;
	/** `composing`, `breathing`: how much the band tumbles in space; 0 holds it. Default 0. */
	spin?: number;
	/** `shaping`: holds one outline, and stops the cycle. */
	shape?: 'circle' | 'triangle' | 'square';
};

export type ThinkingOrbProps = WithAttachments<{
	/**
	 * What the agent is doing. A change of state crosses from one drawing to the next.
	 * @default 'working'
	 */
	state?: ThinkingOrbState;
	/**
	 * The colour role of the ink. Depth is shown on the ink itself: far dots fade toward the
	 * surface. Defaults to the Theme's default colour.
	 */
	color?: Colors;
	/**
	 * `small` (20px) sits in a line of text, `normal` (32px) beside a control, `large` (64px) in
	 * place of an avatar. Each size has its own dot count, dot size and pace.
	 * @default 'normal'
	 */
	size?: Sizes;
	/**
	 * Explicit size in pixels, overriding `size`. The drawing is tuned at 20 and at 64, and read
	 * between the two for any other size; above 64 it keeps the tuning of 64.
	 */
	diameter?: number;
	/**
	 * Multiplier on the state's own pace.
	 * @default 1
	 */
	speed?: number;
	/**
	 * Holds the orb on its current frame.
	 * @default false
	 */
	paused?: boolean;
	/**
	 * Multiplier on how many dots are drawn: 0.5 halves them, 2 doubles them.
	 * @default 1
	 */
	dots?: number;
	/**
	 * Multiplier on the radius of every dot: 0.7 reads finer, 1.5 bolder.
	 * @default 1
	 */
	dotSize?: number;
	/** Fine tuning of the state's drawing. */
	tuning?: ThinkingOrbTuning;
	/**
	 * Replaces the state's drawing with your own: a function from `(size, time, options)` to the
	 * dots and lines of that instant. The orb sorts the dots by depth and paints them; the ink,
	 * the pause and the pace stay its own.
	 */
	frame?: ThinkingOrbFrameFunction;
	/**
	 * Whether the orb is drawn for a dark or a light surface. `auto` reads the text colour around
	 * it: light text means a dark surface.
	 * @default 'auto'
	 */
	colorScheme?: ThinkingOrbColorScheme;
	/** Accessible name. Defaults to the state in the locale ("Searching…"). */
	label?: string;
	/** Bindable reference to the root element. */
	ref?: HTMLElement | null;
	/** Additional classes for the root element. A class that sizes it sizes the drawing. */
	class?: string;
	/** Theme overrides for the root and the canvas. */
	theme?: ThinkingOrbThemeProps;
}>;
