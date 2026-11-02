import SpinnerIndicator from '$lib/components/Spinner/SpinnerIndicator.svelte';
import { resolveSpinnerVariant } from '$lib/components/Spinner/resolveSpinnerVariant.js';
import type { SpinnerVariant } from '$lib/components/Spinner/spinner.props.js';
import { useSpinnerTheme } from '$lib/components/Spinner/spinner.theme.js';
import { useTheme } from '$lib/components/Theme/theme.state.svelte.js';
import type { Colors, Sizes } from '$lib/types/theme.js';
import { cx } from '$lib/utils/cva/index.js';
import { useSpinnerOverlayTheme } from './spinnerOverlay.theme.js';
export { setSpinnerOverlayTheme, useSpinnerOverlayTheme } from './spinnerOverlay.theme.js';
import { mount, unmount, untrack } from 'svelte';

export type SpinnerOverlayOptions = {
	text?: string;
	loading?: boolean;
	class?: string;
	color?: Colors;
	size?: Sizes;
	variant?: SpinnerVariant;
};

type MountedSpinnerIndicator = {
	component: Record<string, unknown>;
	className: string;
	variant: SpinnerVariant;
};

const mountedSpinnerIndicators = new WeakMap<HTMLElement, MountedSpinnerIndicator>();
// Hosts the overlay made `relative` to anchor itself, given back to their own position after.
const anchoredHosts = new WeakSet<HTMLElement>();

// The overlay sits inside the host's border, where the host clips its content with its inner
// radius (outer radius minus border width). Inheriting the outer radius made the overlay's corners
// rounder than that clip and let the host's background show at each corner.
const matchInnerRadius = (node: HTMLElement, overlay: HTMLElement) => {
	const style = getComputedStyle(node);
	const corner = (radius: string, a: string, b: string) =>
		`max(0px, calc(${radius} - ${Math.max(parseFloat(a) || 0, parseFloat(b) || 0)}px))`;
	overlay.style.borderTopLeftRadius = corner(
		style.borderTopLeftRadius,
		style.borderTopWidth,
		style.borderLeftWidth
	);
	overlay.style.borderTopRightRadius = corner(
		style.borderTopRightRadius,
		style.borderTopWidth,
		style.borderRightWidth
	);
	overlay.style.borderBottomRightRadius = corner(
		style.borderBottomRightRadius,
		style.borderBottomWidth,
		style.borderRightWidth
	);
	overlay.style.borderBottomLeftRadius = corner(
		style.borderBottomLeftRadius,
		style.borderBottomWidth,
		style.borderLeftWidth
	);
};

// Alpha of a computed colour: `rgba(r, g, b, a)`, `oklab(l a b / a)`, or 1 when it has none.
const alphaOf = (color: string) => {
	if (color === 'transparent') return 0;
	const match = /(?:\/|,(?=[^,]*\)$))\s*([\d.]+)(%?)\s*\)$/.exec(color);
	if (!match || !/^rgba|\//.test(color)) return 1;
	return parseFloat(match[1]) / (match[2] ? 100 : 1);
};

// `top` painted over `bottom`, as one colour.
const over = (top: string, bottom: string) => {
	const alpha = alphaOf(top);
	return alpha >= 1
		? top
		: `color-mix(in srgb, rgb(from ${top} r g b / 1) ${alpha * 100}%, ${bottom})`;
};

// A host that paints its own background (a solid Button) ends it on the same rounded edge as the
// overlay, and the anti-aliased edge let a dark line show around each corner. Once the overlay is
// fully in, it paints that background itself (under its tint, so the colour is unchanged and now
// opaque) and the host's own is made transparent. Its transitions are off meanwhile, so the swap is
// instant both ways and its own colour can be read again when a class changes it.
const surfaceRequests = new WeakSet<HTMLElement>();
const hiddenProperties = ['transition-property', 'background-color'];
const hiddenBackgrounds = new WeakMap<HTMLElement, string[]>();

const restoreInline = (node: HTMLElement, property: string, value: string) => {
	if (value) node.style.setProperty(property, value);
	else node.style.removeProperty(property);
};

const releaseHostBackground = (node: HTMLElement) => {
	const previous = hiddenBackgrounds.get(node);
	if (!previous) return;
	hiddenBackgrounds.delete(node);
	restoreInline(node, 'background-color', previous[1]);
	// Flush the colour while transitions are still off, so it does not fade back in.
	void getComputedStyle(node).backgroundColor;
	restoreInline(node, 'transition-property', previous[0]);
};

const paintHostSurface = (node: HTMLElement, overlay: HTMLElement) => {
	const previous = hiddenBackgrounds.get(node);
	if (previous) restoreInline(node, 'background-color', previous[1]);
	const host = getComputedStyle(node);
	const color = host.backgroundColor;
	overlay.style.removeProperty('background-color');
	if (alphaOf(color) === 0 || host.backgroundImage !== 'none') {
		releaseHostBackground(node);
		return;
	}
	// One colour, not stacked layers: WebKit anti-aliases each layer's rounded edge on its own, and
	// the host colour bled through the tint at the corners.
	overlay.style.backgroundColor = over(
		getComputedStyle(overlay).backgroundColor,
		over(color, 'var(--color-surface)')
	);
	if (!previous) {
		hiddenBackgrounds.set(
			node,
			hiddenProperties.map((property) => node.style.getPropertyValue(property))
		);
		node.style.setProperty('transition-property', 'none');
	}
	node.style.setProperty('background-color', 'transparent');
};

const coverHostSurface = (node: HTMLElement, overlay: HTMLElement) => {
	surfaceRequests.add(node);
	paintHostSurface(node, overlay);
};

const uncoverHostSurface = (node: HTMLElement, overlay?: HTMLElement | null) => {
	surfaceRequests.delete(node);
	overlay?.style.removeProperty('background-color');
	releaseHostBackground(node);
};

// A host can change its radius or colour while it loads (a class or style swap, then its colour
// transition), so the overlay follows it.
const hostFollowers = new WeakMap<HTMLElement, { observer: MutationObserver; sync: () => void }>();

const followHost = (node: HTMLElement) => {
	if (hostFollowers.has(node)) return;
	const sync = () => {
		const overlay = node.querySelector<HTMLElement>(':scope > [data-spinner-overlay]');
		if (!overlay) return;
		matchInnerRadius(node, overlay);
		if (surfaceRequests.has(node)) paintHostSurface(node, overlay);
		// Drop the style mutations this sync wrote itself.
		observer.takeRecords();
	};
	const observer = new MutationObserver(sync);
	observer.observe(node, { attributes: true, attributeFilter: ['class', 'style'] });
	node.addEventListener('transitionend', sync);
	hostFollowers.set(node, { observer, sync });
};

const stopFollowingHost = (node: HTMLElement) => {
	const follower = hostFollowers.get(node);
	if (!follower) return;
	follower.observer.disconnect();
	node.removeEventListener('transitionend', follower.sync);
	hostFollowers.delete(node);
};

export const spinnerOverlay = (opts: SpinnerOverlayOptions) => {
	const themeState = useTheme();
	const classes = $derived(useSpinnerOverlayTheme());
	const spinnerClasses = $derived(useSpinnerTheme());
	let parentAnimation: Animation | undefined = undefined;
	let textAnimation: Animation | undefined = undefined;

	const getSpinnerOverlay = (node: HTMLElement) => {
		return node.querySelector<HTMLElement>(':scope > [data-spinner-overlay]');
	};

	const getTextElement = (overlay: HTMLElement) => {
		return overlay.querySelector<HTMLElement>(':scope > [data-spinner-text]');
	};

	const removeSpinner = (overlay: HTMLElement) => {
		const mountedSpinner = mountedSpinnerIndicators.get(overlay);
		if (mountedSpinner) {
			void unmount(mountedSpinner.component);
			mountedSpinnerIndicators.delete(overlay);
		}
		overlay.querySelector(':scope > [data-slot="spinner-indicator"]')?.remove();
	};

	const destroy = (node: HTMLElement) => {
		if (!opts.loading) {
			const overlay = getSpinnerOverlay(node);
			if (overlay) {
				removeSpinner(overlay);
				overlay.remove();
			}
			uncoverHostSurface(node);
			releaseParent(node);
			stopFollowingHost(node);
			textAnimation?.cancel();
			parentAnimation?.cancel();
		}
	};

	const setSpinner = (overlay: HTMLElement) => {
		const variant = resolveSpinnerVariant(opts.variant, themeState?.spinnerVariant);
		const className = cx(
			spinnerClasses.indicator({ size: opts.size, variant }),
			classes.spinner({ size: opts.size, color: opts.color })
		);
		const mountedSpinner = mountedSpinnerIndicators.get(overlay);
		if (mountedSpinner?.variant === variant && mountedSpinner.className === className) return;

		removeSpinner(overlay);
		const component = mount(SpinnerIndicator, {
			target: overlay,
			props: { variant, class: className }
		});
		mountedSpinnerIndicators.set(overlay, { component, className, variant });
	};

	const setOverlay = (node: HTMLElement) => {
		let mounted = false;
		let overlay = getSpinnerOverlay(node);
		if (!overlay) {
			overlay = document.createElement('div');
			overlay.setAttribute('data-spinner-overlay', '');
			node.appendChild(overlay);
		} else {
			mounted = true;
		}
		overlay.dataset.color = opts.color ?? 'neutral';
		overlay.className = classes.overlay({ class: opts.class });
		matchInnerRadius(node, overlay);

		return [overlay, mounted] as const;
	};

	const setText = (overlay: HTMLElement) => {
		let textElement = getTextElement(overlay);
		if (!opts.text) {
			textElement?.remove();
			return;
		}
		if (textElement) {
			textElement.className = classes.text({ size: opts.size, color: opts.color });
			if (textElement.textContent === opts.text) return;
			textAnimation?.cancel();
			textElement.animate(
				[
					{ opacity: 1, transform: 'translateY(0px)' },
					{ opacity: 0, transform: 'translateY(-10px)' }
				],
				{
					duration: 200,
					direction: 'alternate'
				}
			).onfinish = () => {
				textElement!.textContent = opts.text || '';
				textAnimation = textElement?.animate(
					[
						{ opacity: 0, transform: 'translateY(10px)' },
						{ opacity: 1, transform: 'translateY(0)' }
					],
					{
						duration: 200,
						direction: 'alternate'
					}
				);
				textAnimation!.onfinish = () => {
					textAnimation = undefined;
				};
			};
		} else {
			textElement = document.createElement('p');
			textElement.setAttribute('data-spinner-text', 'true');
			textElement.textContent = opts.text || '';
			textElement.className = classes.text({ size: opts.size, color: opts.color });
			overlay.appendChild(textElement);
		}
	};

	// The overlay is absolute, so its host must be positioned. Only a static host is made
	// relative: one placed by its own classes (absolute, fixed, sticky) already anchors the overlay,
	// and overriding it would pull it out of its place while it loads.
	const ensureParentIsPositioned = (node: HTMLElement) => {
		if (anchoredHosts.has(node) || getComputedStyle(node).position !== 'static') return;
		node.style.setProperty('position', 'relative');
		anchoredHosts.add(node);
	};

	const releaseParent = (node: HTMLElement) => {
		if (!anchoredHosts.delete(node)) return;
		node.style.removeProperty('position');
	};
	const setup = (node: HTMLElement) => {
		if (opts.loading) {
			ensureParentIsPositioned(node);
			const [overlay, mounted] = setOverlay(node);
			followHost(node);
			setText(overlay);
			setSpinner(overlay);

			const cover = () => coverHostSurface(node, overlay);
			if (!parentAnimation && !mounted) {
				parentAnimation = overlay.animate([{ opacity: 0 }, { opacity: 1 }], {
					duration: 200,
					direction: 'alternate'
				});
				parentAnimation.onfinish = cover;
			} else if (parentAnimation) {
				parentAnimation.reverse();
				parentAnimation.onfinish = cover;
			} else {
				cover();
			}
		} else {
			// The host's own background comes back before the overlay fades out over it.
			uncoverHostSurface(node, getSpinnerOverlay(node));
			if (parentAnimation) {
				parentAnimation.reverse();
				parentAnimation.onfinish = () => {
					destroy(node);
				};
			} else {
				const overlay = getSpinnerOverlay(node);
				if (overlay) {
					parentAnimation = overlay.animate([{ opacity: 1 }, { opacity: 0 }], {
						duration: 200
					});
					parentAnimation.onfinish = () => {
						destroy(node);
					};
				}
			}
		}
	};

	return (node: HTMLElement) => {
		void opts.loading;
		void opts.text;
		void opts.variant;
		void opts.size;
		void opts.color;
		void themeState?.spinnerVariant;
		return untrack(() => {
			setup(node);
			return () => {
				destroy(node);
			};
		});
	};
};
