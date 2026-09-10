import type { Slot, WithSlot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { ImageGalleryThemeProps } from './imageGallery.theme.js';

export type ImageGalleryImage = {
	/** DOM-derived image source. */
	src: string;
	/** Accessible image description from the source image. */
	alt: string;
	/** Caption text derived from title, then alt. */
	caption: string;
	/** Zero-based image index in the discovered gallery. */
	index: number;
};

export type ImageGalleryPayload = {
	/** Discovered images in DOM order. */
	images: ImageGalleryImage[];
	/** Currently active image, if one is available. */
	activeImage: ImageGalleryImage | null;
	/** Currently active image index. */
	activeIndex: number;
	/** Whether the zoomed gallery is open. */
	isOpen: boolean;
	/** Opens the gallery at the provided index. */
	open: (index?: number) => void;
	/** Closes the gallery. */
	close: () => void;
	/** Updates the active gallery image. */
	setActiveIndex: (index: number) => void;
	/** Moves to the previous image when available. */
	previous: () => void;
	/** Moves to the next image when available. */
	next: () => void;
	/** Whether previous navigation is available. */
	canPrevious: boolean;
	/** Whether next navigation is available. */
	canNext: boolean;
};

export type ImageGalleryIndexChangePayload = {
	index: number;
	gallery: ImageGalleryPayload;
};

export type ImageGalleryProps = WithAttachments<
	WithSlot<
		{
			/** Stable DOM id for the gallery wrapper; falls back to a generated id. */
			id?: string;
			/** Controls whether the zoomed gallery is open; bindable for two-way control. */
			open?: boolean;
			/** Initial open state when `open` is not provided. */
			defaultOpen?: boolean;
			/** Controls the active image index; bindable for two-way control. */
			activeIndex?: number;
			/** Selector used to discover descendant images. Defaults to `img`. */
			imageSelector?: string;
			/** When true, descendant images are not enhanced. */
			disabled?: boolean;
			/** Viewport margin, in pixels, kept around the zoomed gallery. */
			zoomMargin?: number;
			/** Zoom animation duration in milliseconds. */
			transitionDuration?: number;
			/** When true, clicking the backdrop closes the zoomed gallery. */
			closeOnClickOutside?: boolean;
			/** When true, pressing Escape closes the zoomed gallery. */
			closeOnEscape?: boolean;
			/** When true, page scroll is locked while open. */
			lockScroll?: boolean;
			/** Accessible label applied to enhanced image triggers. */
			buttonLabel?: string;
			/** Accessible label for the close button. */
			closeLabel?: string;
			/** Accessible label for previous navigation. */
			previousLabel?: string;
			/** Accessible label for next navigation. */
			nextLabel?: string;
			/** LightGallery license key. The default key is for evaluation only. */
			licenseKey?: string;
			/** Additional CSS classes merged onto the root element. */
			class?: string;
			/** Callback fired once when the library requests a new open state. */
			onOpenChange?: (open: boolean) => void;
			/** Callback fired when navigation changes the active image. */
			onIndexChange?: (payload: ImageGalleryIndexChangePayload) => void;
			/** Callback fired after the open animation finishes. */
			onAfterOpen?: (payload: ImageGalleryPayload) => void;
			/** Callback fired after the close animation finishes. */
			onAfterClose?: (payload: ImageGalleryPayload) => void;
			/** Per-instance theme overrides for image gallery parts. */
			theme?: ImageGalleryThemeProps;
		},
		'children' | 'caption',
		ImageGalleryPayload
	>
>;

export type ImageGalleryCaption = Slot<ImageGalleryPayload>;
