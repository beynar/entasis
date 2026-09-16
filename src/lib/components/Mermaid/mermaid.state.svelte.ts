import { observeThemeTokens } from '$lib/utils/observeThemeTokens.js';
import { createId } from '$lib/utils/id.js';
import { createBindableStateClass } from '$lib/utils/state.svelte.js';
import { usePanzoom } from '$lib/utils/usePanzoom.svelte.js';
import { onDestroy, untrack } from 'svelte';
import { on } from 'svelte/events';
import { useTheme } from '../Theme/theme.state.svelte.js';
import type { MermaidProps } from './mermaid.props.js';

// mermaid is loaded from cdnjs at runtime and never bundled with the component,
// so we declare the minimal structural types we use rather than depending on the
// `mermaid` npm type package. Bump this single const to any version cdnjs hosts
// to upgrade mermaid (mirrors the pinned PDF.js runtime in DocumentViewer).
const MERMAID_CDN_VERSION = '11.12.0';
// The self-contained UMD build. NOT the ESM `.mjs` — mermaid's ESM is split into
// sibling chunks that fail to resolve cross-origin from cdnjs.
const MERMAID_CDN = `https://cdnjs.cloudflare.com/ajax/libs/mermaid/${MERMAID_CDN_VERSION}/mermaid.min.js`;

/** The subset of mermaid's config we set. Extra keys are allowed and forwarded. */
export interface MermaidConfig {
	theme?: 'base' | 'default' | 'dark' | 'forest' | 'neutral' | 'null';
	startOnLoad?: boolean;
	securityLevel?: 'strict' | 'loose' | 'antiscript' | 'sandbox';
	suppressErrorRendering?: boolean;
	fontFamily?: string;
	themeVariables?: Record<string, string>;
	flowchart?: { useMaxWidth?: boolean; htmlLabels?: boolean; curve?: string };
	[key: string]: unknown;
}

/** The minimal mermaid API surface this component calls. */
export interface MermaidModule {
	initialize(config: MermaidConfig): void;
	render(id: string, code: string): Promise<{ svg: string; bindFunctions?: (el: Element) => void }>;
}

// Module-level singleton: dedupes concurrent loads and repeat mounts. Reset to
// null on failure so a later mount can retry. Only ever touched client-side.
let mermaidPromise: Promise<MermaidModule> | null = null;

const loadMermaid = (): Promise<MermaidModule> => {
	if (typeof window === 'undefined') {
		return Promise.reject(new Error('mermaid can only be loaded in the browser'));
	}
	const w = window as unknown as { mermaid?: MermaidModule };
	if (w.mermaid) return Promise.resolve(w.mermaid);
	if (mermaidPromise) return mermaidPromise;

	mermaidPromise = new Promise<MermaidModule>((resolve, reject) => {
		// Reuse a matching script tag if one already exists (added by another instance),
		// otherwise inject a fresh one. `scriptEl` is the element we are waiting on so
		// fail() can always remove it — a script that loaded but never defined
		// window.mermaid (corrupt/partial asset) must not be left behind, or a later
		// retry would attach listeners to an already-fired, dead <script> and hang.
		const existing = document.querySelector<HTMLScriptElement>(
			`script[data-mermaid-cdn="${MERMAID_CDN_VERSION}"]`
		);
		const scriptEl = existing ?? document.createElement('script');
		const settle = () => {
			clearTimeout(timeout);
			if (w.mermaid) resolve(w.mermaid);
			else fail(new Error('mermaid loaded but window.mermaid is undefined'));
		};
		const fail = (err: Error) => {
			clearTimeout(timeout);
			scriptEl.remove();
			mermaidPromise = null; // allow a retry on the next mount
			reject(err);
		};
		// Wall-clock guard: a stalled cdnjs request may never fire load/error.
		const timeout = setTimeout(() => fail(new Error('mermaid load timed out')), 30000);

		if (existing) {
			if (w.mermaid) {
				clearTimeout(timeout);
				return resolve(w.mermaid);
			}
			existing.addEventListener('load', settle, { once: true });
			existing.addEventListener(
				'error',
				() => fail(new Error('Failed to load mermaid from cdnjs')),
				{
					once: true
				}
			);
			return;
		}
		scriptEl.src = MERMAID_CDN;
		scriptEl.async = true;
		scriptEl.crossOrigin = 'anonymous';
		scriptEl.dataset.mermaidCdn = MERMAID_CDN_VERSION;
		scriptEl.addEventListener('load', settle, { once: true });
		scriptEl.addEventListener('error', () => fail(new Error('Failed to load mermaid from cdnjs')), {
			once: true
		});
		document.head.appendChild(scriptEl);
	});
	return mermaidPromise;
};

/**
 * Sanitize raw mermaid source. Defensive against copy/paste artefacts: BOM,
 * unicode normalization, zero-width + control chars, CRLF, HTML entities, smart
 * quotes, stray whitespace, flowchart arrow spacing and trailing semicolons.
 * Ported nearly verbatim from svelte-streamdown.
 */
export const sanitizeMermaidCode = (code: string): string => {
	try {
		let sanitized = code;

		// 1. Remove Byte Order Mark (BOM)
		sanitized = sanitized.replace(/^\uFEFF/, '');
		// 2. Normalize Unicode (NFC form for consistent rendering)
		sanitized = sanitized.normalize('NFC');
		// 3. Remove invisible/zero-width characters
		sanitized = sanitized.replace(/[\u200B-\u200F\u2028-\u202F\u205F-\u206F]/g, '');
		// 4. Remove control characters (except tab, line feed, carriage return)
		// eslint-disable-next-line no-control-regex -- stripping raw control characters is the point
		sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
		// 5. Normalize line endings to LF
		sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

		// 6. Decode common HTML entities that might appear in Mermaid code
		const htmlEntities: Record<string, string> = {
			'&lt;': '<',
			'&gt;': '>',
			'&amp;': '&',
			'&quot;': '"',
			'&#39;': "'",
			'&apos;': "'",
			'&nbsp;': ' ',
			'&hellip;': '...',
			'&mdash;': '--',
			'&ndash;': '-',
			'&lsquo;': "'",
			'&rsquo;': "'",
			'&ldquo;': '"',
			'&rdquo;': '"'
		};
		for (const [entity, replacement] of Object.entries(htmlEntities)) {
			sanitized = sanitized.replace(new RegExp(entity, 'g'), replacement);
		}

		// 7. Convert smart quotes and other quote variants to standard quotes
		sanitized = sanitized
			.replace(/[\u2018\u2019]/g, "'")
			.replace(/[\u201C\u201D]/g, '"')
			.replace(/[\u2013\u2014]/g, '-')
			.replace(/\u2026/g, '...');

		// 8. Trim each line and drop empty lines
		sanitized = sanitized
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line.length > 0)
			.join('\n');

		// 9. Collapse runs of spaces/tabs to a single space
		sanitized = sanitized.replace(/[ \t]+/g, ' ');
		// 10. Convert over-escaped double backslashes to single
		sanitized = sanitized.replace(/\\\\(?![\\"])/g, '\\');
		// 11. Normalize non-breaking / special spaces
		sanitized = sanitized.replace(/[\u00A0\u1680\u180E\u2000-\u200A\u202F\u205F\u3000]/g, ' ');
		// 12. Add a space after commas if missing
		sanitized = sanitized.replace(/,([^\s])/g, ', $1');
		// 13. Remove trailing semicolons that might break parsing
		sanitized = sanitized.replace(/;+\s*$/gm, '');
		// 14. Ensure proper spacing in flowchart arrow syntax
		sanitized = sanitized.replace(
			/([A-Za-z0-9_]+)(--|-->|-\.-|-\.->|==|==>|=\.=>|=\.->)/g,
			'$1 $2'
		);

		// 15. Final trim + single trailing newline
		sanitized = sanitized.trim();
		if (sanitized && !sanitized.endsWith('\n')) sanitized += '\n';
		return sanitized;
	} catch (error) {
		console.warn('Error during Mermaid code sanitization:', error);
		return code;
	}
};

// Map our --color-* design tokens onto mermaid themeVariables. mermaid reads
// these at initialize() time as concrete colors (not live CSS vars), so we
// resolve them from the DOM at render time and re-initialize on theme change.
//
// Our tokens resolve to `oklab()`/`color-mix()`, which mermaid's color parser
// rejects ("Unsupported color format"). So we resolve each token to a concrete
// computed color via a probe element, then normalize it to `#rrggbb`/`rgba()`
// through a canvas (which serializes any CSS color space to hex/rgb).
let colorProbe: HTMLElement | null = null;
let colorCtx: CanvasRenderingContext2D | null = null;

// Rasterize the color to a 1×1 canvas and read the pixel back: this forces any
// CSS color space (oklab, color-mix, etc.) down to concrete sRGB bytes we can hex.
// (A plain fillStyle round-trip keeps oklab as-is in Chrome, which mermaid rejects.)
const normalizeColor = (color: string): string | null => {
	if (!colorCtx) {
		const canvas = document.createElement('canvas');
		canvas.width = 1;
		canvas.height = 1;
		colorCtx = canvas.getContext('2d', { willReadFrequently: true });
	}
	if (!colorCtx || !color) return null;
	try {
		colorCtx.clearRect(0, 0, 1, 1);
		colorCtx.fillStyle = '#000000';
		colorCtx.fillStyle = color;
		colorCtx.fillRect(0, 0, 1, 1);
		const [r, g, b] = colorCtx.getImageData(0, 0, 1, 1).data;
		return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
	} catch {
		return null;
	}
};

// Resolve any CSS color expression (var(), color-mix(), oklab()) to a concrete
// hex under the active theme, via the probe + canvas readback.
const readColor = (value: string, fallback: string): string => {
	if (typeof window === 'undefined') return fallback;
	if (!colorProbe) {
		colorProbe = document.createElement('div');
		colorProbe.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none;opacity:0;';
		document.body.appendChild(colorProbe);
	}
	colorProbe.style.color = '';
	colorProbe.style.color = value;
	const resolved = getComputedStyle(colorProbe).color;
	return normalizeColor(resolved) || fallback;
};

const readToken = (name: string, fallback: string): string => readColor(`var(${name})`, fallback);

// A token mixed `pct`% over the background — the derivation ladder. Low percentages
// give faint surface tints, higher ones give soft strokes/lines. Everything is
// derived from a token + the background so it adapts to light/dark automatically.
const mixOver = (token: string, pct: number, fallback: string): string =>
	readColor(`color-mix(in oklab, var(${token}) ${pct}%, var(--color-surface))`, fallback);
const mixFg = (pct: number, fallback: string) => mixOver('--color-neutral', pct, fallback);
const mixAccent = (pct: number, fallback: string) => mixOver('--color-primary', pct, fallback);

const buildThemeVariables = (fontFamily: string): Record<string, string> => {
	const foreground = readToken('--color-neutral', '#1f2328');
	const background = readToken('--color-surface', '#ffffff');

	// GitHub-flavoured, but not black-and-white: surfaces carry a faint accent tint
	// and borders/links a soft (not saturated) accent, so the diagram has colour
	// without the old "primary everywhere". Text stays at full contrast.
	const nodeFill = mixAccent(7, '#eef1fb'); // faintly accent-tinted node surface
	const nodeStroke = mixAccent(45, '#a6b1f0'); // soft accent border
	const secondaryFill = mixAccent(13, '#e3e8fa'); // secondary nodes / activations
	const surface = mixAccent(6, '#eef1fb'); // clusters / notes / title bands
	const surfaceStroke = mixAccent(28, '#c3ccf3');
	const line = mixAccent(52, '#8f9cec'); // edges / connectors / arrows
	const textMuted = mixFg(50, '#6b7280'); // edge labels, muted text (kept neutral)

	return {
		background,
		// Primary node family — neutral surface + grey border, NOT brand colour.
		primaryColor: nodeFill,
		primaryBorderColor: nodeStroke,
		primaryTextColor: foreground,
		mainBkg: nodeFill,
		nodeBorder: nodeStroke,
		// Secondary / tertiary surfaces (still greyscale).
		secondaryColor: secondaryFill,
		secondaryBorderColor: surfaceStroke,
		secondaryTextColor: foreground,
		tertiaryColor: surface,
		tertiaryBorderColor: surfaceStroke,
		tertiaryTextColor: foreground,
		// Text + lines.
		textColor: foreground,
		lineColor: line,
		titleColor: foreground,
		edgeLabelBackground: background,
		labelColor: foreground,
		// Clusters / subgraphs.
		clusterBkg: surface,
		clusterBorder: surfaceStroke,
		// Notes.
		noteBkgColor: surface,
		noteTextColor: foreground,
		noteBorderColor: surfaceStroke,
		// Sequence diagrams.
		actorBkg: nodeFill,
		actorBorder: nodeStroke,
		actorTextColor: foreground,
		actorLineColor: line,
		signalColor: foreground,
		signalTextColor: foreground,
		labelBoxBkgColor: nodeFill,
		labelBoxBorderColor: nodeStroke,
		labelTextColor: foreground,
		loopTextColor: foreground,
		activationBkgColor: secondaryFill,
		activationBorderColor: nodeStroke,
		// Pie / bar: soft multi-hue from our semantic tokens (mixed over the
		// background so they're muted pastels, not neon) — distinct and colourful,
		// but calm. Full-contrast label text stays readable over these mid tones.
		pie1: mixOver('--color-primary', 60, '#a6b1f0'),
		pie2: mixOver('--color-info', 58, '#8fd0e6'),
		pie3: mixOver('--color-success', 58, '#9bd8b0'),
		pie4: mixOver('--color-warning', 62, '#eacf8f'),
		pie5: mixOver('--color-secondary', 55, '#b7bcc6'),
		pie6: mixOver('--color-danger', 58, '#eaa3a3'),
		pie7: mixOver('--color-primary', 38, '#c8cff5'),
		pie8: mixOver('--color-info', 38, '#bce3ef'),
		pieStrokeColor: background,
		pieOuterStrokeColor: nodeStroke,
		pieTitleTextColor: foreground,
		pieSectionTextColor: foreground,
		pieLegendTextColor: foreground,
		pieStrokeWidth: '1.5px',
		pieOuterStrokeWidth: '1px',
		// Muted edge-label text.
		edgeLabelColor: textMuted,
		fontFamily
	};
};

// Scoped SVG polish mermaid's themeVariables can't express: soft-rounded node
// corners + edge-label pills, and hairline strokes. Scoped by the diagram's own id
// so it never leaks to other diagrams or the page (an unscoped <style> would).
const buildScopedStyle = (id: string): string =>
	`#${id} .node rect,#${id} .node polygon,#${id} .node circle,#${id} .cluster rect,` +
	`#${id} rect.actor,#${id} .labelBox{rx:6px;ry:6px}` +
	`#${id} .edgeLabel rect,#${id} .edgeLabel .label-container{rx:4px;ry:4px}` +
	`#${id} .node rect,#${id} .cluster rect,#${id} rect.actor{stroke-width:1px}` +
	`#${id} .edgePath path,#${id} .flowchart-link{stroke-width:1.5px}`;

type MermaidOptions = Pick<
	MermaidProps,
	'chart' | 'config' | 'mouseWheelZoom' | 'touchPan' | 'errorForgiving' | 'onRender' | 'onError'
>;

/** The bound option props are declared by the base class, so `this.chart` & co. are typed
 *  without merging an interface into the class declaration. */
export class MermaidState extends createBindableStateClass<MermaidOptions>() {
	// The library instance once loaded from cdnjs.
	mermaid: MermaidModule | null = $state.raw(null);
	loading = $state(true);
	error: Error | null = $state(null);

	private theme = useTheme();
	// The <svg> host we render into, and the wrapper the panzoom transforms.
	private svgHost: SVGSVGElement | null = null;
	private renderToken = 0;
	/** The derived themeVariables last handed to mermaid, to skip no-op re-renders. */
	private themeSignature = '';

	private get fontFamily() {
		return this.config?.fontFamily || 'ui-sans-serif, system-ui, -apple-system, sans-serif';
	}
	private mounted = false;
	// Hover gating: only enable wheel-zoom after the pointer has dwelled a moment,
	// so scrolling the page past the diagram doesn't hijack the wheel.
	private hovering = $state(false);
	private hoverTimer: ReturnType<typeof setTimeout> | undefined;

	panzoom: ReturnType<typeof usePanzoom>;

	constructor(options: MermaidOptions) {
		super(options);

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const self = this;
		this.panzoom = usePanzoom({
			minZoom: 0.5,
			maxZoom: 4,
			zoomSpeed: 1,
			// Live getter: wheel-zoom is gated on the prop and a short hover dwell.
			get activateMouseWheel() {
				return self.mouseWheelZoom !== false && self.hovering;
			},
			get touchPan() {
				return self.touchPan === true;
			}
		});

		// Load mermaid once (client only), then render.
		$effect(() => {
			untrack(() => void this.ensureLoaded());
		});

		// Re-render when the chart or config changes.
		$effect(() => {
			void this.chart;
			void this.config;
			untrack(() => {
				if (this.mounted) void this.render();
			});
		});

		// Re-render when the resolved --color-* tokens change: a light/dark flip, a palette
		// swap or runtime design-token edits. Tokens are read from the DOM rather than from
		// the reactive `resolvedTheme`, which flips before the attribute (and the colours) do.
		// `<head>` also mutates on plain navigation, so only re-render when the derived
		// variables actually differ from the ones last handed to mermaid.
		$effect(() =>
			observeThemeTokens(() => {
				if (!this.mounted) return;
				if (JSON.stringify(buildThemeVariables(this.fontFamily)) === this.themeSignature) return;
				void this.render();
			})
		);

		onDestroy(() => {
			this.renderToken++;
			clearTimeout(this.hoverTimer);
			this.removeTempContainer();
		});
	}

	private ensureLoaded = async () => {
		if (typeof window === 'undefined') return;
		this.loading = true;
		this.error = null;
		try {
			this.mermaid = await loadMermaid();
			this.mounted = true;
			await this.render();
		} catch (e) {
			this.loading = false;
			this.error = e instanceof Error ? e : new Error(String(e));
			this.onError?.(this.error);
		}
	};

	// The id of the temporary measuring container mermaid.render() leaves in <body>
	// (it's `d` + our render id). Tracked so we can remove exactly OUR own leftover —
	// never a concurrent instance's still-in-flight node (removing that throws inside
	// mermaid's layout: `x.firstChild` on a null container).
	private lastTempId: string | null = null;

	private removeTempContainer = (tempId = this.lastTempId) => {
		if (typeof document === 'undefined' || !tempId) return;
		document.getElementById(tempId)?.remove();
	};

	render = async () => {
		if (!this.mermaid || !this.svgHost || typeof window === 'undefined') return;
		const token = ++this.renderToken;
		// Only show the skeleton before the first render; once a diagram is on screen,
		// re-renders swap it in place (or, when forgiving, keep it) with no flash.
		const hasContent = !!this.svgHost.querySelector('svg');
		if (!hasContent) this.loading = true;
		this.error = null;
		let tempId: string | undefined;
		try {
			const sanitized = sanitizeMermaidCode(this.chart ?? '');
			if (!sanitized.trim()) {
				this.loading = false;
				this.svgHost.innerHTML = '';
				return;
			}

			const fontFamily = this.fontFamily;
			// Pull the caller's themeVariables out so they merge per-key over the brand
			// mapping instead of the trailing spread clobbering the whole object.
			const { themeVariables: userThemeVars, ...restConfig } = this.config ?? {};
			const themeVariables = buildThemeVariables(fontFamily);
			this.themeSignature = JSON.stringify(themeVariables);
			const config: MermaidConfig = {
				theme: 'base',
				startOnLoad: false,
				fontFamily,
				flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
				...restConfig,
				themeVariables: {
					...themeVariables,
					...(userThemeVars || {})
				},
				// Hard-pinned last so caller config can't downgrade the sandbox: the rendered
				// SVG is inserted via innerHTML, so strict sanitization is not optional.
				securityLevel: 'strict',
				suppressErrorRendering: true
			};
			this.mermaid.initialize(config);

			const id = createId(`dmm-${token}`);
			tempId = `d${id}`;
			this.lastTempId = tempId;
			const { svg } = await this.mermaid.render(id, sanitized);
			// A newer render superseded this one.
			if (token !== this.renderToken || !this.svgHost) return;

			this.svgHost.innerHTML = svg;
			// Scoped polish (rounded corners / hairline strokes) keyed to the produced
			// svg's own id so it can't affect any other diagram or the page.
			const style = document.createElement('style');
			style.textContent = buildScopedStyle(id);
			this.svgHost.prepend(style);
			// Copy sizing attributes from the produced <svg> onto our host.
			const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
			for (const attr of Array.from(parsed.attributes)) {
				if (attr.name !== 'id') this.svgHost.setAttribute(attr.name, attr.value);
			}
			this.removeTempContainer(tempId);
			this.loading = false;
			// Fit twice: the first pass measures, the second centres at final scale.
			this.panzoom.zoomToFit();
			this.panzoom.zoomToFit();
			this.onRender?.(this);
		} catch (e) {
			if (token !== this.renderToken) return;
			this.removeTempContainer(tempId);
			this.loading = false;
			const err = e instanceof Error ? e : new Error(String(e));
			// Streaming/forgiving mode: the source is transiently invalid between tokens,
			// so keep the last good render on screen instead of flashing an error. Still
			// report via onError for observability, but never surface the overlay.
			if (this.errorForgiving) {
				this.onError?.(err);
				return;
			}
			this.error = err;
			this.onError?.(err);
		}
	};

	// Attaches the <svg> render host + panzoom, plus hover gating for wheel zoom.
	svgAttachment = (node: SVGSVGElement) => {
		return untrack(() => {
			this.svgHost = node;
			const cleanupPanzoom = this.panzoom.attach(node);
			void this.render();

			const owner = node.parentElement;
			const offEnter = owner
				? on(owner, 'mouseenter', () => {
						this.hoverTimer = setTimeout(() => (this.hovering = true), 400);
					})
				: () => {};
			const offLeave = owner
				? on(owner, 'mouseleave', () => {
						this.hovering = false;
						clearTimeout(this.hoverTimer);
					})
				: () => {};

			return () => {
				cleanupPanzoom?.();
				offEnter();
				offLeave();
				this.svgHost = null;
			};
		});
	};

	zoomIn = () => this.panzoom.zoomIn();
	zoomOut = () => this.panzoom.zoomOut();
	zoomToFit = () => this.panzoom.zoomToFit();

	private getSvg = (): SVGSVGElement | null => this.svgHost?.querySelector('svg') ?? null;

	/** Serialize the rendered diagram to a standalone SVG string. */
	private serializeSvg = (): string | null => {
		const svg = this.getSvg();
		if (!svg || typeof XMLSerializer === 'undefined') return null;
		const clone = svg.cloneNode(true) as SVGSVGElement;
		clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
		clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
		const styles = getComputedStyle(svg);
		if (!clone.getAttribute('width')) clone.setAttribute('width', styles.width);
		if (!clone.getAttribute('height')) clone.setAttribute('height', styles.height);
		return new XMLSerializer().serializeToString(clone);
	};

	private triggerDownload = (url: string, filename: string, revoke: boolean) => {
		if (typeof document === 'undefined') return;
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.rel = 'noopener';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		if (revoke && typeof URL !== 'undefined') URL.revokeObjectURL(url);
	};

	/** Download the diagram as a standalone `.svg` file. */
	downloadSvg = (filename = 'diagram.svg') => {
		const svgString = this.serializeSvg();
		if (!svgString || typeof Blob === 'undefined' || typeof URL === 'undefined') return;
		const url = URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml' }));
		this.triggerDownload(url, filename, true);
	};
}
