import type { Attachment } from 'svelte/attachments';
import { on } from 'svelte/events';
import { untrack } from 'svelte';

export type PointerDragPayload<Node extends HTMLElement = HTMLElement> = {
	event: PointerEvent;
	node: Node;
	pointerId: number;
	startX: number;
	startY: number;
	startTarget: EventTarget | null;
	x: number;
	y: number;
	deltaX: number;
	deltaY: number;
	hasMoved: boolean;
};

export type PointerDragActivation = Readonly<{
	distancePx: number;
	touchDelayMs: number;
	touchTolerancePx: number;
}>;

export type PointerDragOptions<Node extends HTMLElement = HTMLElement> = {
	disabled?: () => boolean;
	canStart?: (event: PointerEvent) => boolean;
	moveTolerance?: number;
	activation?: () => PointerDragActivation;
	/** When the node should capture the pointer. `immediate` (default) captures on pointerdown,
	 *  which is right for a dedicated handle. `on-activate` defers the capture to the moment the
	 *  session activates: a press that never becomes a drag leaves the pointer — and so the
	 *  compatibility mouse events, the click and the text selection — with whatever was pressed.
	 *  Use it when the node is a whole region rather than a handle. */
	capture?: 'immediate' | 'on-activate';
	/** Movement-driven activation, for gestures whose promotion rule is the consumer's own
	 *  (an axis, a direction, what the press landed on). Called on every move while the session
	 *  is still a candidate; return true to activate it there and then. A session that is never
	 *  promoted simply ends on pointerup, without `onStart`/`onEnd`. Takes the place of
	 *  `activation`, which promotes on distance and a touch hold instead. */
	shouldActivate?: (payload: PointerDragPayload<Node>) => boolean;
	/** While the drag is active, `touchmove` is prevented so the page cannot pan under it.
	 *  Default true; set false when the consumer governs touch panning itself (`touch-action`)
	 *  and native scrolling around the gesture must keep working. */
	preventTouchMove?: boolean;
	/** The press was accepted and the session created — before any activation, and before the
	 *  pointer is captured under `capture: 'on-activate'`. Measure here what the gesture is
	 *  relative to; nothing is committed yet. */
	onDown?: (payload: PointerDragPayload<Node>) => void;
	/** Deliver only the latest pointer move in each animation frame. The final
	 * pointer is always available to `onEnd`; queued moves are discarded on end
	 * or cancellation. */
	frameCoalesced?: boolean;
	stopPropagation?: boolean;
	onStart?: (payload: PointerDragPayload<Node>) => boolean | void;
	onMove?: (payload: PointerDragPayload<Node>) => void;
	onEnd?: (payload: PointerDragPayload<Node>) => void;
	onCancel?: (payload: PointerDragPayload<Node>) => void;
};

type PointerDragSession<Node extends HTMLElement> = {
	node: Node;
	pointerId: number;
	startX: number;
	startY: number;
	startTarget: EventTarget | null;
	lastEvent: PointerEvent;
	hasMoved: boolean;
	isActive: boolean;
	usesActivation: boolean;
	activationTimer: number | null;
	detachWindowEnd: (() => void) | null;
};

const DEFAULT_MOVE_TOLERANCE = 2;

export const createPointerDrag = <Node extends HTMLElement = HTMLElement>(
	options: PointerDragOptions<Node>
): Attachment<Node> => {
	let session: PointerDragSession<Node> | null = null;
	let moveFrame: number | null = null;
	let pendingMove: PointerDragPayload<Node> | null = null;

	const cancelPendingMove = () => {
		if (moveFrame !== null) cancelAnimationFrame(moveFrame);
		moveFrame = null;
		pendingMove = null;
	};

	const dispatchMove = (payload: PointerDragPayload<Node>) => {
		if (!options.frameCoalesced) {
			options.onMove?.(payload);
			return;
		}
		pendingMove = payload;
		if (moveFrame !== null) return;
		moveFrame = requestAnimationFrame(() => {
			moveFrame = null;
			const latest = pendingMove;
			pendingMove = null;
			if (latest) options.onMove?.(latest);
		});
	};

	const getPayload = (
		event: PointerEvent,
		currentSession: PointerDragSession<Node>
	): PointerDragPayload<Node> => {
		const deltaX = event.clientX - currentSession.startX;
		const deltaY = event.clientY - currentSession.startY;
		const tolerance = options.moveTolerance ?? DEFAULT_MOVE_TOLERANCE;
		currentSession.hasMoved =
			currentSession.hasMoved || Math.abs(deltaX) > tolerance || Math.abs(deltaY) > tolerance;
		currentSession.lastEvent = event;
		return {
			event,
			node: currentSession.node,
			pointerId: currentSession.pointerId,
			startX: currentSession.startX,
			startY: currentSession.startY,
			startTarget: currentSession.startTarget,
			x: event.clientX,
			y: event.clientY,
			deltaX,
			deltaY,
			hasMoved: currentSession.hasMoved
		};
	};

	const releasePointer = (currentSession: PointerDragSession<Node>) => {
		if (currentSession.node.hasPointerCapture(currentSession.pointerId)) {
			currentSession.node.releasePointerCapture(currentSession.pointerId);
		}
	};

	const clearActivationTimer = (currentSession: PointerDragSession<Node>) => {
		if (currentSession.activationTimer === null) return;
		window.clearTimeout(currentSession.activationTimer);
		currentSession.activationTimer = null;
	};

	/** Everything a terminating session has to let go of, whatever ends it. */
	const teardown = (currentSession: PointerDragSession<Node>) => {
		clearActivationTimer(currentSession);
		currentSession.detachWindowEnd?.();
		currentSession.detachWindowEnd = null;
	};

	const activate = (event: PointerEvent, currentSession: PointerDragSession<Node>): boolean => {
		if (currentSession.isActive) return true;
		clearActivationTimer(currentSession);
		const payload = getPayload(event, currentSession);
		if (options.onStart?.(payload) === false) return false;
		currentSession.isActive = true;
		if (options.capture === 'on-activate') {
			try {
				currentSession.node.setPointerCapture(currentSession.pointerId);
			} catch {
				/* the pointer may no longer be active (synthetic events) — capture is best-effort */
			}
		}
		if (options.stopPropagation) event.stopPropagation();
		event.preventDefault();
		return true;
	};

	const cancel = (event: PointerEvent, currentSession: PointerDragSession<Node>) => {
		cancelPendingMove();
		teardown(currentSession);
		const payload = getPayload(event, currentSession);
		if (session === currentSession) session = null;
		releasePointer(currentSession);
		options.onCancel?.(payload);
	};

	const end = (event: PointerEvent) => {
		if (!session || event.pointerId !== session.pointerId) return;

		const currentSession = session;
		const payload = getPayload(event, currentSession);
		session = null;
		cancelPendingMove();
		teardown(currentSession);
		releasePointer(currentSession);
		if (currentSession.isActive) options.onEnd?.(payload);
		else options.onCancel?.(payload);
	};

	const abort = (event: PointerEvent) => {
		if (!session || event.pointerId !== session.pointerId) return;
		const currentSession = session;
		if (!currentSession.usesActivation && !options.onCancel) {
			end(event);
			return;
		}
		cancel(event, currentSession);
	};

	return (node) =>
		untrack(() => {
			const start = (event: PointerEvent) => {
				if (
					session ||
					event.button !== 0 ||
					options.disabled?.() ||
					options.canStart?.(event) === false
				) {
					return;
				}

				const nextSession: PointerDragSession<Node> = {
					node,
					pointerId: event.pointerId,
					startX: event.clientX,
					startY: event.clientY,
					startTarget: event.target,
					lastEvent: event,
					hasMoved: false,
					isActive: false,
					usesActivation: false,
					activationTimer: null,
					detachWindowEnd: null
				};
				const deferCapture = options.capture === 'on-activate';
				if (!deferCapture) node.setPointerCapture(event.pointerId);
				session = nextSession;
				if (deferCapture) {
					// Without the capture the node stops seeing the pointer once it leaves: a press
					// released outside would strand the session and deafen every later press.
					const offUp = on(window, 'pointerup', end);
					const offCancel = on(window, 'pointercancel', abort);
					nextSession.detachWindowEnd = () => {
						offUp();
						offCancel();
					};
				}
				options.onDown?.(getPayload(event, nextSession));
				const activation = options.activation?.();
				if (!activation && !options.shouldActivate) {
					if (!activate(event, nextSession)) cancel(event, nextSession);
					return;
				}
				nextSession.usesActivation = true;
				// A consumer-driven promotion has nothing to start on a press: it waits for movement.
				if (!activation || event.pointerType !== 'touch') return;
				nextSession.activationTimer = window.setTimeout(() => {
					if (session !== nextSession) return;
					if (!activate(nextSession.lastEvent, nextSession)) {
						cancel(nextSession.lastEvent, nextSession);
						return;
					}
					dispatchMove(getPayload(nextSession.lastEvent, nextSession));
				}, activation.touchDelayMs);
			};

			const move = (event: PointerEvent) => {
				if (!session || event.pointerId !== session.pointerId) return;

				const currentSession = session;
				const payload = getPayload(event, currentSession);
				// A candidate the consumer promotes itself: nothing moves until it says so.
				if (options.shouldActivate && !currentSession.isActive) {
					if (!options.shouldActivate(payload)) return;
					if (!activate(event, currentSession)) {
						cancel(event, currentSession);
						return;
					}
					dispatchMove(getPayload(event, currentSession));
					return;
				}
				const activation = options.activation?.();
				if (!activation || currentSession.isActive) {
					event.preventDefault();
					dispatchMove(payload);
					return;
				}
				const distance = Math.hypot(payload.deltaX, payload.deltaY);
				if (event.pointerType === 'touch') {
					if (distance > activation.touchTolerancePx) cancel(event, currentSession);
					return;
				}
				if (distance < activation.distancePx) return;
				if (!activate(event, currentSession)) {
					cancel(event, currentSession);
					return;
				}
				dispatchMove(getPayload(event, currentSession));
			};

			const cleanup = () => {
				if (!session || session.node !== node) return;
				const currentSession = session;
				if (currentSession.isActive && !currentSession.usesActivation && !options.onCancel) {
					end(currentSession.lastEvent);
					return;
				}
				cancel(currentSession.lastEvent, currentSession);
			};

			const offPointerDown = on(node, 'pointerdown', start);
			const offPointerMove = on(node, 'pointermove', move);
			const offPointerUp = on(node, 'pointerup', end);
			const offPointerCancel = on(node, 'pointercancel', abort);
			const offLostPointerCapture = on(node, 'lostpointercapture', abort);
			const offTouchMove =
				options.preventTouchMove === false
					? () => {}
					: on(
							node,
							'touchmove',
							(event) => {
								if (session?.node === node && session.isActive) event.preventDefault();
							},
							{ passive: false }
						);

			return () => {
				cleanup();
				offPointerDown();
				offPointerMove();
				offPointerUp();
				offPointerCancel();
				offLostPointerCapture();
				offTouchMove();
			};
		});
};
