<script lang="ts">
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import Button from '../Button/Button.svelte';
	import { useTheme } from '../Theme/theme.state.svelte.js';
	import type { TooltipProps } from './tooltip.props.js';
	import { tooltip } from './tooltip.attachment.svelte.js';

	let {
		trigger,
		open = $bindable(),
		defaultOpen = false,
		onOpenChange,
		...options
	}: TooltipProps = $props();

	const theme = useTheme();
	const openState = createBindableValue(
		() => open,
		(next) => {
			open = next;
		},
		() => defaultOpen
	);

	// The primitive owns hover, focus and `aria-describedby`; the component only hands it an
	// element and keeps that element around so `open` can seed the shared surface directly.
	// The rest object from `$props()` stays reactive, so the primitive reads live option values.
	// svelte-ignore state_referenced_locally
	const attachTooltip = tooltip(options);
	let element = $state<HTMLElement | null>(null);

	const attach: Attachment<HTMLElement> = (node) => {
		element = node;
		const cleanup = attachTooltip(node);
		return () => {
			if (element === node) element = null;
			cleanup?.();
		};
	};

	// One surface is shared by every tooltip, and hover or focus can move it at any time. Both
	// derived values are booleans that stay stable while this tooltip owns the surface, so seeding
	// the surface below never re-triggers the effects that seeded it.
	const displayed = $derived(theme.tooltip !== null && theme.tooltip.ref === element);
	const surfaceTaken = $derived(theme.tooltip !== null && theme.tooltip.ref !== element);

	// Hover and focus move the surface without asking, so mirror what it shows back into the
	// controlled state. Only real surface changes are reported, never the caller's own request.
	let shown = false;
	$effect(() => {
		const next = displayed;
		if (next === shown) return;
		shown = next;
		untrack(() => {
			if (openState.value === next) return;
			openState.value = next;
			onOpenChange?.(next);
		});
	});

	// `open` seeds the shared surface; a tooltip hovered elsewhere keeps it until it closes.
	$effect(() => {
		if (!element || !openState.value || surfaceTaken) return;
		const ref = element;
		theme.tooltip = { ...options, ref };
		return () => {
			if (theme.tooltip?.ref !== ref) return;
			theme.tooltip = null;
			theme.lastTooltipClosed = Date.now();
		};
	});
</script>

{#if typeof trigger === 'function'}
	{@render trigger(attach)}
{:else}
	{@const { content: triggerContent, ...buttonProps } = trigger}
	<Button {...buttonProps} {@attach attach}>
		{triggerContent}
	</Button>
{/if}
