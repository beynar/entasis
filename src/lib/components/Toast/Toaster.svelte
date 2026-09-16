<script lang="ts">
	import { useHotKey } from '$lib/utils/useHotKey.svelte.js';
	import { useSafeArea } from '$lib/utils/safeArea.svelte.js';
	import { Toaster, type ToasterProps } from './toast.state.svelte.js';
	import Toast from './Toast.svelte';
	import { useToastTheme } from './toast.theme.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	let {
		theme,
		collapseHorizontalAxis = { xs: false, sm: true, md: false },
		expand = false,
		visibleToasts = 4,
		gap = 10,
		offset = 20,
		direction,
		position = 'bottom-center',
		perspectiveAmount = 15,
		size,
		closeOnClick = false,
		swipeToDismiss = true,
		showCloseIcon = true,
		duration = 4000,
		dismissible = true,
		richColors = false,
		progress = false,
		prefix,
		suffix,
		closeIcon,
		transition
	}: ToasterProps = $props();

	const t = $derived(useI18n());

	const toaster = new Toaster({
		get collapseHorizontalAxis() {
			return collapseHorizontalAxis;
		},
		get expand() {
			return expand;
		},
		get visibleToasts() {
			return visibleToasts;
		},
		get gap() {
			return gap;
		},
		get offset() {
			return offset;
		},
		get direction() {
			return direction;
		},
		get position() {
			return position;
		},
		get perspectiveAmount() {
			return perspectiveAmount;
		},
		get size() {
			return size;
		},
		get closeOnClick() {
			return closeOnClick;
		},
		get swipeToDismiss() {
			return swipeToDismiss;
		},
		get showCloseIcon() {
			return showCloseIcon;
		},
		get duration() {
			return duration;
		},
		get dismissible() {
			return dismissible;
		},
		get richColors() {
			return richColors;
		},
		get progress() {
			return progress;
		},
		get prefix() {
			return prefix;
		},
		get suffix() {
			return suffix;
		},
		get closeIcon() {
			return closeIcon;
		},
		get transition() {
			return transition;
		},
		get motion() {
			return theme?.motion;
		}
	});

	const setPolygon = useSafeArea({
		isActive: () => !!toaster.hovering,
		offset: 30,
		callback: () => {
			if (toaster.hovering) toaster.toggleTimers(toaster.hovering, 'resume');
			toaster.hovering = null;
		}
	});

	const classes = $derived(useToastTheme(theme));
	// F6 focuses the notification region from anywhere (Sonner's convention).
	const hotkey = useHotKey({
		hotKeys: { f6: () => toaster.element?.focus({ preventScroll: true }) },
		isActive: true,
		onWindow: true
	});
</script>

<!-- A landmark region (not a dialog) so live announcements are not wrapped in a dialog role;
     `data-live-region` keeps it outside any modal's `inert` sweep. F6 jumps to it. -->
<section
	bind:this={toaster.element}
	tabIndex={-1}
	role="region"
	hidden={!toaster.isOpen}
	aria-label={t.notifications}
	data-live-region
	class={classes.toaster()}
	data-hovering={toaster.hovering}
	{@attach hotkey.reference}
>
	{#each toaster.toasts as toast (toast.id)}
		<Toast
			updateArea={() => setPolygon.updateAreas()}
			{@attach setPolygon.reference}
			{theme}
			{toast}
		/>
	{/each}
</section>
