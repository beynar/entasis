import type { MapLibreLibrary } from './maplibre-types.js';

const MAPLIBRE_CDN_VERSION = '5.24.0';
const MAPLIBRE_SCRIPT_ID = 'svelte-pro-maplibre-script';
const MAPLIBRE_STYLE_ID = 'svelte-pro-maplibre-style';
const MAPLIBRE_SCRIPT_URL = `https://cdn.jsdelivr.net/npm/maplibre-gl@${MAPLIBRE_CDN_VERSION}/dist/maplibre-gl.js`;
const MAPLIBRE_STYLE_URL = `https://cdn.jsdelivr.net/npm/maplibre-gl@${MAPLIBRE_CDN_VERSION}/dist/maplibre-gl.css`;

type MapLibreWindow = Window & {
	maplibregl?: MapLibreLibrary;
};

let mapLibrePromise: Promise<MapLibreLibrary> | null = null;

export function loadMapLibreFromCdn(): Promise<MapLibreLibrary> {
	if (typeof window === 'undefined' || typeof document === 'undefined') {
		return Promise.reject(new Error('MapLibre can only be loaded in a browser.'));
	}

	ensureMapLibreStyle();

	const existingMapLibre = readWindowMapLibre();

	if (existingMapLibre) {
		return Promise.resolve(existingMapLibre);
	}

	mapLibrePromise ??= createMapLibreScriptPromise().catch((error: unknown) => {
		mapLibrePromise = null;
		throw error;
	});

	return mapLibrePromise;
}

function ensureMapLibreStyle(): void {
	if (document.getElementById(MAPLIBRE_STYLE_ID)) {
		return;
	}

	const link = document.createElement('link');
	link.id = MAPLIBRE_STYLE_ID;
	link.rel = 'stylesheet';
	link.href = MAPLIBRE_STYLE_URL;
	document.head.append(link);
}

function createMapLibreScriptPromise(): Promise<MapLibreLibrary> {
	return new Promise((resolve, reject) => {
		const existingScript = document.getElementById(MAPLIBRE_SCRIPT_ID);
		const script =
			existingScript instanceof HTMLScriptElement ? existingScript : createMapLibreScript();

		script.addEventListener(
			'load',
			() => {
				script.dataset.status = 'loaded';
				const mapLibre = readWindowMapLibre();

				if (!mapLibre) {
					script.remove();
					reject(new Error('MapLibre CDN script loaded without exposing window.maplibregl.'));
					return;
				}

				resolve(mapLibre);
			},
			{ once: true }
		);
		script.addEventListener(
			'error',
			() => {
				script.remove();
				reject(new Error(`Failed to load MapLibre from ${MAPLIBRE_SCRIPT_URL}.`));
			},
			{ once: true }
		);

		if (!existingScript) {
			document.head.append(script);
		}
	});
}

function createMapLibreScript(): HTMLScriptElement {
	const script = document.createElement('script');
	script.id = MAPLIBRE_SCRIPT_ID;
	script.src = MAPLIBRE_SCRIPT_URL;
	script.async = true;
	script.dataset.status = 'loading';
	return script;
}

function readWindowMapLibre(): MapLibreLibrary | null {
	const mapLibre = (window as MapLibreWindow).maplibregl;

	if (!mapLibre || typeof mapLibre.Map !== 'function' || typeof mapLibre.Marker !== 'function') {
		return null;
	}

	return mapLibre;
}
