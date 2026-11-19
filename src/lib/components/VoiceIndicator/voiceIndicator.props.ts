import type { WithAttachments } from '$lib/types/props.js';
import type { Colors, Sizes } from '$lib/types/theme.js';
import type { VoiceIndicatorThemeProps } from './voiceIndicator.theme.js';

/** The shape: rings of line round an open centre, or a filled sphere. */
export type VoiceIndicatorVariant = 'ring' | 'orb';

/**
 * What the shape is made of. `light`: a blooming ribbon of light (ring) or a flowing cloud (orb).
 * `solid`: lit tubes that a voice opens into a globe (ring) or a matt ball with clouds on it (orb).
 */
export type VoiceIndicatorAppearance = 'light' | 'solid';

/**
 * Where the conversation is:
 * - `idle`: waiting; sources are ignored and the indicator drifts slowly.
 * - `connecting`: the session is starting; the working motion, dimmed.
 * - `listening`: the person's turn; follows `input`.
 * - `thinking`: working on what was heard; sources are ignored, the colours turn like a loader.
 * - `speaking`: the assistant's turn; follows `output`.
 * - `error`: the session failed; the indicator stills and takes the danger colour.
 */
export type VoiceIndicatorState =
	'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

/** A colour role, or the indicator's own spectrum. */
export type VoiceIndicatorColor = Colors | 'spectrum';

/** How much the indicator moves: slower and gentler, or quicker and further. */
export type VoiceIndicatorMotion = 'calm' | 'balanced' | 'expressive';

/**
 * What a voice is read from: a live stream (a microphone, a WebRTC track), an AnalyserNode you
 * already have (an `<audio>` element's), a level from 0 to 1, or a function returning one, read
 * every frame without re-rendering anything.
 */
export type VoiceIndicatorSource = MediaStream | AnalyserNode | number | (() => number);

/**
 * The curve a loudness is shown through, once past the noise gate: a named curve, or a function
 * from the gated loudness (0 to 1) to the level shown (0 to 1).
 * - `soft`: rises fast then rounds off, so a shout does not clip.
 * - `linear`: the loudness as it is; anything past full scale clips.
 * - `log`: lifts quiet sounds the most, as hearing does.
 * - `exp`: keeps quiet sounds low and opens up on loud ones.
 */
export type VoiceIndicatorCurve = 'soft' | 'linear' | 'log' | 'exp' | ((level: number) => number);

/** Whether the indicator is drawn for a dark or a light surface. */
export type VoiceIndicatorColorScheme = 'auto' | 'light' | 'dark';

/** Fine tuning of the drawing and of the envelope. Every part defaults to the look's own. */
export type VoiceIndicatorTuning = {
	/** Rest radius, as a share of half the size. Ring in light 0.56, solid ring 0.48, orb 0.55. */
	radius?: number;
	/**
	 * How readily a voice bends the ring. In light 1.45, solid 1.85. The depth of a bend has a
	 * ceiling whatever this is, so the ring keeps reading as a ring.
	 */
	deform?: number;
	/** Ring: how many rings. In light 6, solid 3. */
	rings?: number;
	/** Ring: how far apart the rings sit, as a share of the radius. In light 0.02, solid 0.035. */
	gap?: number;
	/** Ring: line width in pixels at a 200px size. In light 1.85, solid 3. */
	lineWidth?: number;
	/** Ring in light: how far the rings lean apart, which widens the ribbon. Default 0.91. */
	spread?: number;
	/** Ring in light: strength of the halo round the rings. Default 0.5. */
	halo?: number;
	/** Solid ring: how far the loops lean apart while waiting, in radians. Default 0.22. */
	tilt?: number;
	/** Solid ring: how much further a voice opens them into a globe. Default 0.75. */
	open?: number;
	/** Solid ring: how far a voice warps the loops out of their plane. Default 1.2. */
	twist?: number;
	/** Solid ring: how far a voice warps the loops in their plane. Default 0.31. */
	wobble?: number;
	/** Orb: its size at the loudest while listening, as a share of its rest size. Default 0.8. */
	listeningScale?: number;
	/** Orb: its size at the loudest while speaking, as a share of its rest size. Default 1.2. */
	speakingScale?: number;
	/** Seconds the level takes to rise. Default 0.06. */
	attack?: number;
	/** Seconds the level takes to settle. Default 0.32. */
	release?: number;
	/** Breathing kept under the voice so silence never looks dead; 0 for none. Default 0.1. */
	idle?: number;
	/** Waiting pace, as a share of the pace in voice. Default 0.4. */
	calm?: number;
};

export type VoiceIndicatorProps = WithAttachments<{
	/**
	 * The shape: a `ring` of lines round an open centre, or a filled `orb`.
	 * @default 'ring'
	 */
	variant?: VoiceIndicatorVariant;
	/**
	 * What the shape is made of: `light` (a blooming ribbon, a flowing cloud) or `solid` (lit
	 * tubes that open into a globe, a matt ball with clouds on it).
	 * @default 'light'
	 */
	appearance?: VoiceIndicatorAppearance;
	/**
	 * A colour role, or `spectrum` for the indicator's own colours. A change of colour eases in.
	 * The `error` state shows the danger role whatever this is.
	 * @default 'spectrum'
	 */
	color?: VoiceIndicatorColor;
	/**
	 * Where the conversation is. A change of state eases; it never cuts.
	 * @default 'idle'
	 */
	state?: VoiceIndicatorState;
	/**
	 * The person's voice, followed while `listening`. Stands in for `output` when that is not set.
	 */
	input?: VoiceIndicatorSource | null;
	/**
	 * The assistant's voice, followed while `speaking`. Stands in for `input` when that is not set.
	 */
	output?: VoiceIndicatorSource | null;
	/**
	 * Semantic size: 48, 128 or 224 pixels.
	 * @default 'normal'
	 */
	size?: Sizes;
	/** Explicit size in pixels, overriding `size`. Any size; the drawing is designed at 200. */
	diameter?: number;
	/**
	 * How much the indicator moves.
	 * @default 'balanced'
	 */
	motion?: VoiceIndicatorMotion;
	/**
	 * Multiplier on the pace of every motion.
	 * @default 1
	 */
	speed?: number;
	/**
	 * Input gain. Raise it for a quiet source.
	 * @default 1
	 */
	sensitivity?: number;
	/**
	 * Noise gate, 0 to 1: below it the indicator hears silence.
	 * @default 0.04
	 */
	threshold?: number;
	/**
	 * The curve a loudness above the gate is shown through: `soft`, `linear`, `log`, `exp`, or
	 * your own function from 0 to 1 to 0 to 1.
	 * @default 'soft'
	 */
	curve?: VoiceIndicatorCurve;
	/**
	 * How far a named curve bends away from the straight line; 0 is the straight line. Defaults
	 * to 3 for `soft` and `exp` and 9 for `log`. Not used by `linear` or by a function.
	 */
	curveAmount?: number;
	/**
	 * Where the voice comes from, -1 (left) to 1 (right), as a number or a function read every
	 * frame. While a voice is heard the indicator leans that way, and settles back in silence. A
	 * microphone is mono: the side comes from your app (a stereo estimate, the speaker's seat).
	 * A leaning ring is drawn up to 45% of its size past its box on either side.
	 */
	direction?: number | (() => number) | null;
	/**
	 * Ring only: as the pointer nears the rim, the rings are drawn toward it like a membrane,
	 * while `idle` or `thinking`. Fine pointers only, and off under reduced motion. `true` bends
	 * at 0.55; a number from 0 to 1 sets the strength.
	 * @default false
	 */
	hoverBend?: boolean | number;
	/**
	 * Holds the indicator on its current frame.
	 * @default false
	 */
	paused?: boolean;
	/**
	 * Whether it is drawn for a dark or a light surface. `auto` reads the text colour around it:
	 * light text means a dark surface.
	 * @default 'auto'
	 */
	colorScheme?: VoiceIndicatorColorScheme;
	/** Fine tuning of the drawing and of the envelope. */
	tuning?: VoiceIndicatorTuning;
	/** Called with the shaped level, 0 to 1, each frame it changes: for a meter or a label. */
	onLevelChange?: (level: number) => void;
	/**
	 * Makes the indicator a button that starts the session: called when it is pressed while
	 * `idle` or in `error`.
	 */
	onStart?: () => void;
	/**
	 * Makes the indicator a button that stops the session: called when it is pressed in any
	 * other state.
	 */
	onStop?: () => void;
	/** With `onStart` or `onStop`: the indicator cannot be pressed. */
	disabled?: boolean;
	/**
	 * Accessible name. Defaults to the state in the locale ("Listening"); as a button, to what a
	 * press does ("Start voice session"), with the state as its description.
	 */
	label?: string;
	/** Bindable reference to the root element. */
	ref?: HTMLElement | null;
	/** Additional classes for the root element. A class that sizes it sizes the drawing. */
	class?: string;
	/** Theme overrides for the root and the canvas. */
	theme?: VoiceIndicatorThemeProps;
}>;
