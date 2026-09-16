import type { MapMarkerFeatureCollection } from './map-data.js';
import type { MapShapeFeatureCollection } from './map-shapes.js';

export type MapLibreLngLat = [number, number];
export type MapLibreBounds = [number, number, number, number];
export type MapLibreControlPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type MapLibreErrorEvent = {
	error?: unknown;
};

export type MapLibreMapSourceDataEvent = {
	sourceId?: string;
	isSourceLoaded?: boolean;
};

export type MapLibreFeatureProperties = Record<string, unknown> | null | undefined;

export type MapLibrePointGeometry = {
	type: string;
	coordinates?: number[];
};

export type MapLibreMapGeoJSONFeature = {
	geometry: MapLibrePointGeometry;
	properties: Record<string, unknown>;
};

export type MapLibreClusterLeafFeature = {
	properties?: MapLibreFeatureProperties;
};

export type MapLibreFeatureCollection = {
	type: 'FeatureCollection';
	features: unknown[];
};

export type MapLibreGeoJSONData =
	MapMarkerFeatureCollection | MapShapeFeatureCollection | MapLibreFeatureCollection;

export type MapLibrePlainGeoJSONSource = {
	type: 'geojson';
	setData(data: MapLibreGeoJSONData): void;
};

export type MapLibreGeoJSONSource = {
	type: 'geojson';
	setData(data: MapLibreGeoJSONData): void;
	setClusterOptions(options: {
		cluster: true;
		clusterRadius: number;
		clusterMaxZoom: number;
	}): void;
	getClusterLeaves(
		clusterId: number,
		limit: number,
		offset: number
	): Promise<MapLibreClusterLeafFeature[]>;
	getClusterExpansionZoom(clusterId: number): Promise<number>;
};

export type MapLibreGeoJSONSourceSpecification = {
	type: 'geojson';
	data: MapLibreGeoJSONData;
	cluster?: boolean;
	clusterRadius?: number;
	clusterMaxZoom?: number;
};

export type MapLibreLayerSpecification = {
	id: string;
	type: 'circle' | 'fill' | 'line';
	source: string;
	layout?: Record<string, string | number | boolean>;
	paint: Record<string, string | number>;
};

export type MapLibreStyleSpecification = Record<string, unknown> & {
	version: number;
	sources: Record<string, unknown>;
	layers: unknown[];
};

export type MapLibreStyle = string | MapLibreStyleSpecification;

export type MapLibreInteractionHandler = {
	enable(): void;
	disable(): void;
};

export type MapLibreInteractionOptions = {
	scrollZoom?: boolean;
	boxZoom?: boolean;
	dragRotate?: boolean;
	dragPan?: boolean;
	keyboard?: boolean;
	doubleClickZoom?: boolean;
	touchZoomRotate?: boolean;
	touchPitch?: boolean;
};

export type MapLibreMapOptions = {
	container: HTMLElement;
	style: MapLibreStyle;
	center: MapLibreLngLat;
	zoom: number;
	minZoom?: number;
	maxZoom?: number;
	attributionControl?: unknown;
} & MapLibreInteractionOptions;

export type MapLibreFitBoundsOptions = {
	padding?: number;
};

export type MapLibreLngLatObject = {
	lng: number;
	lat: number;
};

export type MapLibreLngLatBoundsObject = {
	getWest(): number;
	getSouth(): number;
	getEast(): number;
	getNorth(): number;
};

export type MapLibreEaseToOptions = {
	center: MapLibreLngLat;
	zoom: number;
};

export type MapLibreControl = {
	onAdd(map: MapLibreMap): HTMLElement;
	onRemove(map: MapLibreMap): void;
	getDefaultPosition?(): MapLibreControlPosition;
};

export type MapLibreMap = {
	on(type: 'error', listener: (event: MapLibreErrorEvent) => void): MapLibreMap;
	on(type: 'sourcedata', listener: (event: MapLibreMapSourceDataEvent) => void): MapLibreMap;
	on(type: string, listener: () => void): MapLibreMap;
	once(type: string, listener: () => void): MapLibreMap;
	off(type: 'error', listener: (event: MapLibreErrorEvent) => void): MapLibreMap;
	off(type: 'sourcedata', listener: (event: MapLibreMapSourceDataEvent) => void): MapLibreMap;
	off(type: string, listener: () => void): MapLibreMap;
	remove(): void;
	setStyle(style: MapLibreStyle): void;
	setCenter(center: MapLibreLngLat): void;
	setZoom(zoom: number): void;
	setMinZoom(zoom: number | null): void;
	setMaxZoom(zoom: number | null): void;
	getCenter(): MapLibreLngLatObject;
	getZoom(): number;
	getBounds(): MapLibreLngLatBoundsObject;
	getBearing(): number;
	getPitch(): number;
	getMaxZoom(): number;
	zoomIn(): void;
	zoomOut(): void;
	easeTo(options: MapLibreEaseToOptions): void;
	fitBounds(bounds: MapLibreBounds, options?: MapLibreFitBoundsOptions): void;
	addControl(control: MapLibreControl, position?: MapLibreControlPosition): void;
	removeControl(control: MapLibreControl): void;
	isStyleLoaded(): boolean;
	isSourceLoaded(sourceId: string): boolean;
	getSource(sourceId: string): { type?: string } | undefined;
	getLayer(layerId: string): unknown;
	addSource(sourceId: string, source: MapLibreGeoJSONSourceSpecification): void;
	addLayer(layer: MapLibreLayerSpecification): void;
	removeLayer(layerId: string): void;
	removeSource(sourceId: string): void;
	queryRenderedFeatures(options: { layers: string[] }): MapLibreMapGeoJSONFeature[];
	scrollZoom?: MapLibreInteractionHandler;
	boxZoom?: MapLibreInteractionHandler;
	dragRotate?: MapLibreInteractionHandler;
	dragPan?: MapLibreInteractionHandler;
	keyboard?: MapLibreInteractionHandler;
	doubleClickZoom?: MapLibreInteractionHandler;
	touchZoomRotate?: MapLibreInteractionHandler;
	touchPitch?: MapLibreInteractionHandler;
};

export type MapLibreMarkerOptions = {
	element: HTMLElement;
	anchor: 'bottom' | 'center';
};

export type MapLibreMarker = {
	setLngLat(lngLat: MapLibreLngLat): MapLibreMarker;
	addTo(map: MapLibreMap): MapLibreMarker;
	remove(): void;
};

export type MapLibreMarkerConstructor = new (options: MapLibreMarkerOptions) => MapLibreMarker;

export type MapLibreLibrary = {
	Map: new (options: MapLibreMapOptions) => MapLibreMap;
	Marker: MapLibreMarkerConstructor;
};
