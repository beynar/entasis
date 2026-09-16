import lightGalleryModule from 'lightgallery';
import mediumZoomModule from 'lightgallery/plugins/mediumZoom';
import type { ImageZoomState } from './imageZoom.state.svelte.js';

const triggerSelector = '[data-image-zoom-trigger]';

type LightGalleryPlugin = new (instance: LightGallery, query: unknown) => unknown;
type LightGallery = {
	lgOpened: boolean;
	galleryItems: Array<{ src?: string; alt?: string; subHtml?: string }>;
	outer: { get: () => HTMLElement };
	openGallery: (index?: number, element?: HTMLElement) => void;
	closeGallery: (force?: boolean) => number;
	refresh: () => void;
	destroy: () => number;
};
type LightGalleryFactory = (
	root: HTMLElement,
	settings: {
		selector: string;
		plugins: LightGalleryPlugin[];
		licenseKey: string;
		startAnimationDuration: number;
		escKey: boolean;
		hideScrollbar: boolean;
		margin: number;
		backgroundColor: string;
		strings: {
			closeGallery: string;
			toggleMaximize: string;
			previousSlide: string;
			nextSlide: string;
			download: string;
			playVideo: string;
			mediaLoadingFailed: string;
		};
	}
) => LightGallery;

const lightGallery = lightGalleryModule as unknown as LightGalleryFactory;
const lgMediumZoom = mediumZoomModule as unknown as LightGalleryPlugin;

export class ImageZoomLightbox {
	private instance: LightGallery | null = null;
	private triggerElement: HTMLElement | null = null;
	private imageElement: HTMLImageElement | null = null;
	private previousFocus: HTMLElement | null = null;
	private setupId = 0;
	private destroyPromise: Promise<void> | null = null;
	private eventCleanups: Array<() => void> = [];

	constructor(private zoom: ImageZoomState) {}

	setup(root: HTMLElement) {
		const setupId = ++this.setupId;
		const pendingDestroy = this.destroyPromise;
		if (pendingDestroy) {
			void pendingDestroy.then(() => {
				if (setupId === this.setupId && !this.zoom.disabled) this.initialize(root, setupId);
			});
		} else {
			this.initialize(root, setupId);
		}

		return () => {
			if (setupId === this.setupId) this.destroy();
		};
	}

	open() {
		const instance = this.instance;
		const triggerElement = this.triggerElement;
		if (!instance || !triggerElement || instance.lgOpened || !this.refreshMetadata()) return;
		this.syncGalleryItem(instance);
		instance.openGallery(0, triggerElement);
	}

	close() {
		if (this.instance?.lgOpened) this.instance.closeGallery();
	}

	sync(isOpen: boolean) {
		if (isOpen) {
			this.open();
			return;
		}
		this.close();
	}

	destroy() {
		this.setupId += 1;
		this.eventCleanups.splice(0).forEach((cleanup) => cleanup());
		const instance = this.instance;
		this.instance = null;
		this.triggerElement = null;
		this.imageElement = null;
		this.previousFocus = null;
		if (!instance) return;

		const destroyDuration = instance.destroy();
		if (!destroyDuration) {
			this.destroyPromise = null;
			return;
		}

		const destroyPromise = new Promise<void>((resolve) => {
			setTimeout(() => {
				if (this.destroyPromise === destroyPromise) this.destroyPromise = null;
				resolve();
			}, destroyDuration + 1);
		});
		this.destroyPromise = destroyPromise;
	}

	private initialize(root: HTMLElement, setupId: number) {
		if (setupId !== this.setupId || this.zoom.disabled) return;
		const triggerElement = root.querySelector<HTMLElement>(triggerSelector);
		const imageElement = triggerElement?.querySelector('img');
		if (!triggerElement || !(imageElement instanceof HTMLImageElement)) return;

		this.triggerElement = triggerElement;
		this.imageElement = imageElement;
		if (!this.refreshMetadata()) return;
		this.attachEvents(root, imageElement);

		// Already 0 when the Theme reports a reduced-motion preference: the duration
		// comes from the resolved `motion` slot.
		const transitionDuration = Math.max(0, this.zoom.transitionDuration);

		let instance: LightGallery;
		try {
			instance = lightGallery(root, {
				selector: triggerSelector,
				plugins: [lgMediumZoom],
				licenseKey: this.zoom.licenseKey,
				startAnimationDuration: transitionDuration,
				escKey: this.zoom.closeOnEscape,
				hideScrollbar: this.zoom.lockScroll,
				margin: Math.max(0, this.zoom.zoomMargin),
				backgroundColor: this.zoom.backgroundColor,
				strings: {
					closeGallery: this.zoom.closeLabel,
					toggleMaximize: this.zoom.messages.toggleMaximize,
					previousSlide: this.zoom.messages.previousImage,
					nextSlide: this.zoom.messages.nextImage,
					download: this.zoom.messages.download,
					playVideo: this.zoom.messages.playVideo,
					mediaLoadingFailed: this.zoom.messages.imageLoadError
				}
			});
		} catch (error) {
			this.eventCleanups.splice(0).forEach((cleanup) => cleanup());
			this.triggerElement = null;
			this.imageElement = null;
			throw error;
		}

		this.instance = instance;
		this.syncGalleryItem(instance);
		this.attachOutsideClickPolicy(instance.outer.get());
		this.sync(this.zoom.isOpen);
	}

	private attachEvents(root: HTMLElement, imageElement: HTMLImageElement) {
		this.addEvent(root, 'lgBeforeOpen', () => {
			this.previousFocus =
				document.activeElement instanceof HTMLElement
					? document.activeElement
					: this.triggerElement;
			this.zoom.updateOpen(true, true);
		});
		this.addEvent(root, 'lgAfterOpen', () => this.zoom.onAfterOpen?.(this.zoom.payload));
		this.addEvent(root, 'lgBeforeClose', () => this.zoom.updateOpen(false, true));
		this.addEvent(root, 'lgAfterClose', () => {
			this.restoreFocus();
			this.zoom.onAfterClose?.(this.zoom.payload);
		});
		this.addEvent(imageElement, 'load', this.handleImageLoad);
		const handleScrollIntent = () => {
			if (this.zoom.isOpen && this.zoom.closeOnScroll) this.close();
		};
		const scrollOptions = { capture: true, passive: true } as const;
		document.addEventListener('scroll', handleScrollIntent, scrollOptions);
		document.addEventListener('wheel', handleScrollIntent, scrollOptions);
		document.addEventListener('touchmove', handleScrollIntent, scrollOptions);
		this.eventCleanups.push(() => {
			document.removeEventListener('scroll', handleScrollIntent, scrollOptions);
			document.removeEventListener('wheel', handleScrollIntent, scrollOptions);
			document.removeEventListener('touchmove', handleScrollIntent, scrollOptions);
		});
	}

	private attachOutsideClickPolicy(outer: HTMLElement) {
		const handleClick = (event: Event) => {
			if (this.zoom.closeOnClickOutside) return;
			const target = event.target;
			if (target instanceof Element && target.closest('.lg-object')) return;
			event.stopImmediatePropagation();
		};
		this.addEvent(outer, 'click', handleClick, { capture: true });
	}

	private handleImageLoad = () => {
		if (!this.refreshMetadata() || !this.instance || this.instance.lgOpened) return;
		this.instance.refresh();
		this.syncGalleryItem(this.instance);
	};

	private refreshMetadata() {
		const triggerElement = this.triggerElement;
		const imageElement = this.imageElement;
		if (!triggerElement || !imageElement) return false;

		const inferredSrc =
			imageElement.currentSrc || imageElement.src || imageElement.getAttribute('src') || '';
		this.zoom.setInferredMetadata(inferredSrc, imageElement.alt);
		if (!this.zoom.zoomedSrc) return false;

		triggerElement.setAttribute('data-src', this.zoom.zoomedSrc);
		triggerElement.setAttribute('lg-surface-color', this.zoom.backgroundColor);
		const imageSize = this.getZoomedImageSize(imageElement);
		if (imageSize) {
			triggerElement.setAttribute('data-lg-size', `${imageSize.width}-${imageSize.height}`);
		} else {
			triggerElement.removeAttribute('data-lg-size');
		}
		return true;
	}

	private getZoomedImageSize(imageElement: HTMLImageElement) {
		const zoomWidth = this.zoom.zoomWidth;
		const zoomHeight = this.zoom.zoomHeight;
		if (zoomWidth !== undefined || zoomHeight !== undefined) {
			if (!zoomWidth || !zoomHeight || zoomWidth <= 0 || zoomHeight <= 0) return null;
			return { width: Math.round(zoomWidth), height: Math.round(zoomHeight) };
		}

		// LightGallery requires the full source dimensions. Thumbnail dimensions are only
		// valid when the same source is displayed in both states.
		if (this.zoom.zoomSrc) return null;

		const attributeWidth = Number.parseFloat(imageElement.getAttribute('width') ?? '');
		const attributeHeight = Number.parseFloat(imageElement.getAttribute('height') ?? '');
		const width = imageElement.naturalWidth || attributeWidth;
		const height = imageElement.naturalHeight || attributeHeight;
		if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0)
			return null;
		return { width: Math.round(width), height: Math.round(height) };
	}

	private syncGalleryItem(instance: LightGallery) {
		const galleryItem = instance.galleryItems[0];
		if (!galleryItem) return;
		galleryItem.src = this.zoom.zoomedSrc;
		galleryItem.alt = this.zoom.resolvedAlt;
		galleryItem.subHtml = '';
	}

	private restoreFocus() {
		const focusTarget = this.previousFocus?.isConnected ? this.previousFocus : this.triggerElement;
		focusTarget?.focus({ preventScroll: true });
		this.previousFocus = null;
	}

	private addEvent(
		target: EventTarget,
		type: string,
		listener: EventListener,
		options?: AddEventListenerOptions
	) {
		target.addEventListener(type, listener, options);
		this.eventCleanups.push(() => target.removeEventListener(type, listener, options));
	}
}
