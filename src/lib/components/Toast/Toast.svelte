<script lang="ts">
	import Spinner from '../Spinner/Spinner.svelte';
	import Slot from '../Slot/Slot.svelte';
	import Button from '../Button/Button.svelte';
	import type { Toast } from './toast.state.svelte.js';
	import { warningIconFill } from '$lib/components/Icons/warning.js';
	import { xCircleIconFill } from '$lib/components/Icons/xCircle.js';
	import { infoIconFill } from '$lib/components/Icons/info.js';
	import { xIcon } from '$lib/components/Icons/x.js';
	import { checkCircleIconFill } from '$lib/components/Icons/checkCircle.js';
	import { fso } from '$lib/transitions/transition.js';
	import { useToastTheme, type ToastThemeProps } from './toast.theme.js';
	import type { WithAttachments } from '$lib/types/props.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { useDrag } from '$lib/utils/useDrag.svelte.js';
	import { untrack } from 'svelte';

	let {
		toast,
		theme,
		updateArea,
		...attachments
	}: WithAttachments<{
		/** Recalculates the interactive toast-stack area after movement or expansion. */
		updateArea: () => void;
		/** Toast state owned by the parent Toaster. */
		toast: Toast;
		/** Per-instance component theme overrides. */
		theme?: ToastThemeProps;
	}> = $props();

	const { reversedIndex, index } = $derived(toast.indexInStack);

	// Beyond `visibleToasts`, a toast is faded out — it must also stop being
	// interactive (no pointer events, not focusable) or it invisibly intercepts
	// clicks and tab stops while aria-hidden.
	const hidden = $derived(reversedIndex > toast.toaster.visibleToasts - 1);

	// `prefix: false` explicitly disables the icon; otherwise a custom icon/prefix
	// wins, then a semantic default per color.
	const icon = $derived.by(() => {
		if (toast.opts.prefix === false) return null;
		if (toast.opts.icon) return toast.opts.icon;
		if (toast.opts.prefix) return toast.opts.prefix;
		return toast.opts.color === 'danger'
			? xCircleIconFill
			: toast.opts.color === 'warning'
				? warningIconFill
				: toast.opts.color === 'info'
					? infoIconFill
					: checkCircleIconFill;
	});

	const spinnerColor = $derived(toast.opts.color);

	const classes = $derived(useToastTheme(theme));
	const t = $derived(useI18n());

	// Remaining duration as a percentage, driven by the (reactive, hover-pausable)
	// timer. Only meaningful while a countdown timer exists.
	const progressPercent = $derived(
		toast.timer && toast.timer.delay > 0
			? Math.max(0, Math.min(100, (toast.timer.remaining / toast.timer.delay) * 100))
			: 0
	);

	const in_out = fso();

	const onPointerEnter = () => {
		const position = toast.opts.position;
		if (toast.toaster.hovering === position) return;
		toast.toaster.hovering = position;
		updateArea();
		toast.toaster.toggleTimers(position, 'pause');
	};

	// --- Swipe / drag to dismiss ------------------------------------------------
	// The toast is dragged toward its anchored screen edge: left/right corners swipe
	// horizontally, center positions swipe vertically. Dragging the other way meets
	// resistance. Past the threshold it dismisses — the exit transition continues
	// from the dragged position since the swipe matches the position's outro.
	const SWIPE_THRESHOLD = 45; // px past which a release dismisses
	const isBanner = $derived(
		toast.opts.position === 'banner-top' || toast.opts.position === 'banner-bottom'
	);
	const swipe = $derived.by(() => {
		const position = toast.opts.position;
		// Banners span the width, so they only swipe toward their vertical edge.
		if (position === 'banner-top') return { axis: 'y' as const, dir: -1 };
		if (position === 'banner-bottom') return { axis: 'y' as const, dir: 1 };
		const [vertical, horizontal] = position.split('-');
		if (horizontal === 'left') return { axis: 'x' as const, dir: -1 };
		if (horizontal === 'right') return { axis: 'x' as const, dir: 1 };
		return { axis: 'y' as const, dir: vertical === 'top' ? -1 : 1 };
	});
	const swipeEnabled = $derived(!!toast.opts.dismissible && toast.opts.swipeToDismiss !== false);

	let dragOffset = $state(0);
	let dragging = $state(false);
	let dragStartX = 0;
	let dragStartY = 0;

	const drag = useDrag({
		get isActive() {
			return swipeEnabled;
		},
		onDragStart: (e) => {
			dragStartX = e.clientX;
			dragStartY = e.clientY;
			dragging = true;
		},
		onDrag: (e) => {
			let delta = swipe.axis === 'x' ? e.clientX - dragStartX : e.clientY - dragStartY;
			// Rubber-band when dragging away from the dismiss direction.
			if (delta * swipe.dir < 0) delta /= 4;
			dragOffset = delta;
		},
		onDragEnd: () => {
			dragging = false;
			if (dragOffset * swipe.dir > SWIPE_THRESHOLD) {
				toast.remove();
			} else {
				dragOffset = 0; // snap back (animated by the CSS transition)
			}
		}
	});

	// Stable attachment; wires pointerdown on the toast when swipe is enabled.
	const dragReference = (node: HTMLElement) => untrack(() => drag.reference?.(node));

	// Fade the toast as it's dragged toward dismissal.
	const dragOpacity = $derived(
		dragging && dragOffset * swipe.dir > 0 ? Math.max(0.2, 1 - (dragOffset * swipe.dir) / 140) : 1
	);
</script>

<li
	data-color={toast.opts.color || 'neutral'}
	bind:this={toast.element}
	bind:clientHeight={toast.height}
	{...attachments}
	{@attach dragReference}
	onpointerenter={onPointerEnter}
	ontransitionend={(e) => {
		if (e.propertyName === 'translate' && toast.hovered && index === 0) {
			updateArea();
		}
	}}
	onintroend={() => {
		toast.opts.onAfterOpen?.(toast);
		updateArea();
	}}
	onoutroend={() => {
		// The toaster dialog can only close once the LAST toast has finished its
		// exit animation — checking on intro (as before) never fires with 0 toasts.
		toast.toaster.maybeCloseToaster();
		updateArea();
	}}
	out:in_out={toast.animations.out}
	in:in_out={toast.animations.in}
	aria-live={toast.opts.important ? 'assertive' : 'polite'}
	aria-atomic="true"
	role={toast.opts.important ? 'alert' : 'status'}
	tabIndex={hidden ? -1 : 0}
	aria-hidden={hidden}
	style:opacity={hidden ? 0 : dragOpacity}
	style:pointer-events={hidden ? 'none' : undefined}
	style:touch-action={swipeEnabled ? 'none' : undefined}
	style:cursor={dragging ? 'grabbing' : swipeEnabled ? 'grab' : undefined}
	style:user-select={dragging ? 'none' : undefined}
	class={classes.root({
		richColors: toast.opts.richColors,
		color: toast.opts.color,
		size: toast.opts.size,
		banner: isBanner
	})}
	style:scale={toast.stacked ? Math.pow(0.97, reversedIndex).toFixed(4) : '1'}
	style:translate="{swipe.axis === 'x' ? dragOffset : 0}px {toast.translateY +
		(swipe.axis === 'y' ? dragOffset : 0)}px"
	style:transition={dragging ? 'none' : undefined}
	style={toast.actualizedPosition[2]}
	onclick={toast.opts.dismissible && toast.opts.closeOnClick ? () => toast.remove() : null}
>
	{#if icon || toast.loading}
		<div
			class={classes.prefix({
				size: toast.opts.size,
				color: toast.opts.color,
				richColors: toast.opts.richColors
			})}
		>
			{#if toast.loading}
				<Spinner color={spinnerColor} size={toast.opts.size ?? 'normal'} decorative />
			{:else}
				<Slot render={icon ?? undefined} />
			{/if}
		</div>
	{/if}
	<div
		class={classes.content({
			size: toast.opts.size,
			color: toast.opts.color,
			richColors: toast.opts.richColors
		})}
	>
		<Slot
			class={classes.title({
				size: toast.opts.size,
				color: toast.opts.color,
				richColors: toast.opts.richColors
			})}
			render={toast.opts.title}
		/>
		<Slot
			class={classes.description({
				size: toast.opts.size,
				color: toast.opts.color,
				richColors: toast.opts.richColors
			})}
			render={toast.opts.description}
		/>
	</div>
	{#if toast.opts.actions?.length}
		<div class={classes.actions()}>
			{#each toast.opts.actions as action, i (i)}
				{@const { content: label, dismiss, onclick, ...buttonProps } = action}
				<Button
					size="small"
					variant="soft"
					{...buttonProps}
					onclick={(event) => {
						onclick?.(event);
						// A manual dismiss fires onDismiss, never onAutoDismiss — so an Undo
						// action here cancels the deferred commit just by closing early.
						if (dismiss !== false) toast.remove();
					}}
				>
					{label}
				</Button>
			{/each}
		</div>
	{/if}
	<Slot
		render={toast.opts.suffix}
		class={classes.suffix({
			size: toast.opts.size,
			color: toast.opts.color,
			richColors: toast.opts.richColors
		})}
	/>
	{#if toast.opts.showCloseIcon && toast.opts.dismissible}
		<button
			type="button"
			aria-label={`${t.dismiss} ${t.notification}`}
			class={classes.closeIcon({
				richColors: toast.opts.richColors,
				color: toast.opts.color,
				size: toast.opts.size
			})}
			onclick={(e) => {
				e.stopPropagation();
				toast.remove();
			}}
		>
			<Slot render={toast.opts.closeIcon || xIcon} />
		</button>
	{/if}
	{#if toast.opts.progress && toast.timer}
		<div class={classes.progress()}>
			<div class="bg-color h-full" style:width="{progressPercent}%"></div>
		</div>
	{/if}
</li>
