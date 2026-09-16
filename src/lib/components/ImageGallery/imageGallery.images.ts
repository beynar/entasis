import { on } from 'svelte/events';
import type { ImageGalleryImage } from './imageGallery.props.js';
import type { ImageGalleryState } from './imageGallery.state.svelte.js';

export type DiscoveredImage = ImageGalleryImage & {
	element: HTMLImageElement;
};

type RestoredImageAttributes = {
	role: string | null;
	tabindex: string | null;
	label: string | null;
	dataGalleryImage: string | null;
	dataSrc: string | null;
	dataThumb: string | null;
	dataLgSize: string | null;
	dataLgId: string | null;
};

export class ImageGalleryImages {
	private enhancedImages = new Map<HTMLImageElement, RestoredImageAttributes>();

	constructor(private gallery: ImageGalleryState) {}

	attach(root: HTMLElement) {
		this.refresh();
		const offKeydown = on(root, 'keydown', this.onRootKeydown);
		const offLoad = on(root, 'load', this.onImageLoad, { capture: true });
		const observer = new MutationObserver(this.gallery.refreshGallery);
		observer.observe(root, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['src', 'srcset', 'sizes', 'alt', 'title']
		});

		return () => {
			observer.disconnect();
			offKeydown();
			offLoad();
			this.cleanup();
			this.gallery.discoveredImages = [];
		};
	}

	refresh = () => {
		const root = this.gallery.rootElement;
		if (!root) return;
		const imageElements = Array.from(root.querySelectorAll(this.gallery.imageSelector)).filter(
			(element): element is HTMLImageElement => element instanceof HTMLImageElement
		);
		const activeElements = new Set(imageElements);
		Array.from(this.enhancedImages.keys()).forEach((imageElement) => {
			if (!activeElements.has(imageElement)) this.restoreImageAttributes(imageElement);
		});

		this.gallery.discoveredImages = imageElements.map((imageElement, index) => {
			const src =
				imageElement.currentSrc || imageElement.src || imageElement.getAttribute('src') || '';
			const alt = imageElement.alt || '';
			this.enhanceImage(imageElement, src);
			return {
				element: imageElement,
				src,
				alt,
				caption: imageElement.title || alt,
				index
			};
		});
	};

	cleanup() {
		Array.from(this.enhancedImages.keys()).forEach((imageElement) => {
			this.restoreImageAttributes(imageElement);
		});
	}

	private enhanceImage(imageElement: HTMLImageElement, src: string) {
		if (!this.enhancedImages.has(imageElement)) {
			this.enhancedImages.set(imageElement, {
				role: imageElement.getAttribute('role'),
				tabindex: imageElement.getAttribute('tabindex'),
				label: imageElement.getAttribute('aria-label'),
				dataGalleryImage: imageElement.getAttribute('data-image-gallery-image'),
				dataSrc: imageElement.getAttribute('data-src'),
				dataThumb: imageElement.getAttribute('data-thumb'),
				dataLgSize: imageElement.getAttribute('data-lg-size'),
				dataLgId: imageElement.getAttribute('data-lg-id')
			});
		}

		const label = imageElement.alt
			? `${this.gallery.buttonLabel}: ${imageElement.alt}`
			: this.gallery.buttonLabel;
		imageElement.setAttribute('role', 'button');
		imageElement.setAttribute('tabindex', '0');
		imageElement.setAttribute('aria-label', label);
		imageElement.setAttribute('data-image-gallery-image', '');
		imageElement.setAttribute('data-src', src);
		imageElement.setAttribute('data-thumb', src);
		if (imageElement.naturalWidth > 0 && imageElement.naturalHeight > 0) {
			imageElement.setAttribute(
				'data-lg-size',
				`${imageElement.naturalWidth}-${imageElement.naturalHeight}`
			);
		}
	}

	private restoreImageAttributes(imageElement: HTMLImageElement) {
		const previousAttributes = this.enhancedImages.get(imageElement);
		if (!previousAttributes) return;
		this.restoreAttribute(imageElement, 'role', previousAttributes.role);
		this.restoreAttribute(imageElement, 'tabindex', previousAttributes.tabindex);
		this.restoreAttribute(imageElement, 'aria-label', previousAttributes.label);
		this.restoreAttribute(
			imageElement,
			'data-image-gallery-image',
			previousAttributes.dataGalleryImage
		);
		this.restoreAttribute(imageElement, 'data-src', previousAttributes.dataSrc);
		this.restoreAttribute(imageElement, 'data-thumb', previousAttributes.dataThumb);
		this.restoreAttribute(imageElement, 'data-lg-size', previousAttributes.dataLgSize);
		this.restoreAttribute(imageElement, 'data-lg-id', previousAttributes.dataLgId);
		this.enhancedImages.delete(imageElement);
	}

	private restoreAttribute(element: HTMLElement, name: string, value: string | null) {
		if (value === null) {
			element.removeAttribute(name);
			return;
		}
		element.setAttribute(name, value);
	}

	private onRootKeydown = (event: KeyboardEvent) => {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		const imageElement = this.getImageFromEventTarget(event.target);
		if (!imageElement) return;
		event.preventDefault();
		this.gallery.openAt(this.getImageIndex(imageElement), imageElement);
	};

	private onImageLoad = (event: Event) => {
		if (!(event.target instanceof HTMLImageElement)) return;
		this.gallery.refreshGallery();
	};

	private getImageFromEventTarget(target: EventTarget | null) {
		const root = this.gallery.rootElement;
		if (!(target instanceof Element) || !root) return null;
		const imageElement = target.closest(this.gallery.imageSelector);
		if (!(imageElement instanceof HTMLImageElement) || !root.contains(imageElement)) return null;
		return imageElement;
	}

	private getImageIndex(imageElement: HTMLImageElement) {
		return Math.max(
			0,
			this.gallery.discoveredImages.findIndex((image) => image.element === imageElement)
		);
	}
}
