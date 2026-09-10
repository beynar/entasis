import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { MapClusterOptions } from './map-cluster.js';
import type { MapMarker } from './map-data.js';
import type {
	MapLibreControlPosition,
	MapLibreMap,
	MapLibreMapGeoJSONFeature
} from './maplibre-types.js';

export type MapStyleTheme = 'dark' | 'positron';
export type MapBounds = [number, number, number, number] | [[number, number], [number, number]];
export type MapClusterConfig = MapClusterOptions;
export type MapControlAction = 'zoom-in' | 'zoom-out' | 'fit-markers' | 'geolocate' | 'reset';
export type MapControlPosition = MapLibreControlPosition;
export type MapStyleOverrides = Partial<Record<MapStyleTheme, string>>;

export type MapGeolocationConfig = {
	enabled?: boolean;
	watch?: boolean;
	zoom?: number;
	showMarker?: boolean;
};

export type MapUserLocation = {
	lngLat: [number, number];
	accuracy: number | null;
};

export type MapUserLocationSnippetArg = MapUserLocation & {
	map: MapLibreMap;
};

export type MapViewChangeArg = {
	map: MapLibreMap;
	center: [number, number];
	zoom: number;
	bounds: [number, number, number, number];
	bearing: number;
	pitch: number;
};

export type MapMarkerSnippetArg<TData = unknown> = {
	marker: MapMarker<TData>;
	data: TData | undefined;
	map: MapLibreMap;
	lngLat: [number, number];
};

export type MapMarkerPopupContentArg<TData = unknown> = MapMarkerSnippetArg<TData> & {
	open: boolean;
	close: () => void;
};

export type MapMarkerTooltipContentArg<TData = unknown> = MapMarkerSnippetArg<TData> & {
	open: boolean;
};

export type MapClusterSnippetArg<TData = unknown> = {
	id: string;
	count: number;
	coordinates: [number, number];
	map: MapLibreMap;
	expand: () => void;
	markers: MapMarker<TData>[];
	data: TData[];
	feature: MapLibreMapGeoJSONFeature;
};

export type MapControlButtonSnippetArg = {
	action: MapControlAction;
	label: string;
	disabled: boolean;
	active: boolean;
	onclick: (event: MouseEvent) => void;
};

type MapShapeBase = {
	id: string | number;
	label?: string;
	color?: string;
	opacity?: number;
	visible?: boolean;
};

export type MapCircleShape = MapShapeBase & {
	type: 'circle';
	center: [number, number];
	radiusMeters: number;
};

export type MapPolylineShape = MapShapeBase & {
	type: 'polyline';
	coordinates: [number, number][];
	width?: number;
};

export type MapPolygonShape = MapShapeBase & {
	type: 'polygon';
	coordinates: [number, number][] | [number, number][][];
	fill?: string;
	stroke?: string;
};

export type MapRectangleShape = MapShapeBase & {
	type: 'rectangle';
	bounds: MapBounds;
	fill?: string;
	stroke?: string;
};

export type MapShape = MapCircleShape | MapPolylineShape | MapPolygonShape | MapRectangleShape;

export type MapProps<TData = unknown> = Omit<
	HTMLAttributes<HTMLDivElement>,
	'children' | 'class'
> & {
	/** Markers to display, with coordinates and consumer data. */
	markers: MapMarker<TData>[];
	/** MapLibre style document URL used instead of the built-in style. */
	styleUrl?: string;
	/** Style URL overrides for the supported light and dark themes. */
	styles?: MapStyleOverrides;
	/** Initial map center as longitude and latitude. */
	center?: [number, number];
	/** Initial map zoom level. */
	zoom?: number;
	/** Geographic bounds used to fit the initial viewport. */
	bounds?: MapBounds;
	/** Lowest allowed zoom level. */
	minZoom?: number;
	/** Highest allowed zoom level. */
	maxZoom?: number;
	/** Fit the initial viewport to the supplied markers. */
	fitMarkersOnMount?: boolean;
	/** Padding in pixels when fitting the viewport to markers. */
	fitMarkersPadding?: number;
	/** Allow pointer, touch, and keyboard interaction. */
	interactive?: boolean;
	/** Display the map provider attribution. */
	showAttribution?: boolean;
	/** Enable and configure grouping of nearby markers. */
	cluster?: boolean | MapClusterConfig;
	/** Show the default map controls or choose an ordered set of actions. */
	controls?: boolean | MapControlAction[];
	/** Corner used to place the map controls. */
	controlPosition?: MapControlPosition;
	/** Enable and configure the browser location control. */
	geolocation?: boolean | MapGeolocationConfig;
	/** Custom marker snippet for the resolved browser location. */
	userLocationMarker?: Snippet<[MapUserLocationSnippetArg]>;
	/** Custom content for individual markers. */
	marker?: Snippet<[MapMarkerSnippetArg<TData>]>;
	/** Custom content for clustered markers. */
	clusterMarker?: Snippet<[MapClusterSnippetArg<TData>]>;
	/** Custom rendering for a map control action. */
	controlButton?: Snippet<[MapControlButtonSnippetArg]>;
	/** Enable or customize content opened from a marker. */
	popup?: boolean | Snippet<[MapMarkerPopupContentArg<TData>]>;
	/** Enable or customize marker hover content. */
	tooltip?: boolean | Snippet<[MapMarkerTooltipContentArg<TData>]>;
	/** Geographic circles, lines, polygons, and rectangles to overlay. */
	shapes?: MapShape[];
	/** Called when a marker is activated, with its domain marker value. */
	onMarkerClick?: (marker: MapMarker<TData>) => void;
	/** Called when a cluster is activated, with its members and geometry. */
	onClusterClick?: (cluster: MapClusterSnippetArg<TData>) => void;
	/** Called when the MapLibre instance is ready for consumer use. */
	onReady?: (map: MapLibreMap) => void;
	/** Called with the current map viewport during movement. */
	onViewChange?: (view: MapViewChangeArg) => void;
	/** Called with the viewport when map movement ends. */
	onMoveEnd?: (view: MapViewChangeArg) => void;
	/** Called with the viewport when zooming ends. */
	onZoomEnd?: (view: MapViewChangeArg) => void;
	/** Receives a map operation failure; unhandled failures are thrown. */
	onError?: (error: Error) => void;
	/** Additional classes on the map root element. */
	class?: string;
};
