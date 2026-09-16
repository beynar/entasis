import { bindLiveMapMovementEvents } from './map-refresh.js';
import type { MapViewChangeArg } from './map-types.js';
import type { MapLibreMap } from './maplibre-types.js';

type MapViewEventCallbacks = {
	onViewChange?: (payload: MapViewChangeArg) => void;
	onMoveEnd?: (payload: MapViewChangeArg) => void;
	onZoomEnd?: (payload: MapViewChangeArg) => void;
};

function createAnimationFrameScheduler(callback: () => void) {
	let frame: number | null = null;
	let timeout: ReturnType<typeof setTimeout> | null = null;

	function clearScheduledWork(): void {
		if (frame !== null) {
			cancelAnimationFrame(frame);
			frame = null;
		}

		if (timeout !== null) {
			clearTimeout(timeout);
			timeout = null;
		}
	}

	function cancel(): void {
		clearScheduledWork();
	}

	function run(): void {
		frame = null;
		timeout = null;
		callback();
	}

	return {
		schedule: () => {
			if (frame !== null || timeout !== null) return;

			if (typeof requestAnimationFrame === 'function') {
				frame = requestAnimationFrame(run);
				return;
			}

			timeout = setTimeout(run, 16);
		},
		flush: () => {
			if (frame === null && timeout === null) return;
			cancel();
			run();
		},
		cancel
	};
}

export function getMapView(map: MapLibreMap): MapViewChangeArg {
	const center = map.getCenter();
	const bounds = map.getBounds();

	return {
		map,
		center: [center.lng, center.lat],
		zoom: map.getZoom(),
		bounds: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
		bearing: map.getBearing(),
		pitch: map.getPitch()
	};
}

export function bindMapViewEvents(map: MapLibreMap, callbacks: MapViewEventCallbacks): () => void {
	const liveViewChange = createAnimationFrameScheduler(() => {
		callbacks.onViewChange?.(getMapView(map));
	});

	function scheduleViewChange(): void {
		if (callbacks.onViewChange) liveViewChange.schedule();
	}

	function handleMoveEnd(): void {
		liveViewChange.flush();
		callbacks.onMoveEnd?.(getMapView(map));
	}

	function handleZoomEnd(): void {
		liveViewChange.flush();
		callbacks.onZoomEnd?.(getMapView(map));
	}

	const unbindMovementEvents = bindLiveMapMovementEvents(map, {
		onMove: scheduleViewChange,
		onDrag: scheduleViewChange,
		onZoom: scheduleViewChange,
		onMoveEnd: handleMoveEnd,
		onZoomEnd: handleZoomEnd
	});

	return () => {
		unbindMovementEvents();
		liveViewChange.cancel();
	};
}
