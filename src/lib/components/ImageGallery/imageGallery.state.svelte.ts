import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { createBindableStateClass } from '$lib/utils/state.svelte.js';
import type { Messages } from '$lib/i18n/en.js';
import { ImageGalleryImages, type DiscoveredImage } from './imageGallery.images.js';
import { ImageGalleryLightbox } from './imageGallery.lightbox.js';
import type {
	ImageGalleryImage,
	ImageGalleryPayload,
	ImageGalleryProps
} from './imageGallery.props.js';

type MakeRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

type ImageGalleryStateOptions = MakeRequired<
	Pick<
		ImageGalleryProps,
		| 'imageSelector'
		| 'disabled'
		| 'zoomMargin'
		| 'closeOnClickOutside'
		| 'closeOnEscape'
		| 'lockScroll'
		| 'buttonLabel'
		| 'closeLabel'
		| 'previousLabel'
		| 'nextLabel'
		| 'licenseKey'
		| 'onOpenChange'
		| 'onIndexChange'
		| 'onAfterOpen'
		| 'onAfterClose'
	>,
	| 'imageSelector'
	| 'disabled'
	| 'zoomMargin'
	| 'closeOnClickOutside'
	| 'closeOnEscape'
	| 'lockScroll'
	| 'buttonLabel'
	| 'closeLabel'
	| 'previousLabel'
	| 'nextLabel'
	| 'licenseKey'
> & {
	isOpen: boolean;
	/** Lightbox animation duration in ms, resolved from the `motion` theme slot. */
	transitionDuration: number;
	/** Lightbox CSS easing, resolved from the `motion` theme slot. */
	transitionEasing: string;
	activeIndex: number;
	hasCustomCaption: boolean;
	/** Active i18n catalog, used for the lightbox chrome strings. */
	messages: Messages;
};

type ImageGalleryAttachmentConfig = Pick<
	ImageGalleryStateOptions,
	| 'imageSelector'
	| 'disabled'
	| 'zoomMargin'
	| 'transitionDuration'
	| 'transitionEasing'
	| 'closeOnClickOutside'
	| 'closeOnEscape'
	| 'lockScroll'
	| 'buttonLabel'
	| 'closeLabel'
	| 'previousLabel'
	| 'nextLabel'
	| 'licenseKey'
	| 'hasCustomCaption'
>;

/** The bound option props are declared by the base class, so `this.isOpen` & co. are typed
 *  without merging an interface into the class declaration. */
export class ImageGalleryState extends createBindableStateClass<ImageGalleryStateOptions>() {
	rootElement: HTMLElement | null = $state(null);
	discoveredImages = $state<DiscoveredImage[]>([]);
	readonly imageRegistry = new ImageGalleryImages(this);
	private lightbox = new ImageGalleryLightbox(this);

	// The DOM handle stays internal: the public payload is data only.
	images = $derived<ImageGalleryImage[]>(
		this.discoveredImages.map(({ src, alt, caption, index }) => ({ src, alt, caption, index }))
	);
	activeImage = $derived(this.images[this.activeIndex] ?? null);
	canPrevious = $derived(this.activeIndex > 0);
	canNext = $derived(this.activeIndex < this.images.length - 1);

	constructor(options: ImageGalleryStateOptions) {
		super(options);

		$effect(() => {
			const isOpen = this.isOpen;
			const activeIndex = this.activeIndex;
			untrack(() => this.lightbox.sync(isOpen, activeIndex));
		});
	}

	attachRoot = (configuration: ImageGalleryAttachmentConfig): Attachment<HTMLElement> => {
		return (node) =>
			untrack(() => {
				this.rootElement = node;
				const cleanup = configuration.disabled ? undefined : this.lightbox.setup(node);

				return () => {
					cleanup?.();
					if (this.rootElement === node) this.rootElement = null;
				};
			});
	};

	open = (index: number = this.activeIndex) => {
		this.openAt(index);
	};

	openAt = (index: number, imageElement?: HTMLImageElement) => {
		if (this.disabled) return;
		this.imageRegistry.refresh();
		const nextIndex = this.getBoundedIndex(index);
		const source = imageElement ?? this.discoveredImages[nextIndex]?.element;
		if (!source) return;
		this.updateIndex(nextIndex, true);
		this.lightbox.open(nextIndex, source);
	};

	close = () => {
		this.lightbox.close();
	};

	setActiveIndex = (index: number) => {
		const nextIndex = this.getBoundedIndex(index);
		this.updateIndex(nextIndex, true);
		this.lightbox.setActiveIndex(nextIndex);
	};

	previous = () => {
		if (this.canPrevious) this.lightbox.previous();
	};

	next = () => {
		if (this.canNext) this.lightbox.next();
	};

	refreshGallery = () => {
		this.lightbox.refresh();
	};

	payload = $derived<ImageGalleryPayload>({
		images: this.images,
		activeImage: this.activeImage,
		activeIndex: this.activeIndex,
		isOpen: this.isOpen,
		open: this.open,
		close: this.close,
		setActiveIndex: this.setActiveIndex,
		previous: this.previous,
		next: this.next,
		canPrevious: this.canPrevious,
		canNext: this.canNext
	});

	updateOpen(nextOpen: boolean, notify: boolean) {
		if (this.isOpen === nextOpen) return;
		this.isOpen = nextOpen;
		if (notify) this.onOpenChange?.(nextOpen);
	}

	updateIndex(nextIndex: number, notify: boolean) {
		if (this.activeIndex === nextIndex) return;
		this.activeIndex = nextIndex;
		if (notify) this.onIndexChange?.({ index: nextIndex, gallery: this.payload });
	}

	getBoundedIndex(index: number) {
		if (this.discoveredImages.length === 0) return 0;
		const requestedIndex = Number.isFinite(index) ? Math.trunc(index) : 0;
		return Math.max(0, Math.min(this.discoveredImages.length - 1, requestedIndex));
	}
}
