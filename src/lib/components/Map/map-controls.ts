import type { MapControlAction } from './map-types.js';
import { en, type Messages } from '$lib/i18n/en.js';

export const DEFAULT_MAP_CONTROL_ACTIONS: MapControlAction[] = [
	'zoom-in',
	'zoom-out',
	'fit-markers',
	'geolocate',
	'reset'
];

export function resolveMapControlActions(controls: true | MapControlAction[]): MapControlAction[] {
	return controls === true ? DEFAULT_MAP_CONTROL_ACTIONS : [...new Set(controls)];
}

export function getMapControlActionLabel(
	action: MapControlAction,
	messages: Messages = en
): string {
	switch (action) {
		case 'zoom-in':
			return messages.zoomIn;
		case 'zoom-out':
			return messages.zoomOut;
		case 'fit-markers':
			return messages.fitMarkers;
		case 'geolocate':
			return messages.showUserLocation;
		case 'reset':
			return messages.resetMapView;
	}
}

export function isMapControlActionDisabled(action: MapControlAction, markerCount: number): boolean {
	return action === 'fit-markers' && markerCount === 0;
}
