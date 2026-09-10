import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { bind } from '$lib/utils/state.svelte.js';
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
		| 'transitionDuration'
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
	| 'transitionDuration'
	| 'closeOnClickOutside'
	| 'closeOnEscape'
	| 'closeOnScroll'
	| 'lockScroll'
	| 'closeLabel'
	| 'backgroundColor'
	| 'licenseKey'
> & {
	isOpen: boolean;
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

export interface ImageZoomState extends ImageZoomStateOptions {}

export class ImageZoomState {
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
		bind(this, options);

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
