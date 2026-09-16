import type {
	MapLibreInteractionOptions,
	MapLibreMap,
	MapLibreInteractionHandler
} from './maplibre-types.js';

const mapInteractionHandlers = [
	'scrollZoom',
	'boxZoom',
	'dragRotate',
	'dragPan',
	'keyboard',
	'doubleClickZoom',
	'touchZoomRotate',
	'touchPitch'
] as const;

type MapInteractionHandlerName = (typeof mapInteractionHandlers)[number];

type MapLibreMapWithInteractions = MapLibreMap &
	Partial<Record<MapInteractionHandlerName, MapLibreInteractionHandler>>;

export function getMapInteractionOptions(
	interactive: boolean | undefined
): MapLibreInteractionOptions {
	if (interactive !== false) {
		return {};
	}

	return Object.fromEntries(mapInteractionHandlers.map((handlerName) => [handlerName, false]));
}

export function applyMapInteractivity(map: MapLibreMap, interactive: boolean | undefined): void {
	const shouldEnableInteractions = interactive !== false;
	const mapWithInteractions = map as MapLibreMapWithInteractions;

	for (const handlerName of mapInteractionHandlers) {
		const handler = mapWithInteractions[handlerName];
		if (!handler) continue;
		if (shouldEnableInteractions) {
			handler.enable();
		} else {
			handler.disable();
		}
	}
}
