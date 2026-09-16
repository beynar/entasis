<script lang="ts">
	import type { ResizableProps } from './resizable.props.js';
	import { ResizableState } from './resizable.state.svelte.js';
	import { useResizableTheme } from './resizable.theme.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		id: customId,
		ref = $bindable(),
		panels,
		sizes = $bindable(),
		collapsedPanels = $bindable([]),
		storageKey,
		orientation,
		direction,
		handle = false,
		handleVariant = 'grip',
		showLines = true,
		variant = 'default',
		dir,
		disabled,
		disabledHandles,
		keyboardStep,
		resetOnDoubleClick = true,
		class: className,
		theme,
		onResize,
		onLayoutChange,
		onLayoutCommit,
		onCollapsedPanelsChange,
		getHandleAriaLabel,
		...attachments
	}: ResizableProps = $props();
	const t = $derived(useI18n());

	const gripDots = [0, 1, 2, 3, 4, 5];

	const generatedId = $props.id();
	const resolvedOrientation = $derived(orientation ?? direction ?? 'horizontal');
	const resolvedHandleVariant = $derived(handle ? handleVariant : 'grip');
	const classes = $derived(useResizableTheme(theme));
	const resizable = new ResizableState({
		get id() {
			return customId || generatedId;
		},
		get panels() {
			return panels;
		},
		get sizes() {
			return sizes;
		},
		set sizes(nextSizes) {
			sizes = nextSizes;
		},
		get collapsedPanels() {
			return collapsedPanels;
		},
		set collapsedPanels(nextPanelIds) {
			collapsedPanels = nextPanelIds;
		},
		get storageKey() {
			return storageKey;
		},
		get orientation() {
			return resolvedOrientation;
		},
		get dir() {
			return dir;
		},
		get disabled() {
			return disabled;
		},
		get disabledHandles() {
			return disabledHandles;
		},
		get keyboardStep() {
			return keyboardStep;
		},
		onResize: (nextSizes) => onResize?.(nextSizes),
		onLayoutChange: (nextSizes) => onLayoutChange?.(nextSizes),
		onLayoutCommit: (payload) => onLayoutCommit?.(payload),
		onCollapsedPanelsChange: (panelIds) => onCollapsedPanelsChange?.(panelIds)
	});

	const getDefaultHandleAriaLabel = (index: number) => {
		const payload = resizable.handleAriaLabelPayload(index);
		if (payload.collapsedBefore) return t.expandPanel(index + 1);
		if (payload.collapsedAfter) return t.expandPanel(index + 2);
		return t.resizePanels(index + 1, index + 2);
	};
</script>

<div
	id={resizable.id}
	bind:this={ref}
	{@attach resizable.root}
	data-slot="resizable-panel-group"
	data-panel-group-direction={resolvedOrientation}
	data-variant={variant}
	role="group"
	aria-disabled={disabled}
	{dir}
	class={classes.root({
		orientation: resolvedOrientation,
		variant,
		dragging: resizable.isDragging,
		disabled,
		className
	})}
	{...attachments}
>
	{#each panels as panel, index (panel.id ?? index)}
		<div
			id={resizable.panelId(index)}
			data-slot="resizable-panel"
			data-panel={resizable.panelId(index)}
			data-disabled={panel.disabled ? 'true' : undefined}
			data-collapsed={resizable.isPanelCollapsed(index) ? 'true' : undefined}
			data-animating={resizable.isAnimating ? 'true' : undefined}
			aria-hidden={resizable.isPanelCollapsed(index) || undefined}
			inert={resizable.isPanelCollapsed(index) || undefined}
			class={classes.panel({ variant, animating: resizable.isAnimating, className: panel.class })}
			style={resizable.panelStyle(index)}
		>
			{@render panel.content(resizable.panelPayload(index))}
		</div>

		{#if index < panels.length - 1}
			{@const handleState = resizable.handlePayload(index)}
			<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
			<div
				role="separator"
				tabindex={handleState.disabled ? -1 : 0}
				aria-orientation={handleState.separatorOrientation}
				aria-valuenow={handleState.size}
				aria-valuemin={handleState.min}
				aria-valuemax={handleState.max}
				aria-controls={`${resizable.panelId(index)} ${resizable.panelId(index + 1)}`}
				aria-disabled={handleState.disabled}
				aria-label={getHandleAriaLabel?.(resizable.handleAriaLabelPayload(index)) ??
					getDefaultHandleAriaLabel(index)}
				data-slot="resizable-handle"
				data-dragging={handleState.dragging ? 'true' : undefined}
				data-disabled={handleState.disabled ? 'true' : undefined}
				data-lines={showLines ? 'true' : 'false'}
				data-collapsed-before={handleState.collapsedBefore ? 'true' : undefined}
				data-collapsed-after={handleState.collapsedAfter ? 'true' : undefined}
				class={classes.handle({
					orientation: resolvedOrientation,
					variant,
					lines: showLines,
					handleVariant: resolvedHandleVariant
				})}
				{@attach resizable.handle(index)}
				onclick={() => resizable.handleClick(index)}
				ondblclick={(event) => {
					if (!resetOnDoubleClick) return;
					event.preventDefault();
					resizable.resetHandle(index);
				}}
				onkeydown={(event) => resizable.handleKeydown(event, index)}
			>
				{#if handle}
					<span
						data-handle-variant={resolvedHandleVariant}
						class={classes.grip({
							orientation: resolvedOrientation,
							handleVariant: resolvedHandleVariant
						})}
						aria-hidden="true"
					>
						{#if resolvedHandleVariant === 'grip'}
							{#each gripDots as dotIndex (dotIndex)}
								<span class={classes.gripDot({ orientation: resolvedOrientation })}></span>
							{/each}
						{/if}
					</span>
				{/if}
			</div>
		{/if}
	{/each}
</div>
