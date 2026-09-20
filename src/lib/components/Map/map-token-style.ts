import { mix as mixSrgb } from 'colorizr';
import { observeThemeTokens } from '$lib/utils/observeThemeTokens.js';
import { toMapLibreColor } from './map-css-color.js';
import type { MapLibreStyleSpecification } from './maplibre-types.js';

const POSITRON_STYLE_URL = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

type MapStyleColorName =
	| 'background'
	| 'backgroundMuted'
	| 'landcover'
	| 'residential'
	| 'road'
	| 'roadCase'
	| 'detail'
	| 'building'
	| 'boundary'
	| 'label'
	| 'water'
	| 'waterLine'
	| 'waterLabel'
	| 'poi'
	| 'halo';

type MapStyleColors = Record<MapStyleColorName, string>;

const FALLBACK_COLORS: MapStyleColors = {
	background: '#fafaf8',
	backgroundMuted: '#f5f5f3',
	landcover: 'rgb(234, 241, 233)',
	residential: 'rgb(237, 237, 237)',
	road: '#fff',
	roadCase: '#ddd',
	detail: '#e6e6e6',
	building: '#ededed',
	boundary: '#ead5d7',
	label: '#697b89',
	water: '#d4dadc',
	waterLine: '#d1dbdf',
	waterLabel: '#7a96a0',
	poi: '#7d9c83',
	halo: 'rgba(255,255,255,0.5)'
};

const POSITRON_COLOR_MAP: Record<string, MapStyleColorName> = {
	'#fafaf8': 'background',
	'#f5f5f3': 'backgroundMuted',
	'#fff': 'road',
	'#ffffff': 'road',
	'#fdfdfd': 'road',
	'#eee': 'road',
	'#eeeeee': 'road',
	'#e6e6e6': 'detail',
	'#ededed': 'building',
	'#e8e8e8': 'building',
	'#f3efed': 'roadCase',
	'#ead5d7': 'boundary',
	'#e1c5c7': 'boundary',
	'#f2e6e7': 'boundary',
	'#ebd6d8': 'boundary',
	'#ddd': 'roadCase',
	'#dddddd': 'roadCase',
	'#dfdfdf': 'roadCase',
	'#d5d5d5': 'roadCase',
	'#d4dadc': 'water',
	'#d1dbdf': 'waterLine',
	'#abb6be': 'waterLabel',
	'#7a96a0': 'waterLabel',
	'#697b89': 'label',
	'#838383': 'label',
	'#97a4ae': 'label',
	'#8a99a4': 'label',
	'#a1adb6': 'label',
	'#b9c2c9': 'label',
	'#7d9c83': 'poi',
	'rgba(238,238,238,1)': 'road',
	'rgba(255,255,255,0.5)': 'halo'
};

let positronStylePromise: Promise<MapLibreStyleSpecification> | null = null;

export async function createTokenizedPositronStyle(root: HTMLElement): Promise<{
	style: MapLibreStyleSpecification;
	signature: string;
}> {
	const style = await loadPositronStyle();
	const colors = readMapStyleColors(root);
	const themedStyle = replaceStyleColors(style, colors) as MapLibreStyleSpecification;
	themedStyle.name = 'Svelte Pro Positron';
	return { style: themedStyle, signature: createMapStyleSignature(colors) };
}

export function bindMapStyleTokenChanges(root: HTMLElement, callback: () => void): () => void {
	let tokenSignature = createMapStyleSignature(readMapStyleColors(root));
	return observeThemeTokens(() => {
		const nextSignature = createMapStyleSignature(readMapStyleColors(root));
		if (nextSignature === tokenSignature) return;
		tokenSignature = nextSignature;
		callback();
	});
}

async function loadPositronStyle(): Promise<MapLibreStyleSpecification> {
	positronStylePromise ??= fetchPositronStyle().catch((error: unknown) => {
		positronStylePromise = null;
		throw error;
	});
	return positronStylePromise;
}

async function fetchPositronStyle(): Promise<MapLibreStyleSpecification> {
	const response = await fetch(POSITRON_STYLE_URL);
	if (!response.ok) {
		throw new Error(`Failed to load Positron map style from ${POSITRON_STYLE_URL}.`);
	}

	const style: unknown = await response.json();
	if (!isMapLibreStyle(style)) {
		throw new Error('Positron map style response is not a valid MapLibre style.');
	}

	return style;
}

function isMapLibreStyle(value: unknown): value is MapLibreStyleSpecification {
	return (
		typeof value === 'object' &&
		value !== null &&
		'version' in value &&
		(value as { version: unknown }).version === 8 &&
		'sources' in value &&
		typeof (value as { sources: unknown }).sources === 'object' &&
		'layers' in value &&
		Array.isArray((value as { layers: unknown }).layers)
	);
}

function readMapStyleColors(root: HTMLElement): MapStyleColors {
	const probe = document.createElement('span');
	probe.style.position = 'fixed';
	probe.style.pointerEvents = 'none';
	probe.style.opacity = '0';
	root.append(probe);

	try {
		const tokens = readMapStyleTokens(probe);
		// entasis's Theme writes `color-scheme: dark` on <html> for every dark theme —
		// including custom-named ones (data-theme="midnight") — so read that first, and
		// fall back to the `.dark` / data-theme="dark" defaults.
		const root = document.documentElement;
		const isDarkScheme =
			getComputedStyle(root).colorScheme === 'dark' ||
			root.classList.contains('dark') ||
			root.getAttribute('data-theme') === 'dark';
		return deriveMapStyleColors(tokens, isDarkScheme ? 'dark' : 'light');
	} finally {
		probe.remove();
	}
}

// Each cartographic role is a fixed-weight sRGB mix of the surface with one semantic
// token, so a palette or theme change shows on the map instead of collapsing back to
// grey: the brand `primary` tints land, buildings and water (a monochrome basemap),
// `success` paints parks and points of interest, `danger` draws boundaries, and
// `neutral` carries roads and labels. Weights mirror Positron's tonal hierarchy.
type MapStyleTokens = Record<'surface' | 'neutral' | 'primary' | 'success' | 'danger', string>;
type MapStyleMix = readonly [token: keyof MapStyleTokens, weight: number];
type MapStyleRecipe = Record<Exclude<MapStyleColorName, 'background' | 'halo'>, MapStyleMix>;

const LIGHT_RECIPE: MapStyleRecipe = {
	backgroundMuted: ['primary', 0.04],
	landcover: ['success', 0.1],
	residential: ['primary', 0.06],
	road: ['neutral', 0.03],
	roadCase: ['neutral', 0.12],
	detail: ['neutral', 0.08],
	building: ['primary', 0.1],
	boundary: ['danger', 0.24],
	label: ['neutral', 0.62],
	water: ['primary', 0.18],
	waterLine: ['primary', 0.28],
	waterLabel: ['primary', 0.7],
	poi: ['success', 0.4]
};

const DARK_RECIPE: MapStyleRecipe = {
	backgroundMuted: ['primary', 0.08],
	landcover: ['success', 0.14],
	residential: ['primary', 0.1],
	road: ['neutral', 0.1],
	roadCase: ['neutral', 0.18],
	detail: ['neutral', 0.08],
	building: ['primary', 0.14],
	boundary: ['danger', 0.34],
	label: ['neutral', 0.62],
	water: ['primary', 0.3],
	waterLine: ['primary', 0.42],
	waterLabel: ['primary', 0.8],
	poi: ['success', 0.5]
};

function readMapStyleTokens(probe: HTMLElement): MapStyleTokens {
	return {
		surface: readCssColor(probe, 'var(--color-surface)', FALLBACK_COLORS.background),
		neutral: readCssColor(probe, 'var(--color-neutral)', FALLBACK_COLORS.label),
		primary: readCssColor(probe, 'var(--color-primary)', FALLBACK_COLORS.water),
		success: readCssColor(probe, 'var(--color-success)', FALLBACK_COLORS.poi),
		danger: readCssColor(probe, 'var(--color-danger)', FALLBACK_COLORS.boundary)
	};
}

/** Pure derivation, exported for tests; `readMapStyleColors` feeds it the live tokens. */
export function deriveMapStyleColors(
	tokens: MapStyleTokens,
	scheme: 'light' | 'dark'
): MapStyleColors {
	const recipe = scheme === 'dark' ? DARK_RECIPE : LIGHT_RECIPE;
	const mixed = Object.fromEntries(
		Object.entries(recipe).map(([role, [token, weight]]) => [
			role,
			mixSrgb(tokens.surface, tokens[token], weight, { space: 'rgb', format: 'rgb' })
		])
	) as Omit<MapStyleColors, 'background' | 'halo'>;
	return {
		background: tokens.surface,
		...mixed,
		halo: withAlpha(tokens.surface, scheme === 'dark' ? 0.64 : 0.76)
	};
}

function readCssColor(probe: HTMLElement, expression: string, fallback: string): string {
	// Seed a sentinel first: if `expression` references an undefined var(), the
	// color-mix() is invalid-at-computed-value-time and the assignment is rejected,
	// leaving the sentinel in place. That lets us return the intended FALLBACK_COLORS
	// instead of the inherited black that an unresolved token would otherwise yield.
	const SENTINEL = 'rgb(255, 0, 1)';
	probe.style.color = SENTINEL;
	probe.style.color = `color-mix(in srgb, ${expression} 100%, transparent)`;
	const resolved = getComputedStyle(probe).color;
	if (resolved === SENTINEL) return fallback;
	return toMapLibreColor(resolved) ?? fallback;
}

function replaceStyleColors(value: unknown, colors: MapStyleColors): unknown {
	if (typeof value === 'string') {
		const color = normalizeStyleColor(value);
		return getDynamicStyleColor(color, colors) ?? colors[POSITRON_COLOR_MAP[color]] ?? value;
	}

	if (Array.isArray(value)) {
		return value.map((item) => replaceStyleColors(item, colors));
	}

	if (typeof value === 'object' && value !== null) {
		return Object.fromEntries(
			Object.entries(value).map(([key, item]) => [key, replaceStyleColors(item, colors)])
		);
	}

	return value;
}

function getDynamicStyleColor(color: string, colors: MapStyleColors): string | undefined {
	const residentialMatch = /^rgba\(237,237,237,([\d.]+)\)$/.exec(color);
	if (residentialMatch) return withAlpha(colors.residential, Number(residentialMatch[1]));
	if (color === 'rgba(234,241,233,0.5)') return withAlpha(colors.landcover, 0.5);
}

function withAlpha(color: string, alpha: number): string {
	// Accepts both `rgb(r, g, b)` (computed styles) and `rgb(r g b)` (colorizr output).
	const match = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(color);
	if (!match || !Number.isFinite(alpha)) return color;
	return `rgba(${match[1].trim()}, ${match[2].trim()}, ${match[3].trim()}, ${alpha})`;
}

function normalizeStyleColor(color: string): string {
	return color.toLowerCase().replace(/\s+/g, '');
}

function createMapStyleSignature(colors: MapStyleColors): string {
	return Object.entries(colors)
		.map(([name, color]) => `${name}:${color}`)
		.join('|');
}
