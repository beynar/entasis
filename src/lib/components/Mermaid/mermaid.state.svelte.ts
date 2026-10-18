import { applyCspNonce } from '$lib/utils/cspNonce.js';
import { createId } from '$lib/utils/id.js';
import { createBindableStateClass } from '$lib/utils/state.svelte.js';
import { usePanzoom } from '$lib/utils/usePanzoom.svelte.js';
import { onDestroy, untrack } from 'svelte';
import { on } from 'svelte/events';
import type { MermaidProps } from './mermaid.props.js';

// Mermaid source is rendered by Pele (https://pele.run, MIT, by Obsidian): a lightweight Mermaid
// renderer that returns themeable SVG synchronously. It is loaded from jsDelivr at runtime and never
// bundled, so we declare the minimal structural types we use rather than depending on its package.
// Bump this single const to upgrade (mirrors the pinned PDF.js runtime in DocumentViewer).
const PELE_CDN_VERSION = '1.6.0';
// The self-contained global build: one script that defines `window.pele` with every diagram type.
const PELE_CDN = `https://cdn.jsdelivr.net/npm/pele@${PELE_CDN_VERSION}/dist/pele.global.js`;

/**
 * Mermaid settings forwarded to Pele as its `config` (frontmatter and directives in the source
 * still override them), plus `fontFamily` for the diagram font. Pele draws with CSS variables, so
 * colours come from the theme rather than from a `themeVariables` key.
 */
export interface MermaidConfig {
	fontFamily?: string;
	flowchart?: { curve?: string; [key: string]: unknown };
	[key: string]: unknown;
}

/** The minimal Pele API surface this component calls (`window.pele` once loaded). */
export interface MermaidModule {
	render(
		source: string,
		options?: {
			fontFamily?: string;
			fontSize?: number;
			idPrefix?: string;
			responsive?: boolean;
			config?: Record<string, unknown>;
			[key: string]: unknown;
		}
	): { svg: string; width: number; height: number; type: string };
}

// Module-level singleton: dedupes concurrent loads and repeat mounts. Reset to
// null on failure so a later mount can retry. Only ever touched client-side.
let pelePromise: Promise<MermaidModule> | null = null;

const loadPele = (): Promise<MermaidModule> => {
	if (typeof window === 'undefined') {
		return Promise.reject(new Error('Pele can only be loaded in the browser'));
	}
	const w = window as unknown as { pele?: MermaidModule };
	if (w.pele) return Promise.resolve(w.pele);
	if (pelePromise) return pelePromise;

	pelePromise = new Promise<MermaidModule>((resolve, reject) => {
		// Reuse a matching script tag if one already exists (added by another instance),
		// otherwise inject a fresh one. `scriptEl` is the element we are waiting on so
		// fail() can always remove it — a script that loaded but never defined
		// window.pele (corrupt/partial asset) must not be left behind, or a later
		// retry would attach listeners to an already-fired, dead <script> and hang.
		const existing = document.querySelector<HTMLScriptElement>(
			`script[data-pele-cdn="${PELE_CDN_VERSION}"]`
		);
		const scriptEl = existing ?? applyCspNonce(document.createElement('script'));
		const settle = () => {
			clearTimeout(timeout);
			if (w.pele) resolve(w.pele);
			else fail(new Error('Pele loaded but window.pele is undefined'));
		};
		const fail = (err: Error) => {
			clearTimeout(timeout);
			scriptEl.remove();
			pelePromise = null; // allow a retry on the next mount
			reject(err);
		};
		// Wall-clock guard: a stalled CDN request may never fire load/error.
		const timeout = setTimeout(() => fail(new Error('Pele load timed out')), 30000);

		if (existing) {
			if (w.pele) {
				clearTimeout(timeout);
				return resolve(w.pele);
			}
			existing.addEventListener('load', settle, { once: true });
			existing.addEventListener(
				'error',
				() => fail(new Error('Failed to load Pele from jsDelivr')),
				{
					once: true
				}
			);
			return;
		}
		scriptEl.src = PELE_CDN;
		scriptEl.async = true;
		scriptEl.crossOrigin = 'anonymous';
		scriptEl.dataset.peleCdn = PELE_CDN_VERSION;
		scriptEl.addEventListener('load', settle, { once: true });
		scriptEl.addEventListener('error', () => fail(new Error('Failed to load Pele from jsDelivr')), {
			once: true
		});
		document.head.appendChild(scriptEl);
	});
	return pelePromise;
};

// The colour variables the theme maps onto design tokens, resolved into a downloaded file.
const PELE_COLOR_VARIABLES = [
	'--pele-bg',
	'--pele-fg',
	'--pele-muted',
	'--pele-line',
	'--pele-surface',
	'--pele-surface-alt',
	'--pele-border',
	'--pele-accent',
	'--pele-critical',
	...Array.from({ length: 8 }, (_, index) => `--pele-series-${index + 1}`)
];

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

type MermaidOptions = Pick<
	MermaidProps,
	'chart' | 'config' | 'mouseWheelZoom' | 'touchPan' | 'errorForgiving' | 'onRender' | 'onError'
>;

/** The bound option props are declared by the base class, so `this.chart` & co. are typed
 *  without merging an interface into the class declaration. */
export class MermaidState extends createBindableStateClass<MermaidOptions>() {
	// The renderer (Pele) once loaded from the CDN.
	mermaid: MermaidModule | null = $state.raw(null);
	loading = $state(true);
	error: Error | null = $state(null);

	// The <svg> host we render into, and the wrapper the panzoom transforms.
	private svgHost: SVGSVGElement | null = null;
	private renderToken = 0;
	// Unique per instance: Pele prefixes the ids its markers and gradients reference with it.
	private idPrefix = createId('mermaid');
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

		// Load the renderer once (client only), then render.
		$effect(() => {
			untrack(() => void this.ensureLoaded());
		});

		// Re-render when the chart or config changes. Colours need no re-render: the SVG draws with
		// `--pele-*` variables that the theme maps onto design tokens, so a light/dark flip or a
		// palette change restyles it in place.
		$effect(() => {
			void this.chart;
			void this.config;
			untrack(() => {
				if (this.mounted) void this.render();
			});
		});

		onDestroy(() => {
			this.renderToken++;
			clearTimeout(this.hoverTimer);
		});
	}

	private ensureLoaded = async () => {
		if (typeof window === 'undefined') return;
		this.loading = true;
		this.error = null;
		try {
			this.mermaid = await loadPele();
			this.mounted = true;
			await this.render();
		} catch (e) {
			this.loading = false;
			this.error = e instanceof Error ? e : new Error(String(e));
			this.onError?.(this.error);
		}
	};

	render = async () => {
		if (!this.mermaid || !this.svgHost || typeof window === 'undefined') return;
		const token = ++this.renderToken;
		// Only show the skeleton before the first render; once a diagram is on screen,
		// re-renders swap it in place (or, when forgiving, keep it) with no flash.
		const hasContent = !!this.svgHost.querySelector('svg');
		if (!hasContent) this.loading = true;
		this.error = null;
		try {
			const sanitized = sanitizeMermaidCode(this.chart ?? '');
			if (!sanitized.trim()) {
				this.loading = false;
				this.svgHost.innerHTML = '';
				return;
			}

			// Labels are measured in the font they are drawn with: the page's, unless the caller
			// names one. Pele writes it as the fallback of `--pele-font`, so the two always agree.
			const { fontFamily: configFont, ...config } = this.config ?? {};
			const computed = getComputedStyle(this.svgHost);
			const { svg } = this.mermaid.render(sanitized, {
				fontFamily: configFont || computed.fontFamily || 'sans-serif',
				fontSize: parseFloat(computed.fontSize) || 16,
				idPrefix: this.idPrefix,
				// Natural size: the panzoom fits it to the viewport.
				responsive: false,
				config
			});
			// A newer render superseded this one.
			if (token !== this.renderToken || !this.svgHost) return;

			// Pele's markup carries no `<style>` element or script, only presentation attributes and
			// inline CSS variables, so it needs no CSP nonce.
			this.svgHost.innerHTML = svg;
			// Copy sizing attributes from the produced <svg> onto our host.
			const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
			for (const attr of Array.from(parsed.attributes)) {
				if (attr.name !== 'id' && attr.name !== 'class' && attr.name !== 'style') {
					this.svgHost.setAttribute(attr.name, attr.value);
				}
			}
			this.loading = false;
			// Fit twice: the first pass measures, the second centres at final scale.
			this.panzoom.zoomToFit();
			this.panzoom.zoomToFit();
			this.onRender?.(this);
		} catch (e) {
			if (token !== this.renderToken) return;
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
		// The file leaves the page, and with it the theme that defines `--pele-*`: write the
		// resolved colours onto its root so it keeps the palette it has on screen.
		const probe = svg.ownerDocument.createElement('span');
		svg.parentNode?.appendChild(probe);
		for (const name of PELE_COLOR_VARIABLES) {
			probe.style.color = `var(${name})`;
			const color = getComputedStyle(probe).color;
			if (color) clone.style.setProperty(name, color);
		}
		probe.remove();
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
