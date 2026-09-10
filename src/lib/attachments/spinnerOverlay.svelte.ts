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

	const ensureParentIsPositioned = (node: HTMLElement) => {
		if (node) {
			const currentPosition = node.style.getPropertyValue('position');
			if (currentPosition !== 'relative' && currentPosition !== 'absolute') {
				node.style.setProperty('position', 'relative');
			}
		}
	};
	const setup = (node: HTMLElement) => {
		if (opts.loading) {
			ensureParentIsPositioned(node);
			const [overlay, mounted] = setOverlay(node);
			setText(overlay);
			setSpinner(overlay);

			if (!parentAnimation && !mounted) {
				parentAnimation = overlay.animate([{ opacity: 0 }, { opacity: 1 }], {
					duration: 200,
					direction: 'alternate'
				});
			} else if (parentAnimation) {
				parentAnimation.reverse();
				parentAnimation.onfinish = () => {};
			}
		} else {
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
