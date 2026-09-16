<script lang="ts">
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import Button from '../Button/Button.svelte';
	import Dialog from '../Dialog/Dialog.svelte';
	import { arrowsOutIcon } from '../Icons/arrowsOut.js';
	import { cornersOutIcon } from '../Icons/cornersOut.js';
	import { downloadSimpleIcon } from '../Icons/downloadSimple.js';
	import { magnifyingGlassMinusIcon } from '../Icons/magnifyingGlassMinus.js';
	import { magnifyingGlassPlusIcon } from '../Icons/magnifyingGlassPlus.js';
	import Skeleton from '../Skeleton/Skeleton.svelte';
	import type { MermaidProps } from './mermaid.props.js';
	import { MermaidState } from './mermaid.state.svelte.js';
	import { useMermaidTheme } from './mermaid.theme.js';
	import Mermaid from './Mermaid.svelte';

	let {
		chart,
		config,
		controls = true,
		mouseWheelZoom = true,
		touchPan = false,
		errorForgiving = false,
		size = 'normal',
		onRender,
		onError,
		class: className,
		theme,
		...attachments
	}: MermaidProps = $props();

	const diagram = new MermaidState({
		get chart() {
			return chart;
		},
		get config() {
			return config;
		},
		get mouseWheelZoom() {
			return mouseWheelZoom;
		},
		get touchPan() {
			return touchPan;
		},
		get errorForgiving() {
			return errorForgiving;
		},
		get onRender() {
			return onRender;
		},
		get onError() {
			return onError;
		}
	});

	const classes = $derived(useMermaidTheme(theme));
	const t = $derived(useI18n());

	// Resolve the granular control flags from the boolean-or-object prop.
	const has = (name: 'fit' | 'zoomIn' | 'zoomOut' | 'expand' | 'download') => {
		if (typeof controls === 'boolean') return controls;
		return controls[name] !== false;
	};
	const showBar = $derived(
		controls !== false &&
			(has('fit') || has('zoomIn') || has('zoomOut') || has('expand') || has('download'))
	);

	const buttonProps = {
		variant: 'ghost' as const,
		color: 'neutral' as const,
		size: 'small' as const,
		squared: true
	};

	// Fullscreen is a `fullScreen` Dialog hosting a second instance of the same diagram
	// (own panzoom, wheel zoom without the hover dwell, single-finger pan), so it gets
	// the layer stack, focus trap, scroll lock and Escape handling for free.
	let expanded = $state(false);
</script>

<div class={classes.root({ size, className })} {...attachments}>
	{#if showBar}
		<div class={classes.buttons()} data-panzoom-ignore>
			{#if has('fit')}
				<Button
					{...buttonProps}
					label={t.zoomToFit}
					onclick={diagram.zoomToFit}
					prefix={cornersOutIcon}
				/>
			{/if}
			{#if has('zoomOut')}
				<Button
					{...buttonProps}
					label={t.zoomOut}
					onclick={diagram.zoomOut}
					prefix={magnifyingGlassMinusIcon}
				/>
			{/if}
			{#if has('zoomIn')}
				<Button
					{...buttonProps}
					label={t.zoomIn}
					onclick={diagram.zoomIn}
					prefix={magnifyingGlassPlusIcon}
				/>
			{/if}
			{#if has('expand')}
				<Button
					{...buttonProps}
					label={t.fullscreen}
					onclick={() => (expanded = true)}
					prefix={arrowsOutIcon}
				/>
			{/if}
			{#if has('download')}
				<Button
					{...buttonProps}
					label={t.downloadSvg}
					onclick={() => diagram.downloadSvg()}
					prefix={downloadSimpleIcon}
				/>
			{/if}
		</div>
	{/if}

	<div class={classes.container()}>
		<!-- Hide the empty host from AT while loading/error/empty so it isn't announced
		     as a phantom "Mermaid diagram" image next to the skeleton or alert. -->
		<svg
			class={classes.svg()}
			{@attach diagram.svgAttachment}
			role="img"
			aria-label={t.mermaidDiagram}
			aria-busy={diagram.loading}
			aria-hidden={diagram.loading || !!diagram.error || !chart?.trim() ? 'true' : undefined}
		></svg>
	</div>

	{#if diagram.error}
		<div class={classes.error()} role="alert" aria-live="assertive">
			{diagram.error.message}
		</div>
	{:else if diagram.loading}
		<Skeleton class={classes.skeleton()} />
	{/if}
</div>

{#if has('expand')}
	<Dialog type="fullScreen" bind:open={expanded} closable title={t.mermaidDiagram}>
		<Mermaid
			{chart}
			{config}
			{errorForgiving}
			mouseWheelZoom
			touchPan
			controls={{
				fit: has('fit'),
				zoomIn: has('zoomIn'),
				zoomOut: has('zoomOut'),
				download: has('download'),
				expand: false
			}}
			{theme}
			class="min-h-0 flex-1"
		/>
	</Dialog>
{/if}
