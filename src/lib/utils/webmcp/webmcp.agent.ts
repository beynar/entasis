// Tells a change an agent made apart from one a person made. Every WebMCP tool runs inside
// `actAsAgent`, so whatever its call does synchronously, a control's `onValueChange`, an overlay's
// `onOpenChange` or the app's own handler, can ask `isAgentAction()`. Kept free of imports: every
// overlay reads it through `openChange.ts`, whether or not the app turned WebMCP on.

let depth = 0;

/** Runs `run` as an agent's action and returns what it returns. Calls nest. */
export function actAsAgent<T>(run: () => T): T {
	depth += 1;
	try {
		return run();
	} finally {
		depth -= 1;
	}
}

/**
 * Whether the code running now was called by a WebMCP tool rather than by a person. True for what
 * a tool's call does synchronously: a callback that runs after an `await` or a timer is not told.
 */
export const isAgentAction = (): boolean => depth > 0;
