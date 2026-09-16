import type { WithAttachments } from '$lib/types/props.js';
import type { Sizes } from '../../types/index.js';
import type { MermaidConfig, MermaidState } from './mermaid.state.svelte.js';
import type { MermaidThemeProps } from './mermaid.theme.js';

export type { MermaidConfig, MermaidModule } from './mermaid.state.svelte.js';

/**
 * Which floating controls to show. Pass `true`/`false` for all-or-nothing, or an
 * object to toggle individual controls.
 */
export type MermaidControls =
	| boolean
	| {
			/** Zoom-to-fit control. */
			fit?: boolean;
			/** Zoom-in control. */
			zoomIn?: boolean;
			/** Zoom-out control. */
			zoomOut?: boolean;
			/** Open-in-fullscreen-dialog control. */
			expand?: boolean;
			/** Download-as-SVG control. */
			download?: boolean;
	  };

export type MermaidProps = WithAttachments<{
	/**
	 * The mermaid diagram source (flowchart, sequence, gantt, pie, etc.). The
	 * code is sanitized before rendering. Re-renders reactively when it changes.
	 */
	chart: string;
	/**
	 * Extra mermaid configuration merged over the defaults (`theme: 'base'`,
	 * strict security, brand `themeVariables`, flowchart curve `basis`). Provide
	 * `themeVariables` here to override individual mapped colors, or `fontFamily`
	 * to change the diagram font.
	 */
	config?: MermaidConfig;
	/**
	 * The floating controls to show. `true` (default) shows all; `false` hides
	 * the bar; an object toggles individual controls (`fit`, `zoomIn`, `zoomOut`,
	 * `expand`, `download`).
	 * @default true
	 */
	controls?: MermaidControls;
	/**
	 * Enable mouse-wheel zoom over the diagram (activated after a short hover so
	 * scrolling the page past it doesn't hijack the wheel). Pan-drag and the
	 * zoom buttons work regardless.
	 * @default true
	 */
	mouseWheelZoom?: boolean;
	/**
	 * Capture single-finger touch as a pan. Off by default so an inline diagram never
	 * traps the page scroll; the fullscreen dialog turns it on. Pinch-zoom always works.
	 * @default false
	 */
	touchPan?: boolean;
	/**
	 * Forgive transient render/parse errors: instead of showing the error overlay,
	 * keep the last successfully-rendered diagram on screen (falling back to blank
	 * only until the first valid render). Intended for token-streaming, where the
	 * source is incomplete/invalid between chunks. Errors are still reported via
	 * `onError`.
	 * @default false
	 */
	errorForgiving?: boolean;
	/**
	 * The size of the diagram viewport.
	 * @default 'normal'
	 */
	size?: Sizes;
	/**
	 * Called after each successful render, with the diagram state.
	 */
	onRender?: (payload: MermaidState) => void;
	/**
	 * Called when loading mermaid, parsing, or rendering fails.
	 */
	onError?: (error: Error) => void;
	/**
	 * Additional CSS classes on the root element (the panzoom viewport).
	 */
	class?: string;
	/**
	 * Theme overrides for the diagram parts (root, container, svg, buttons,
	 * error, skeleton).
	 */
	theme?: MermaidThemeProps;
}>;
