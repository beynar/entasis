// Handler composition for components that wrap a consumer's handler around built-in behaviour.
// The rule (AGENTS.md proposed law 3): the consumer's handler runs first, on the same native
// event, and calling `event.preventDefault()` there cancels the built-in behaviour.

type Handler<E extends Event> = (event: E) => unknown;

/**
 * Runs `consumer` first, then `builtIn` unless the consumer called `event.preventDefault()`.
 * Either side may be missing; the returned handler is always callable.
 */
export function composeHandlers<E extends Event>(
	consumer: Handler<E> | null | undefined,
	builtIn: Handler<E> | null | undefined
): (event: E) => void {
	return (event) => {
		consumer?.(event);
		if (!event.defaultPrevented) builtIn?.(event);
	};
}
