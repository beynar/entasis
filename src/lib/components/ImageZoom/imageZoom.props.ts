import type { Slot, WithSlot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { ImageZoomThemeProps } from './imageZoom.theme.js';

export type ImageZoomPayload = {
	/** Resolved thumbnail image source. */
	src: string;
	/** Resolved full-size image source used in the zoomed layer. */
	zoomSrc: string;
	/** Resolved accessible image description. */
	alt: string;
	/** Whether the zoomed layer is open. */
	isOpen: boolean;
	/** Opens the zoomed layer. */
	open: () => void;
	/** Closes the zoomed layer. */
	close: () => void;
	/** Toggles the zoomed layer. */
	toggle: () => void;
};

type ImageLoading = 'eager' | 'lazy';
type ImageDecoding = 'sync' | 'async' | 'auto';
export type ImageZoomIndicatorPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type ImageZoomProps = WithAttachments<
	WithSlot<
		{
			/** Stable DOM id for the image zoom root; falls back to a generated id. */
			id?: string;
			/** Thumbnail image source. Required unless the children slot renders an image. */
			src?: string;
			/** Accessible image description. Required unless the children slot image has alt text. */
			alt?: string;
			/** Full-size image source. Defaults to `src`. */
			zoomSrc?: string;
			/** Intrinsic width of `zoomSrc`, used by LightGallery's origin transition. */
			zoomWidth?: number;
			/** Intrinsic height of `zoomSrc`, used by LightGallery's origin transition. */
			zoomHeight?: number;
			/** Controls whether the zoomed layer is open; bindable for two-way control. */
			open?: boolean;
			/** Initial open state when `open` is not provided. */
			defaultOpen?: boolean;
			/** When true, prevents opening and marks the trigger disabled. */
			disabled?: boolean;
			/** Image width attribute forwarded to the thumbnail. */
			width?: number | string;
			/** Image height attribute forwarded to the thumbnail. */
			height?: number | string;
			/** Thumbnail `srcset` attribute. */
			srcset?: string;
			/** Thumbnail `sizes` attribute. */
			sizes?: string;
			/** Thumbnail loading strategy. */
			loading?: ImageLoading;
			/** Thumbnail decode strategy. */
			decoding?: ImageDecoding;
			/** Viewport margin, in pixels, kept around the zoomed image. */
			zoomMargin?: number;
			/** Zoom animation duration in milliseconds. */
			transitionDuration?: number;
			/** When true, clicking the backdrop closes the zoomed layer. */
			closeOnClickOutside?: boolean;
			/** When true, pressing Escape closes the zoomed layer. */
			closeOnEscape?: boolean;
			/** When true, wheel, touch-scroll, page scroll, or nested scroll closes the zoomed layer. */
			closeOnScroll?: boolean;
			/** When true, page scroll is locked while the zoomed layer is mounted. */
			lockScroll?: boolean;
			/** Accessible label for the thumbnail trigger. Defaults to `Zoom image`. */
			buttonLabel?: string;
			/** Accessible label for LightGallery's close action. Defaults to `Close image zoom`. */
			closeLabel?: string;
			/** CSS color used by the Medium Zoom backdrop. Defaults to the theme background color. */
			backgroundColor?: string;
			/** LightGallery license key. The default key is for evaluation only. */
			licenseKey?: string;
			/** When true, renders the thumbnail zoom indicator. */
			showIndicator?: boolean;
			/** Corner used for the thumbnail zoom indicator. */
			indicatorPosition?: ImageZoomIndicatorPosition;
			/** Additional CSS classes merged onto the root element. */
			class?: string;
			/** Callback fired once when the library requests a new open state. */
			onOpenChange?: (open: boolean) => void;
			/** Callback fired after the open animation finishes. */
			onAfterOpen?: (payload: ImageZoomPayload) => void;
			/** Callback fired after the close animation finishes. */
			onAfterClose?: (payload: ImageZoomPayload) => void;
			/** Per-instance theme overrides for image zoom parts. */
			theme?: ImageZoomThemeProps;
		},
		'children' | 'caption' | 'indicator',
		ImageZoomPayload
	>
>;

export type ImageZoomCaption = Slot<ImageZoomPayload>;
export type ImageZoomIndicator = Slot<ImageZoomPayload>;
