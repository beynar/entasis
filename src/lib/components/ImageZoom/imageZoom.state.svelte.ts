import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { createBindableStateClass } from '$lib/utils/state.svelte.js';
import type { Messages } from '$lib/i18n/en.js';
import { ImageZoomLightbox } from './imageZoom.lightbox.js';
import {
	createOpenChangeDetails,
	requestOpenChange,
	resolveOpenChangeDetails,
	type OpenChangeDetails,
	type OpenChangeInit
} from '$lib/utils/openChange.js';
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

	/** The open state `onOpenChange` already approved, until the lightbox reports it. */
	#approved: boolean | null = null;

	/**
	 * Asks `onOpenChange` before the lightbox changes state. Returns `false` when the change was
	 * cancelled; otherwise the next matching lightbox event applies it without asking again.
	 */
	requestOpenChange(
		nextOpen: boolean,
		input?: OpenChangeDetails | OpenChangeInit | Event
	): boolean {
		if (this.isOpen === nextOpen) return true;
		if (!requestOpenChange(this.onOpenChange, nextOpen, resolveOpenChangeDetails(input))) {
			return false;
		}
		this.#approved = nextOpen;
		return true;
	}

	open = (input?: OpenChangeDetails | OpenChangeInit | Event) => {
		if (this.disabled || this.isOpen) return;
		if (this.requestOpenChange(true, input)) this.lightbox.open();
	};

	close = (input?: OpenChangeDetails | OpenChangeInit | Event) => {
		if (!this.isOpen) return;
		if (this.requestOpenChange(false, input)) this.lightbox.close();
	};

	toggle = (input?: OpenChangeDetails | OpenChangeInit | Event) => {
		if (this.isOpen) {
			this.close(input);
			return;
		}
		this.open(input);
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

	/**
	 * Applies the state the lightbox reached. A change `onOpenChange` already approved (every
	 * path the component drives) applies silently; any other one is reported, and cannot be
	 * cancelled any more, before it applies. `notify: false` applies silently (a disabled zoom).
	 */
	updateOpen(nextOpen: boolean, notify: boolean) {
		const approved = this.#approved === nextOpen;
		this.#approved = null;
		if (this.isOpen === nextOpen) return;
		if (notify && !approved) {
			this.onOpenChange?.(nextOpen, createOpenChangeDetails({ cancelable: false }));
		}
		this.isOpen = nextOpen;
	}
}
