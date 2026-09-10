<script lang="ts">
	import Button from '../Button/Button.svelte';
	import { arrowsInIcon } from '../Icons/arrowsIn.js';
	import { arrowsOutIcon } from '../Icons/arrowsOut.js';
	import { cornersOutIcon } from '../Icons/cornersOut.js';
	import { downloadSimpleIcon } from '../Icons/downloadSimple.js';
	import { magnifyingGlassMinusIcon } from '../Icons/magnifyingGlassMinus.js';
	import { magnifyingGlassPlusIcon } from '../Icons/magnifyingGlassPlus.js';
	import Skeleton from '../Skeleton/Skeleton.svelte';
	import type { MermaidProps } from './mermaid.props.js';
	import { MermaidState } from './mermaid.state.svelte.js';
	import { useMermaidTheme } from './mermaid.theme.js';

	let {
		chart,
		config,
		controls = true,
		mouseWheelZoom = true,
		errorForgiving = false,
		size = 'normal',
		onRender,
		onError,
		class: className,
		theme,
		...attachments
	}: MermaidProps = $props();

	const state = new MermaidState({
		get chart() {
			return chart;
		},
		get config() {
			return config;
		},
		get mouseWheelZoom() {
			return mouseWheelZoom;
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

	// Resolve the granular control flags from the boolean-or-object prop.
	const has = (name: 'fit' | 'zoomIn' | 'zoomOut' | 'expand' | 'download') => {
		if (typeof controls === 'boolean') return controls;
		return controls[name] !== false;
	};
	const showBar = $derived(
		controls !== false &&
			(has('fit') || has('zoomIn') || has('zoomOut') || has('expand') || has('download'))
	);

	const buttonProps = { variant: 'ghost' as const, color: 'neutral' as const, size: 'small' as const, squared: true };
</script>

<div class={classes.root({ size, className })} {...attachments}>
	{#if showBar}
		<div class={classes.buttons()} data-panzoom-ignore>
			{#if has('fit')}
				<Button {...buttonProps} label="Zoom to fit" onclick={state.zoomToFit} prefix={cornersOutIcon} />
			{/if}
			{#if has('zoomOut')}
				<Button {...buttonProps} label="Zoom out" onclick={state.zoomOut} prefix={magnifyingGlassMinusIcon} />
			{/if}
			{#if has('zoomIn')}
				<Button {...buttonProps} label="Zoom in" onclick={state.zoomIn} prefix={magnifyingGlassPlusIcon} />
			{/if}
			{#if has('expand')}
				<Button
					{...buttonProps}
					label={state.expanded ? 'Exit fullscreen' : 'Fullscreen'}
					onclick={state.toggleExpand}
					prefix={state.expanded ? arrowsInIcon : arrowsOutIcon}
				/>
			{/if}
			{#if has('download')}
				<Button {...buttonProps} label="Download SVG" onclick={() => state.downloadSvg()} prefix={downloadSimpleIcon} />
			{/if}
		</div>
	{/if}

	<div class={classes.container()}>
		<!-- Hide the empty host from AT while loading/error/empty so it isn't announced
		     as a phantom "Mermaid diagram" image next to the skeleton or alert. -->
		<svg
			class={classes.svg()}
			{@attach state.svgAttachment}
			role="img"
			aria-label="Mermaid diagram"
			aria-busy={state.loading}
			aria-hidden={state.loading || !!state.error || !chart?.trim() ? 'true' : undefined}
		></svg>
	</div>

	{#if state.error}
		<div class={classes.error()} role="alert" aria-live="assertive">
			{state.error.message}
		</div>
	{:else if state.loading}
		<Skeleton class={classes.skeleton()} />
	{/if}
</div>
