import { onDestroy, untrack } from 'svelte';
import { on } from 'svelte/events';
import { SvelteMap } from 'svelte/reactivity';
import { BROWSER } from 'esm-env';

type Point = {
	x: number;
	y: number;
};

type SafeAreaRole = 'rect' | 'anchor' | 'floating';
type SafeRect = {
	left: number;
	top: number;
	right: number;
	bottom: number;
};
type SafeAreaDebugOption = boolean | (() => boolean);
type DebugAreaStyle = {
	kind: 'rectangle' | 'prediction-cone';
	stroke: string;
	fill: string;
	strokeDasharray?: string;
};

let debugAreaId = 0;

const isPointInArea = (point: Point, polygon: Point[]): boolean => {
	let isInside = false;
	const n = polygon.length;

	for (let i = 0, j = n - 1; i < n; j = i++) {
		if (polygon[i].y > point.y !== polygon[j].y > point.y) {
			const x =
				((polygon[j].x - polygon[i].x) * (point.y - polygon[i].y)) / (polygon[j].y - polygon[i].y) +
				polygon[i].x;
			if (point.x < x) {
				isInside = !isInside;
			}
		}
	}

	return isInside;
};

const getExpandedRect = (ref: HTMLElement, offset: number): SafeRect => {
	const rect = ref.getBoundingClientRect();
	return {
		left: rect.left - offset,
		top: rect.top - offset,
		right: rect.right + offset,
		bottom: rect.bottom + offset
	};
};

const getRectPolygon = (rect: SafeRect): Point[] => [
	{ x: rect.left, y: rect.top },
	{ x: rect.right, y: rect.top },
	{ x: rect.right, y: rect.bottom },
	{ x: rect.left, y: rect.bottom }
];

const getRectCenter = (rect: SafeRect): Point => ({
	x: rect.left + (rect.right - rect.left) / 2,
	y: rect.top + (rect.bottom - rect.top) / 2
});

const isPointInRect = (point: Point, rect: SafeRect) =>
	point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;

// The prediction cone: a triangle from where the pointer last was (its exit
// point off the trigger) to the two corners of the target's FACING edge — the
// edge the pointer is travelling toward. It's a narrow, dynamic sliver, so it
// covers the diagonal path to the submenu WITHOUT blanketing the sibling rows
// above/below (which stay hoverable). The facing edge is chosen by which axis
// the point overflows, not by raw distance — otherwise a point that's vertically
// nearer a corner than it is horizontally far from the side picks the wrong edge.
const getFacingEdgeTriangle = (fromPoint: Point, targetRect: SafeRect): Point[] => {
	const outLeft = targetRect.left - fromPoint.x;
	const outRight = fromPoint.x - targetRect.right;
	const outTop = targetRect.top - fromPoint.y;
	const outBottom = fromPoint.y - targetRect.bottom;

	const horizontal = Math.max(outLeft, outRight, 0);
	const vertical = Math.max(outTop, outBottom, 0);

	if (horizontal >= vertical) {
		const edgeX = outLeft >= outRight ? targetRect.left : targetRect.right;
		return [fromPoint, { x: edgeX, y: targetRect.top }, { x: edgeX, y: targetRect.bottom }];
	}
	const edgeY = outTop >= outBottom ? targetRect.top : targetRect.bottom;
	return [fromPoint, { x: targetRect.left, y: edgeY }, { x: targetRect.right, y: edgeY }];
};

function drawAreaInDOM(points: Point[], style: DebugAreaStyle): SVGSVGElement {
	const svgNS = 'http://www.w3.org/2000/svg';
	const svg = document.createElementNS(svgNS, 'svg');

	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;

	for (const point of points) {
		if (point.x < minX) minX = point.x;
		if (point.x > maxX) maxX = point.x;
		if (point.y < minY) minY = point.y;
		if (point.y > maxY) maxY = point.y;
	}

	const width = Math.max(maxX - minX, 1);
	const height = Math.max(maxY - minY, 1);
	svg.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
	svg.setAttribute('width', width.toString());
	svg.setAttribute('height', height.toString());
	svg.style.position = 'fixed';
	svg.style.top = Math.min(...points.map((p) => p.y)).toString() + 'px';
	svg.style.left = Math.min(...points.map((p) => p.x)).toString() + 'px';
	svg.style.zIndex = '900000';
	svg.id = `safe-area-${style.kind}-${debugAreaId++}`;
	svg.dataset.safeAreaDebug = 'true';
	svg.dataset.safeAreaDebugKind = style.kind;
	svg.style.pointerEvents = 'none';

	const polygon = document.createElementNS(svgNS, 'polygon');
	const pointsAttr = points.map((p) => `${p.x},${p.y}`).join(' ');
	polygon.setAttribute('points', pointsAttr);

	polygon.style.fill = style.fill;
	polygon.style.stroke = style.stroke;
	polygon.style.strokeWidth = '2';
	if (style.strokeDasharray) polygon.style.strokeDasharray = style.strokeDasharray;

	svg.appendChild(polygon);
	document.body.appendChild(svg);

	return svg;
}

export const useSafeArea = (opts: {
	isActive: () => boolean;
	callback?: () => void;
	offset?: number;
	debug?: SafeAreaDebugOption;
	trackPosition?: boolean;
}) => {
	const refs = new SvelteMap<HTMLElement, SafeAreaRole>();
	const observerOffs = new SvelteMap<HTMLElement, () => void>();
	let pointerOff: (() => void) | null = null;
	const rects = new SvelteMap<HTMLElement, SafeRect>();
	const rectDebugs = new SvelteMap<HTMLElement, SVGSVGElement>();
	let coneDebug: SVGSVGElement | null = null;
	let lastSafePoint: Point | null = null;
	let lastSafeRole: 'anchor' | 'floating' | null = null;
	let isListening = false;
	let closeTimer: ReturnType<typeof setTimeout> | null = null;

	// ponytail: a short grace delay is a sampling safety net — pointermove fires
	// on discrete points, so a fast flick can skip past the cone in one event; the
	// delay lets it re-enter a safe region before the close actually fires.
	const CLOSE_DELAY = 120;

	const { offset = 10 } = opts;
	const getDebug = () => (typeof opts.debug === 'function' ? opts.debug() : !!opts.debug);

	// The anchor (trigger) is measured tight — expanding it would push the cone's
	// apex and the "in trigger" region into the sibling rows, protecting them.
	const getOffset = (role: SafeAreaRole) => (role === 'anchor' ? 0 : offset);

	const setArea = (ref: HTMLElement) => {
		const debug = rectDebugs.get(ref);
		if (debug) {
			debug.remove();
			rectDebugs.delete(ref);
		}

		const role = refs.get(ref) ?? 'rect';
		const rect = getExpandedRect(ref, getOffset(role));
		rects.set(ref, rect);

		if (getDebug() && BROWSER) {
			rectDebugs.set(
				ref,
				drawAreaInDOM(getRectPolygon(rect), {
					kind: 'rectangle',
					stroke: '#2563eb',
					fill: 'rgba(37, 99, 235, 0.08)'
				})
			);
		}
	};

	const getRoleRect = (role: 'anchor' | 'floating') => {
		for (const [ref, refRole] of refs) {
			if (refRole !== role) continue;
			const rect = rects.get(ref);
			if (rect) return rect;
		}
		return null;
	};

	const getContainingRole = (point: Point): SafeAreaRole | null => {
		let matchedRole: SafeAreaRole | null = null;
		for (const [ref, rect] of rects) {
			if (!isPointInRect(point, rect)) continue;
			const role = refs.get(ref) ?? 'rect';
			if (role === 'anchor' || role === 'floating') return role;
			matchedRole = role;
		}
		return matchedRole;
	};

	// The cone from the last safe point toward whichever rect the pointer is
	// heading to (leaving the trigger → the panel; leaving the panel → the trigger).
	const getConeTriangle = (): Point[] | null => {
		const anchorRect = getRoleRect('anchor');
		const floatingRect = getRoleRect('floating');
		if (!anchorRect || !floatingRect) return null;
		const from = lastSafePoint ?? getRectCenter(anchorRect);
		const role = lastSafeRole ?? 'anchor';
		const targetRect = role === 'anchor' ? floatingRect : anchorRect;
		return getFacingEdgeTriangle(from, targetRect);
	};

	const isPointInCone = (point: Point): boolean => {
		const triangle = getConeTriangle();
		return triangle ? isPointInArea(point, triangle) : false;
	};

	const isPointSafe = (point: Point): boolean =>
		getContainingRole(point) !== null || isPointInCone(point);

	const updateConeDebug = () => {
		coneDebug?.remove();
		coneDebug = null;
		if (!getDebug() || !BROWSER) return;
		const triangle = getConeTriangle();
		if (!triangle) return;
		coneDebug = drawAreaInDOM(triangle, {
			kind: 'prediction-cone',
			stroke: '#f97316',
			fill: 'rgba(249, 115, 22, 0.14)',
			strokeDasharray: '6 4'
		});
	};

	const cancelClose = () => {
		if (closeTimer === null) return;
		clearTimeout(closeTimer);
		closeTimer = null;
	};

	const scheduleClose = () => {
		if (closeTimer !== null) return;
		closeTimer = setTimeout(() => {
			closeTimer = null;
			opts.callback?.();
			destroy();
		}, CLOSE_DELAY);
	};

	const onPointerMove = (e: PointerEvent) => {
		if (rects.size === 0) return;
		if (opts.trackPosition) {
			refs.forEach((_role, ref) => setArea(ref));
			updateConeDebug();
		}

		const point = { x: e.clientX, y: e.clientY };
		const containingRole = getContainingRole(point);
		if (containingRole) {
			if (containingRole === 'anchor' || containingRole === 'floating') {
				lastSafePoint = point;
				lastSafeRole = containingRole;
				updateConeDebug();
			}
			cancelClose();
			return;
		}

		if (isPointInCone(point)) {
			cancelClose();
			return;
		}

		scheduleClose();
	};

	const removeDebug = () => {
		rectDebugs.forEach((debug) => debug.remove());
		rectDebugs.clear();
		coneDebug?.remove();
		coneDebug = null;
	};
	const destroy = () => {
		cancelClose();
		pointerOff?.();
		pointerOff = null;
		observerOffs.forEach((off) => off());
		observerOffs.clear();
		rects.clear();
		lastSafePoint = null;
		lastSafeRole = null;
		isListening = false;
		removeDebug();
	};

	const addReference = (ref: HTMLElement) => {
		if (observerOffs.has(ref)) return;

		const resizeObserver = new ResizeObserver(() => {
			setArea(ref);
			updateConeDebug();
		});
		const mutationObserver = new MutationObserver(() => {
			setArea(ref);
			updateConeDebug();
		});
		mutationObserver.observe(ref, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['class', 'data-placement', 'style']
		});

		resizeObserver.observe(ref);
		const off = () => {
			resizeObserver.unobserve(ref);
			mutationObserver.disconnect();
			observerOffs.delete(ref);
			rects.delete(ref);
			const debug = rectDebugs.get(ref);
			debug?.remove();
			rectDebugs.delete(ref);
		};
		observerOffs.set(ref, off);
		setArea(ref);
	};

	const start = () => {
		if (isListening) return;
		isListening = true;
		refs.forEach((_role, ref) => {
			addReference(ref);
		});
		updateConeDebug();
		pointerOff = on(window, 'pointermove', onPointerMove);
	};

	$effect(() => {
		const isActive = opts.isActive();
		untrack(() => {
			if (isActive) {
				start();
			} else {
				destroy();
			}
		});
	});

	$effect(() => {
		const isActive = opts.isActive();
		const debug = getDebug();
		untrack(() => {
			if (!isActive) return;
			if (!debug) {
				removeDebug();
				return;
			}
			refs.forEach((_role, ref) => {
				setArea(ref);
			});
			updateConeDebug();
		});
	});

	onDestroy(() => {
		destroy();
	});

	const registerReference = (ref: HTMLElement, role: SafeAreaRole) => {
		refs.set(ref, role);
		if (isListening) addReference(ref);
		return () => {
			refs.delete(ref);
			observerOffs.get(ref)?.();
		};
	};

	return {
		reference: (ref: HTMLElement) => {
			return registerReference(ref, 'rect');
		},
		anchorReference: (ref: HTMLElement) => {
			return registerReference(ref, 'anchor');
		},
		floatingReference: (ref: HTMLElement) => {
			return registerReference(ref, 'floating');
		},
		updateAreas: () => {
			refs.forEach((_role, ref) => {
				setArea(ref);
			});
			updateConeDebug();
		},
		// Whether a point is inside the live safe area (trigger, panel, or the cone
		// between them). Lets a parent menu give the safe area authority: a sibling
		// hover must NOT close a submenu the pointer is travelling toward.
		containsPoint: (x: number, y: number) => rects.size > 0 && isPointSafe({ x, y })
	};
};
