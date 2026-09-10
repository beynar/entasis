import lightGalleryModule from 'lightgallery';
import thumbnailModule from 'lightgallery/plugins/thumbnail';
import zoomModule from 'lightgallery/plugins/zoom';
import { createImageGalleryOrigin } from './imageGallery.origin.js';
import type { ImageGalleryState } from './imageGallery.state.svelte.js';

type LightGalleryPlugin = new (instance: LightGallery, query: unknown) => unknown;
type LightGallery = {
	index: number;
	lgOpened: boolean;
	plugins: unknown[];
	items: ArrayLike<HTMLElement>;
	galleryItems: Array<{ alt?: string; subHtml?: string }>;
	outer: { get: () => HTMLElement };
	getMediaContainerPosition: () => { top: number; bottom: number };
	openGallery: (index?: number, element?: HTMLElement) => void;
	closeGallery: (force?: boolean) => number;
	slide: (index: number) => void;
	goToPrevSlide: () => void;
	goToNextSlide: () => void;
	refresh: () => void;
	destroy: () => number;
};
type LightGalleryFactory = (
	root: HTMLElement,
	settings: {
		selector: string;
		exThumbImage: string;
		plugins: LightGalleryPlugin[];
		licenseKey: string;
		zoomFromOrigin: boolean;
		startAnimationDuration: number;
		backdropDuration: number;
		speed: number;
		easing: string;
		closeOnTap: boolean;
		escKey: boolean;
		hideScrollbar: boolean;
		loop: boolean;
		preload: number;
		slideEndAnimation: boolean;
		download: boolean;
		mousewheel: boolean;
		thumbnail: boolean;
		showCloseIcon: boolean;
		hideBarsDelay: number;
		getCaptionFromTitleOrAlt: boolean;
		allowMediaOverlap: boolean;
		infiniteZoom: boolean;
		scale: number;
		enableZoomAfter: number;
		addClass: string;
		mobileSettings: { controls: boolean; showCloseIcon: boolean; download: boolean };
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
type ZoomPlugin = {
	scale: number;
	pageX: number;
	pageY: number;
	setZoomEssentials: () => void;
	beginZoom: (scale: number) => boolean;
	zoomImage: (scale: number, scaleDiff: number, reposition: boolean, resetToMax: boolean) => void;
};

const lightGallery = lightGalleryModule as unknown as LightGalleryFactory;
const lgZoom = zoomModule as unknown as LightGalleryPlugin;
const lgThumbnail = thumbnailModule as unknown as LightGalleryPlugin;

export class ImageGalleryLightbox {
	private instance: LightGallery | null = null;
	private zoomPlugin: ZoomPlugin | null = null;
	private activeSource: HTMLImageElement | null = null;
	private setupId = 0;
	private destroyPromise: Promise<void> | null = null;
	private cleanupImages: (() => void) | null = null;
	private eventCleanups: Array<() => void> = [];

	constructor(private gallery: ImageGalleryState) {}

	setup(root: HTMLElement) {
		const setupId = ++this.setupId;
		const pendingDestroy = this.destroyPromise;
		if (pendingDestroy) {
			void pendingDestroy.then(() => {
				if (setupId === this.setupId && !this.gallery.disabled) this.initialize(root, setupId);
			});
		} else {
			this.initialize(root, setupId);
		}
		return () => {
			if (setupId === this.setupId) this.destroy();
		};
	}

	open(index: number, source: HTMLImageElement) {
		this.instance?.openGallery(index, source);
	}

	close() {
		if (this.instance?.lgOpened) {
			this.instance.closeGallery();
			return;
		}
		this.gallery.updateOpen(false, true);
	}

	setActiveIndex(index: number) {
		if (this.instance?.lgOpened && this.instance.index !== index) this.instance.slide(index);
	}

	previous() {
		if (this.instance?.lgOpened) {
			this.instance.goToPrevSlide();
			return;
		}
		this.gallery.setActiveIndex(this.gallery.activeIndex - 1);
	}

	next() {
		if (this.instance?.lgOpened) {
			this.instance.goToNextSlide();
			return;
		}
		this.gallery.setActiveIndex(this.gallery.activeIndex + 1);
	}

	refresh() {
		this.gallery.imageRegistry.refresh();
		if (!this.instance) return;
		this.instance.refresh();
		this.syncGalleryItems(this.instance);
	}

	sync(isOpen: boolean, activeIndex: number) {
		const instance = this.instance;
		if (!instance) return;
		const index = this.gallery.getBoundedIndex(activeIndex);
		if (isOpen && !instance.lgOpened) {
			const source = this.gallery.discoveredImages[index]?.element;
			if (source) instance.openGallery(index, source);
			return;
		}
		if (!isOpen && instance.lgOpened) {
			instance.closeGallery();
			return;
		}
		if (isOpen && instance.lgOpened && instance.index !== index) instance.slide(index);
	}

	destroy() {
		this.setupId += 1;
		this.eventCleanups.splice(0).forEach((cleanup) => cleanup());
		const instance = this.instance;
		const cleanupImages = this.cleanupImages;
		this.cleanupImages = null;
		this.zoomPlugin = null;
		this.activeSource = null;
		this.instance = null;
		if (!instance) {
			cleanupImages?.();
			return;
		}

		const destroyDuration = instance.destroy();
		if (!destroyDuration) {
			cleanupImages?.();
			this.destroyPromise = null;
			return;
		}

		const destroyPromise = new Promise<void>((resolve) => {
			setTimeout(() => {
				cleanupImages?.();
				if (this.destroyPromise === destroyPromise) this.destroyPromise = null;
				resolve();
			}, destroyDuration + 1);
		});
		this.destroyPromise = destroyPromise;
	}

	private initialize(root: HTMLElement, setupId: number) {
		if (setupId !== this.setupId || this.gallery.disabled) return;
		this.cleanupImages = this.gallery.imageRegistry.attach(root);

		let instance: LightGallery;
		try {
			this.attachGalleryEvents(root);
			instance = lightGallery(root, {
				selector: this.gallery.imageSelector,
				exThumbImage: 'data-thumb',
				plugins: [lgZoom, lgThumbnail],
				licenseKey: this.gallery.licenseKey,
				zoomFromOrigin: true,
				startAnimationDuration: this.gallery.transitionDuration,
				backdropDuration: Math.min(this.gallery.transitionDuration, 200),
				speed: this.gallery.transitionDuration,
				easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
				closeOnTap: this.gallery.closeOnClickOutside,
				escKey: this.gallery.closeOnEscape,
				hideScrollbar: this.gallery.lockScroll,
				loop: false,
				preload: 0,
				slideEndAnimation: false,
				download: false,
				mousewheel: false,
				thumbnail: true,
				showCloseIcon: true,
				hideBarsDelay: 0,
				getCaptionFromTitleOrAlt: !this.gallery.hasCustomCaption,
				allowMediaOverlap: false,
				infiniteZoom: true,
				scale: 0.25,
				enableZoomAfter: this.gallery.transitionDuration,
				addClass: 'svelai-image-gallery',
				mobileSettings: {
					controls: true,
					showCloseIcon: true,
					download: false
				},
				strings: {
					closeGallery: this.gallery.closeLabel,
					toggleMaximize: 'Toggle maximize',
					previousSlide: this.gallery.previousLabel,
					nextSlide: this.gallery.nextLabel,
					download: 'Download',
					playVideo: 'Play video',
					mediaLoadingFailed: 'The image could not be loaded'
				}
			});
		} catch (error) {
			this.eventCleanups.splice(0).forEach((cleanup) => cleanup());
			this.cleanupImages?.();
			this.cleanupImages = null;
			throw error;
		}

		this.attachMediaMargin(instance);
		this.attachOriginAdapter(instance);
		this.syncGalleryItems(instance);
		this.instance = instance;
		this.zoomPlugin = instance.plugins.find(this.isZoomPlugin) ?? null;
		const outer = instance.outer.get();
		outer.style.setProperty('--image-gallery-margin', `${Math.max(0, this.gallery.zoomMargin)}px`);
		this.attachWheelZoom(outer);
		this.sync(this.gallery.isOpen, this.gallery.activeIndex);
	}

	private attachGalleryEvents(root: HTMLElement) {
		this.addEvent(root, 'lgBeforeOpen', () => {
			const index = this.instance?.index ?? this.gallery.activeIndex;
			this.gallery.updateIndex(index, true);
			this.gallery.updateOpen(true, true);
		});
		this.addEvent(root, 'lgAfterOpen', () => {
			this.gallery.onAfterOpen?.(this.gallery.payload);
		});
		this.addEvent(root, 'lgBeforeSlide', (event) => {
			const { index } = (event as CustomEvent<{ index: number }>).detail;
			this.gallery.updateIndex(index, true);
		});
		this.addEvent(root, 'lgAfterClose', () => {
			this.gallery.updateOpen(false, true);
			if (this.activeSource?.isConnected) this.activeSource.focus({ preventScroll: true });
			this.activeSource = null;
			this.gallery.onAfterClose?.(this.gallery.payload);
		});
	}

	private attachWheelZoom(outer: HTMLElement) {
		const onWheel = (event: WheelEvent) => {
			const zoom = this.zoomPlugin;
			const activeImage = outer.querySelector('.lg-current.lg-zoomable .lg-image');
			if (!zoom || !activeImage || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
			event.preventDefault();
			event.stopPropagation();
			zoom.setZoomEssentials();
			zoom.pageX = event.pageX;
			zoom.pageY = event.pageY;
			const currentScale = Number.isFinite(zoom.scale) ? zoom.scale : 1;
			const nextScale = Math.max(1, Math.min(5, currentScale + (event.deltaY < 0 ? 0.25 : -0.25)));
			if (nextScale === currentScale) return;
			const scaleDiff = nextScale - currentScale;
			zoom.beginZoom(nextScale);
			zoom.zoomImage(nextScale, scaleDiff, true, false);
		};
		outer.addEventListener('wheel', onWheel, { passive: false, capture: true });
		this.eventCleanups.push(() => outer.removeEventListener('wheel', onWheel, { capture: true }));
	}

	private attachMediaMargin(instance: LightGallery) {
		const getMediaContainerPosition = instance.getMediaContainerPosition.bind(instance);
		instance.getMediaContainerPosition = () => {
			const position = getMediaContainerPosition();
			const margin = Math.max(0, this.gallery.zoomMargin);
			return {
				top: position.top + margin,
				bottom: position.bottom + margin
			};
		};
	}

	private attachOriginAdapter(instance: LightGallery) {
		const openGallery = instance.openGallery.bind(instance);
		const closeGallery = instance.closeGallery.bind(instance);
		instance.openGallery = (index = this.gallery.activeIndex, element) => {
			const nextIndex = this.gallery.getBoundedIndex(index);
			const source =
				element instanceof HTMLImageElement
					? element
					: this.gallery.discoveredImages[nextIndex]?.element;
			if (!source) {
				openGallery(nextIndex, element);
				return;
			}

			this.activeSource = source;
			const origin = createImageGalleryOrigin(source);
			try {
				openGallery(nextIndex, origin.element);
			} finally {
				origin.remove();
			}
		};
		instance.closeGallery = (force) => {
			const source = this.gallery.discoveredImages[instance.index]?.element;
			const items = instance.items;
			const item = items[instance.index];
			if (!source || !item) return closeGallery(force);

			const origin = createImageGalleryOrigin(source);
			const originItems = Array.from(items);
			originItems[instance.index] = origin.element;
			instance.items = originItems;
			try {
				return closeGallery(force);
			} finally {
				instance.items = items;
				origin.remove();
			}
		};
	}

	private syncGalleryItems(instance: LightGallery) {
		instance.galleryItems.forEach((galleryItem, index) => {
			const image = this.gallery.discoveredImages[index];
			if (!image) return;
			galleryItem.alt = image.alt;
			galleryItem.subHtml = this.gallery.hasCustomCaption ? '' : image.caption;
		});
	}

	private addEvent(root: HTMLElement, type: string, listener: EventListener) {
		root.addEventListener(type, listener);
		this.eventCleanups.push(() => root.removeEventListener(type, listener));
	}

	private isZoomPlugin(plugin: unknown): plugin is ZoomPlugin {
		if (!plugin || typeof plugin !== 'object') return false;
		return (
			'setZoomEssentials' in plugin &&
			typeof plugin.setZoomEssentials === 'function' &&
			'beginZoom' in plugin &&
			typeof plugin.beginZoom === 'function' &&
			'zoomImage' in plugin &&
			typeof plugin.zoomImage === 'function'
		);
	}
}
