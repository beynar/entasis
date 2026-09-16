export type MapMarker<TData = unknown> = {
	id: string | number;
	lng: number;
	lat: number;
	label?: string;
	description?: string;
	popup?: string;
	tooltip?: string;
	color?: string;
	data?: TData;
};

export type MapMarkerFeature = {
	type: 'Feature';
	id: MapMarker['id'];
	geometry: {
		type: 'Point';
		coordinates: [number, number];
	};
	properties: {
		markerId: string;
	};
};

export type MapMarkerFeatureCollection = {
	type: 'FeatureCollection';
	features: MapMarkerFeature[];
};

export type NormalizedMapMarkers<TData = unknown> = {
	featureCollection: MapMarkerFeatureCollection;
	markerLookup: Map<string, MapMarker<TData>>;
	sourceSignature: string;
};

export function normalizeMapMarkers<TData>(
	markers: readonly MapMarker<TData>[]
): NormalizedMapMarkers<TData> {
	if (!Array.isArray(markers)) {
		throw new Error('Map markers must be an array.');
	}

	const markerLookup = new Map<string, MapMarker<TData>>();
	const features: MapMarkerFeature[] = [];
	const sourceSignatureParts: string[] = [];

	for (const [index, marker] of markers.entries()) {
		const markerId = validateMarkerId(marker.id, index);
		const lookupId = String(markerId);

		if (markerLookup.has(lookupId)) {
			throw new Error(`Duplicate map marker id "${lookupId}" at index ${index}.`);
		}

		const lng = validateCoordinate(marker.lng, 'lng', -180, 180, lookupId, index);
		const lat = validateCoordinate(marker.lat, 'lat', -90, 90, lookupId, index);

		markerLookup.set(lookupId, marker);
		sourceSignatureParts.push(`${lookupId.length}:${lookupId}:${lng}:${lat}`);
		features.push({
			type: 'Feature',
			id: markerId,
			geometry: {
				type: 'Point',
				coordinates: [lng, lat]
			},
			properties: {
				markerId: lookupId
			}
		});
	}

	return {
		featureCollection: {
			type: 'FeatureCollection',
			features
		},
		sourceSignature: sourceSignatureParts.join('|'),
		markerLookup
	};
}

function validateMarkerId(
	markerId: MapMarker['id'] | null | undefined,
	index: number
): MapMarker['id'] {
	if (markerId === null || markerId === undefined) {
		throw new Error(`Map marker at index ${index} must include a non-null id.`);
	}

	return markerId;
}

function validateCoordinate(
	value: number,
	name: 'lng' | 'lat',
	min: number,
	max: number,
	markerId: string,
	index: number
): number {
	if (!Number.isFinite(value)) {
		throw new Error(
			`Map marker "${markerId}" at index ${index} has invalid ${name}: expected a finite number.`
		);
	}

	if (value < min || value > max) {
		throw new Error(
			`Map marker "${markerId}" at index ${index} has invalid ${name}: expected ${min} to ${max}, received ${value}.`
		);
	}

	return value;
}
