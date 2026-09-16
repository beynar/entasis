import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { createBindableStateClass } from '$lib/utils/state.svelte.js';
import type { Messages } from '$lib/i18n/en.js';
import { ImageZoomLightbox } from './imageZoom.lightbox.js';
import type { ImageZoomPayload, ImageZoomProps } from './imageZoom.props.js';

type MakeRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

type ImageZoomStateOptions = MakeRequired<
	Pick<
		ImageZoomProps,
		| 'src'
		| 'alt'
		| 'zoomSrc'
		| 'zoomWidth'
		| 'zoomHeight'
		| 'disabled'
		| 'zoomMargin'
		| 'closeOnClickOutside'
		| 'closeOnEscape'
		| 'closeOnScroll'
		| 'lockScroll'
		| 'closeLabel'
		| 'backgroundColor'
		| 'licenseKey'
		| 'onOpenChange'
		| 'onAfterOpen'
		| 'onAfterClose'
	>,
	| 'disabled'
	| 'zoomMargin'
	| 'closeOnClickOutside'
	| 'closeOnEscape'
	| 'closeOnScroll'
	| 'lockScroll'
	| 'closeLabel'
	| 'backgroundColor'
	| 'licenseKey'
> & {
	isOpen: boolean;
	/** Zoom animation duration in ms, resolved from the `motion` theme slot. */
	transitionDuration: number;
	/** Active i18n catalog, used for the lightbox chrome strings. */
	messages: Messages;
};

type ImageZoomAttachmentConfig = Pick<
	ImageZoomStateOptions,
	| 'src'
	| 'alt'
	| 'zoomSrc'
	| 'zoomWidth'
	| 'zoomHeight'
	| 'disabled'
	| 'zoomMargin'
	| 'transitionDuration'
	| 'closeOnClickOutside'
	| 'closeOnEscape'
	| 'closeOnScroll'
	| 'lockScroll'
	| 'closeLabel'
	| 'backgroundColor'
	| 'licenseKey'
>;

export class ImageZoomState extends createBindableStateClass<ImageZoomStateOptions>() {
	private inferredSrc = $state('');
	private inferredAlt = $state('');
	private lightbox = new ImageZoomLightbox(this);

	resolvedSrc = $derived(this.src || this.inferredSrc);
	resolvedAlt = $derived(this.alt ?? this.inferredAlt);
	zoomedSrc = $derived(this.zoomSrc || this.resolvedSrc);

	open = () => {
		if (!this.disabled) this.lightbox.open();
	};

	close = () => {
		this.lightbox.close();
	};

	toggle = () => {
		if (this.isOpen) {
			this.close();
			return;
		}
		this.open();
	};

	payload = $derived<ImageZoomPayload>({
		src: this.resolvedSrc,
		zoomSrc: this.zoomedSrc,
		alt: this.resolvedAlt,
		isOpen: this.isOpen,
		open: this.open,
		close: this.close,
		toggle: this.toggle
	});

	constructor(options: ImageZoomStateOptions) {
		super(options);

		$effect(() => {
			const isOpen = this.isOpen;
			untrack(() => this.lightbox.sync(isOpen));
		});
	}

	attachRoot = (configuration: ImageZoomAttachmentConfig): Attachment<HTMLElement> => {
		return (node) =>
			untrack(() => {
				if (configuration.disabled) {
					this.updateOpen(false, false);
					return;
				}
				return this.lightbox.setup(node);
			});
	};

	setInferredMetadata(src: string, alt: string) {
		this.inferredSrc = src;
		this.inferredAlt = alt;
	}

	updateOpen(nextOpen: boolean, notify: boolean) {
		if (this.isOpen === nextOpen) return;
		this.isOpen = nextOpen;
		if (notify) this.onOpenChange?.(nextOpen);
	}
}
