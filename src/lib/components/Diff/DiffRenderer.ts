import { FileDiff, type FileDiffOptions, type SelectedLineRange } from '@pierre/diffs';
import type { DiffRenderItem, DiffRenderState, PreloadedDiffRenderItem } from './diff-input.js';
import { isOverflowing } from '$lib/utils/useOverflowObserver.svelte.js';

/**
 * Owns the lifecycle of the underlying `@pierre/diffs` `FileDiff` instances.
 *
 * For each parsed file diff it creates a wrapper element, instantiates a `FileDiff`, and calls
 * `render(...)`, or `hydrate(...)` over a diff preloaded on the server. `cleanUp()` disposes
 * every instance and is called from the component's attachment teardown.
 */
export class DiffRenderer {
	private instances: FileDiff[] = [];
	private scrollRegions: ResizeObserver | null = null;
	private scrollRegionLabels = new WeakMap<Element, string>();
	private shadowObservers: MutationObserver[] = [];
	private pendingFrames = new Set<number>();

	render(
		container: HTMLElement,
		items: DiffRenderItem[],
		options: FileDiffOptions<undefined, undefined>,
		fileClass: string,
		state: DiffRenderState,
		labelFile?: (file: string) => string
	): void {
		this.cleanUp();
		container.replaceChildren();

		for (const item of items) {
			const wrapper = document.createElement('div');
			wrapper.dataset.diffFile = item.key;
			wrapper.className = fileClass;
			container.append(wrapper);

			const instance = new FileDiff(options);
			instance.render({
				fileDiff: item.fileDiff,
				containerWrapper: wrapper,
				lineAnnotations: state.lineAnnotations
			});
			this.syncSelectedLines(instance, state);
			this.instances.push(instance);
			this.trackScrollRegions(wrapper, item.key, labelFile);
		}
	}

	/**
	 * Client hydration of the SSR'd declarative shadow DOM. Attaches a `FileDiff`
	 * to each server-rendered `<diffs-container>` without re-rendering its markup.
	 */
	hydrate(
		container: HTMLElement,
		items: PreloadedDiffRenderItem[],
		options: FileDiffOptions<undefined, undefined>,
		fileClass: string,
		state: DiffRenderState,
		labelFile?: (file: string) => string
	): void {
		this.cleanUp();
		const wrappers = [...container.querySelectorAll<HTMLElement>('[data-diff-file]')];

		for (const item of items) {
			let wrapper = wrappers.find((node) => node.dataset.diffFile === item.key);
			if (wrapper == null) {
				wrapper = document.createElement('div');
				wrapper.dataset.diffFile = item.key;
				container.append(wrapper);
			}
			wrapper.className = fileClass;

			let fileContainer = wrapper.querySelector<HTMLElement>('diffs-container');
			if (fileContainer == null) {
				fileContainer = document.createElement('diffs-container');
				wrapper.replaceChildren(fileContainer);
			}

			const instance = new FileDiff(options);
			instance.hydrate({
				fileDiff: item.fileDiff,
				fileContainer,
				prerenderedHTML: item.html,
				lineAnnotations: state.lineAnnotations
			});
			this.syncSelectedLines(instance, state);
			this.instances.push(instance);
			this.trackScrollRegions(wrapper, item.key, labelFile);
		}
	}

	/**
	 * `@pierre/diffs` puts the horizontal scroller on a bare `<code>` inside its shadow root,
	 * which no keyboard can reach (axe: scrollable-region-focusable). Name each one and give it
	 * a tab stop, but only while it actually overflows, so a diff that fits adds no dead stop.
	 */
	private trackScrollRegions(
		wrapper: HTMLElement,
		file: string,
		labelFile: ((file: string) => string) | undefined
	): void {
		if (labelFile == null || typeof ResizeObserver === 'undefined') return;
		const label = labelFile(file);
		const scrollRegions = (this.scrollRegions ??= new ResizeObserver((entries) => {
			for (const entry of entries) this.syncScrollRegion(entry.target);
		}));
		const track = (shadow: ShadowRoot) => {
			for (const code of shadow.querySelectorAll('code')) {
				if (this.scrollRegionLabels.get(code) === label) continue;
				this.scrollRegionLabels.set(code, label);
				this.syncScrollRegion(code);
				scrollRegions.observe(code);
			}
		};
		// A hydrated diff already holds its markup; a client render fills the shadow root a moment
		// later, and again on each re-render. Watch it so every <code> gets its tab stop.
		const watch = () => {
			const shadow = wrapper.querySelector('diffs-container')?.shadowRoot;
			if (shadow == null) return false;
			track(shadow);
			const mutations = new MutationObserver(() => track(shadow));
			mutations.observe(shadow, { childList: true, subtree: true });
			this.shadowObservers.push(mutations);
			return true;
		};
		if (watch()) return;
		let frames = 0;
		const retry = () => {
			if (watch() || ++frames > 120) return;
			this.pendingFrames.add(requestAnimationFrame(retry));
		};
		this.pendingFrames.add(requestAnimationFrame(retry));
	}

	// `aria-label` goes on and off with the role: a bare <code> has no role, and a label on a
	// roleless element is itself a violation (axe: aria-prohibited-attr).
	private syncScrollRegion(node: Element): void {
		const label = this.scrollRegionLabels.get(node);
		if (label != null && isOverflowing(node)) {
			node.setAttribute('role', 'region');
			node.setAttribute('aria-label', label);
			node.setAttribute('tabindex', '0');
		} else {
			node.removeAttribute('role');
			node.removeAttribute('aria-label');
			node.removeAttribute('tabindex');
		}
	}

	/**
	 * Push a selection change into the already-rendered instances without a full
	 * re-render. `notify: false` so it doesn't loop back through `onLineSelected`.
	 */
	setSelectedLines(range: SelectedLineRange | null): void {
		for (const instance of this.instances) {
			instance.setSelectedLines(range, { notify: false });
		}
	}

	cleanUp(): void {
		for (const instance of this.instances) {
			instance.cleanUp();
		}
		this.instances = [];
		this.scrollRegions?.disconnect();
		this.scrollRegions = null;
		for (const observer of this.shadowObservers) observer.disconnect();
		this.shadowObservers = [];
		for (const frame of this.pendingFrames) cancelAnimationFrame(frame);
		this.pendingFrames.clear();
	}

	private syncSelectedLines(instance: FileDiff, state: DiffRenderState): void {
		if (state.selectedLines !== undefined) {
			instance.setSelectedLines(state.selectedLines, { notify: false });
		}
	}
}
