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
	import { mergeToastTheme, useToastTheme, type ToastThemeProps } from './toast.theme.js';
	import type { WithAttachments } from '$lib/types/props.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { tick, untrack } from 'svelte';
	import { createPointerDrag } from '$lib/utils/pointerDrag.js';
	import { createVelocityTracker } from '$lib/utils/swipeVelocity.js';
	import { composeHandlers } from '$lib/utils/handlers.js';
	import { useTheme } from '../Theme/theme.state.svelte.js';

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
		/** The Toaster's component theme overrides. */
		theme?: ToastThemeProps;
	}> = $props();

	const { reversedIndex, index } = $derived(toast.indexInStack);

	// Beyond `visibleToasts`, a toast is faded out — it must also stop being
	// interactive (no pointer events, not focusable) or it invisibly intercepts
	// clicks and tab stops while aria-hidden.
	const hidden = $derived(reversedIndex > (toast.toaster?.visibleToasts ?? 0) - 1);

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

	// The per-toast `theme` option wins over the Toaster's, slot by slot.
	const classes = $derived(useToastTheme(mergeToastTheme(theme, toast.opts.theme)));
	const t = $derived(useI18n());

	// Remaining duration as a percentage, driven by the (reactive, hover-pausable)
	// timer. Only meaningful while a countdown timer exists.
	const progressPercent = $derived(
		toast.timer && toast.timer.delay > 0
			? Math.max(0, Math.min(100, (toast.timer.remaining / toast.timer.delay) * 100))
			: 0
	);

	const in_out = fso();
	const uid = $props.id();
	const titleId = `${uid}-title`;
	const descriptionId = `${uid}-description`;

	// A tap fires compatibility mouse events and a `pointerenter`, but is not a hover: no
	// `pointermove` follows it that would ever release the stack again.
	const onPointerEnter = (event: PointerEvent) => {
		const toaster = toast.toaster;
		const position = toast.opts.position;
		if (!toaster || event.pointerType === 'touch' || toaster.hovering === position) return;
		toaster.setHovering(position);
		updateArea();
	};

	// Keyboard focus holds the stack's timers, as hover does; a click or tap that focuses the toast
	// does not (`:focus-visible` is what tells them apart).
	const isFocusVisible = (target: EventTarget | null) => {
		if (!(target instanceof Element)) return false;
		try {
			return target.matches(':focus-visible');
		} catch {
			// No `:focus-visible`: every focus counts, so a keyboard user is never left behind.
			return true;
		}
	};
	const onFocusIn = (event: FocusEvent) => {
		const toaster = toast.toaster;
		if (!toaster) return;
		toaster.setFocused(isFocusVisible(event.target) ? toast : null);
	};
	const onFocusOut = (event: FocusEvent) => {
		// Moving between the toast's own controls keeps the hold.
		if (event.relatedTarget instanceof Node && toast.element?.contains(event.relatedTarget)) return;
		toast.toaster?.setFocused(null, toast);
	};

	// --- Swipe / drag to dismiss ------------------------------------------------
	// The toast is dragged toward its anchored screen edge: left/right corners swipe
	// horizontally, center positions swipe vertically. Dragging the other way meets
	// resistance. Past the threshold, or released in a flick toward the edge, it dismisses —
	// the exit transition continues from the dragged position since the swipe matches the
	// position's outro.
	const SWIPE_THRESHOLD = 45; // px past which a release dismisses
	const FLICK_VELOCITY = 0.4; // px/ms toward the edge at which a shorter release dismisses
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
	// The click that ends a drag is not a press on the toast (`closeOnClick`). Set when a drag
	// ends; the click consumes it, and the next press clears one that no click followed.
	let suppressClick = false;
	const tracker = createVelocityTracker();
	const axisPos = (event: PointerEvent) => (swipe.axis === 'x' ? event.clientX : event.clientY);

	// The press, or the swipe it became, ends: the stack's timers resume unless something else
	// holds them.
	const release = () => {
		toast.dragging = false;
		if (toast.pressed) {
			toast.pressed = false;
			toast.toaster?.syncHolds();
		}
	};
	// Pressing a toast's own controls (action buttons, the close button, a link in its text) acts
	// on them; only the surface of the toast starts a swipe.
	const SWIPE_IGNORED =
		'button, a[href], input, select, textarea, label, [role="button"], [data-swipe-ignore]';

	// A toast re-added with the id of one still animating out takes this item over. It must
	// not inherit the swipe that dismissed its predecessor, or it rests off its slot.
	$effect.pre(() => {
		if (!toast) return;
		dragOffset = 0;
		untrack(release);
	});

	// Primary button only; a cancelled touch or a lost capture snaps the toast back. A mouse
	// released outside the window ends the drag where the button was last held, so it dismisses
	// or snaps back by the same rule as a normal release.
	const dragAttachment = createPointerDrag({
		disabled: () => !swipeEnabled,
		canStart: (event) => {
			const control = event.target instanceof Element ? event.target.closest(SWIPE_IGNORED) : null;
			return !control || !toast.element?.contains(control);
		},
		// `touch-action` keeps the page scrolling along the axis the swipe does not use, so the
		// browser has to be left to govern touch panning around the gesture.
		preventTouchMove: false,
		// The toast holds buttons, not just a handle: the pointer is captured only once the press
		// becomes a drag, so a press that never travels keeps its click.
		capture: 'on-activate',
		// A press that travels mostly across the swipe axis is spent: it never drags the toast.
		axis: () => swipe.axis,
		onDown: ({ event }) => {
			// A press holds the stack's timers, so a toast does not vanish under a finger.
			toast.pressed = true;
			toast.toaster?.syncHolds();
			suppressClick = false;
			tracker.reset();
			tracker.add(axisPos(event), event.timeStamp);
		},
		// Attributed to the swipe axis (either way along it): the drag starts.
		shouldActivate: () => true,
		onStart: ({ node }) => {
			toast.dragging = true;
			// A mouse press that travelled before it became a drag may have begun selecting text.
			const selection = window.getSelection();
			if (selection && !selection.isCollapsed && node.contains(selection.anchorNode)) {
				selection.removeAllRanges();
			}
		},
		onMove: ({ event, deltaX, deltaY }) => {
			let delta = swipe.axis === 'x' ? deltaX : deltaY;
			// Rubber-band when dragging away from the dismiss direction.
			if (delta * swipe.dir < 0) delta /= 4;
			dragOffset = delta;
			tracker.add(axisPos(event), event.timeStamp);
		},
		onEnd: ({ event }) => {
			release();
			suppressClick = true;
			tracker.add(axisPos(event), event.timeStamp);
			const towardEdge = dragOffset * swipe.dir;
			const flick = tracker.velocity(event.timeStamp) * swipe.dir > FLICK_VELOCITY;
			if (towardEdge > SWIPE_THRESHOLD || (towardEdge > 0 && flick)) {
				toast.remove();
			} else {
				dragOffset = 0; // snap back (animated by the CSS transition)
			}
		},
		onCancel: () => {
			release();
			dragOffset = 0;
		}
	});

	// The toast is announced through the Toaster's persistent live regions rather than as a live
	// region of its own, which screen readers often miss when it is inserted already filled in.
	// Announces on arrival and again whenever the toast is updated, with the text as rendered.
	let contentElement = $state<HTMLElement>();

	// A toast shown again while it is on screen bounces once. It animates the `scale` property, which
	// composes with the `transform` the stack and swipe write, and stays still under reduced motion.
	const motionTheme = useTheme();
	let seenAttention = untrack(() => toast.attentionKey);
	$effect(() => {
		const key = toast.attentionKey;
		if (key === seenAttention) return;
		seenAttention = key;
		const element = untrack(() => toast.element);
		if (!element || typeof element.animate !== 'function') return;
		if (motionTheme?.preferReducesMotion) return;
		element.animate([{ scale: '1' }, { scale: '1.04' }, { scale: '0.98' }, { scale: '1' }], {
			duration: 360,
			easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
		});
	});
	$effect(() => {
		void toast.opts.title;
		void toast.opts.description;
		void toast.opts.important;
		void toast.updateKey;
		const toaster = toast.toaster;
		const important = !!toast.opts.important;
		let cancelled = false;
		tick().then(() => {
			if (cancelled || !contentElement) return;
			const text = [...contentElement.children]
				.map((part) => part.textContent?.trim())
				.filter(Boolean)
				.join('. ');
			toaster?.announce(text, important);
		});
		return () => (cancelled = true);
	});

	// A toast pushed past `visibleToasts` turns inert, and focus on it would drop to the page.
	$effect.pre(() => {
		if (hidden) untrack(() => toast.toaster?.moveFocusFrom(toast));
	});

	// Fade the toast as it's dragged toward dismissal.
	const dragOpacity = $derived(
		toast.dragging && dragOffset * swipe.dir > 0
			? Math.max(0.2, 1 - (dragOffset * swipe.dir) / 140)
			: 1
	);
</script>

<li
	data-color={toast.opts.color || 'neutral'}
	bind:this={toast.element}
	bind:clientHeight={toast.height}
	{...attachments}
	{@attach dragAttachment}
	onpointerenter={onPointerEnter}
	onfocusin={onFocusIn}
	onfocusout={onFocusOut}
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
		toast.toaster?.maybeCloseToaster();
		updateArea();
	}}
	out:in_out={toast.animations.out}
	in:in_out={toast.animations.in}
	data-update-key={toast.updateKey}
	role="group"
	aria-labelledby={toast.opts.title ? titleId : toast.opts.description ? descriptionId : undefined}
	aria-describedby={toast.opts.title && toast.opts.description ? descriptionId : undefined}
	tabIndex={hidden ? -1 : 0}
	inert={hidden}
	style:opacity={hidden ? 0 : dragOpacity}
	style:pointer-events={hidden ? 'none' : undefined}
	style:touch-action={swipeEnabled ? (swipe.axis === 'x' ? 'pan-y' : 'pan-x') : undefined}
	style:cursor={toast.dragging ? 'grabbing' : swipeEnabled ? 'grab' : undefined}
	style:user-select={toast.dragging ? 'none' : undefined}
	class={classes.root({
		richColors: toast.opts.richColors,
		color: toast.opts.color,
		size: toast.opts.size,
		banner: isBanner
	})}
	style:scale={toast.stacked ? Math.pow(0.97, reversedIndex).toFixed(4) : '1'}
	style:translate="{swipe.axis === 'x' ? dragOffset : 0}px {toast.translateY +
		(swipe.axis === 'y' ? dragOffset : 0)}px"
	style:transition={toast.dragging ? 'none' : undefined}
	style={toast.actualizedPosition[2]}
	onclick={toast.opts.dismissible && toast.opts.closeOnClick
		? () => {
				if (suppressClick) suppressClick = false;
				else toast.remove();
			}
		: null}
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
		bind:this={contentElement}
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
			attrs={{ id: titleId }}
		/>
		<Slot
			class={classes.description({
				size: toast.opts.size,
				color: toast.opts.color,
				richColors: toast.opts.richColors
			})}
			render={toast.opts.description}
			attrs={{ id: descriptionId }}
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
					onclick={composeHandlers(onclick, () => {
						// A manual dismiss fires onDismiss, never onAutoDismiss — so an Undo
						// action here cancels the deferred commit just by closing early. The
						// action's own handler runs first; `event.preventDefault()` keeps the toast.
						if (dismiss !== false) toast.remove();
					})}
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
		<div class={classes.progress({ size: toast.opts.size, banner: isBanner })}>
			<div class="bg-color h-full" style:width="{progressPercent}%"></div>
		</div>
	{/if}
</li>
