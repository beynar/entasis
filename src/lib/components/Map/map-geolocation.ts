import type { MapGeolocationConfig, MapUserLocation } from './map-types.js';
import type { MapLibreMap } from './maplibre-types.js';

const DEFAULT_GEOLOCATION_ZOOM = 14;
const GEOLOCATION_OPTIONS: PositionOptions = {
	enableHighAccuracy: true,
	maximumAge: 0,
	timeout: 10000
};

export type ResolvedMapGeolocationConfig = {
	enabled: boolean;
	watch: boolean;
	zoom: number | undefined;
	showMarker: boolean;
};

type WatchMapUserLocationOptions = {
	onlocation: (location: MapUserLocation) => void;
	onError: (error: Error) => void;
};

function toMapUserLocation(position: GeolocationPosition): MapUserLocation {
	return {
		lngLat: [position.coords.longitude, position.coords.latitude],
		accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null
	};
}

function toGeolocationError(error: GeolocationPositionError): Error {
	return new Error(error.message || 'Browser geolocation failed.');
}

export function resolveMapGeolocationConfig(
	geolocation: boolean | MapGeolocationConfig | undefined
): ResolvedMapGeolocationConfig {
	if (!geolocation) {
		return {
			enabled: false,
			watch: false,
			zoom: undefined,
			showMarker: true
		};
	}

	if (geolocation === true) {
		return {
			enabled: true,
			watch: false,
			zoom: undefined,
			showMarker: true
		};
	}

	return {
		enabled: geolocation.enabled ?? true,
		watch: geolocation.watch ?? false,
		zoom: geolocation.zoom,
		showMarker: geolocation.showMarker ?? true
	};
}

export function getCurrentMapUserLocation(): Promise<MapUserLocation> {
	if (!navigator.geolocation) {
		return Promise.reject(new Error('Browser geolocation is not available.'));
	}

	return new Promise((resolve, reject) => {
		navigator.geolocation.getCurrentPosition(
			(position) => {
				resolve(toMapUserLocation(position));
			},
			(error) => {
				reject(toGeolocationError(error));
			},
			GEOLOCATION_OPTIONS
		);
	});
}

export function watchMapUserLocation({
	onlocation,
	onError
}: WatchMapUserLocationOptions): () => void {
	if (!navigator.geolocation) {
		onError(new Error('Browser geolocation is not available.'));
		return () => {};
	}

	const watchId = navigator.geolocation.watchPosition(
		(position) => onlocation(toMapUserLocation(position)),
		(error) => onError(toGeolocationError(error)),
		GEOLOCATION_OPTIONS
	);

	return () => navigator.geolocation.clearWatch(watchId);
}

export function getMapGeolocationZoom(map: MapLibreMap, zoom: number | undefined): number {
	if (zoom !== undefined) {
		return Math.min(map.getMaxZoom(), zoom);
	}

	return Math.min(map.getMaxZoom(), Math.max(map.getZoom(), DEFAULT_GEOLOCATION_ZOOM));
}
