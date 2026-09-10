<script lang="ts">
	import { transitionSize } from '$lib/attachments/transitionSize.js';
	import { flip } from 'svelte/animate';
	import { scale } from 'svelte/transition';
	import Hitbox from '../Hitbox/Hitbox.svelte';
	import Slot from '../Slot/Slot.svelte';
	import { caretDoubleLeftIcon } from '../Icons/caretDoubleLeft.js';
	import { caretDoubleRightIcon } from '../Icons/caretDoubleRight.js';
	import { caretLeftIcon } from '../Icons/caretLeft.js';
	import { caretRightIcon } from '../Icons/caretRight.js';
	import { dotsThreeIcon } from '../Icons/dotsThree.js';
	import { PaginationState } from './pagination.state.svelte.js';
	import type {
		PaginationControlType,
		PaginationProps,
		PaginationSummaryPayload
	} from './pagination.props.js';
	import { usePaginationTheme } from './pagination.theme.js';

	type NavigationControlType = Exclude<PaginationControlType, 'page'>;
	type PaginationRenderItem =
		| {
				key: `control:${NavigationControlType}`;
				kind: 'control';
				control: NavigationControlType;
				targetPage: number;
				disabled: boolean;
				icon: NonNullable<PaginationProps['first']>;
		  }
		| {
				key: `page:${number}`;
				kind: 'page';
				pageNumber: number;
				display: 'page' | 'dot';
		  }
		| { key: 'ellipsis-start' | 'ellipsis-end'; kind: 'ellipsis' }
		| { key: 'summary:count'; kind: 'count'; payload: PaginationSummaryPayload }
		| { key: 'summary:compact'; kind: 'compact' };

	let {
		ref = $bindable(),
		page = $bindable(1),
		totalPages,
		totalItems,
		pageSize,
		siblingCount = 1,
		boundaryCount = 1,
		showFirstLast = false,
		showPrevNext = true,
		showSummary = false,
		disabled = false,
		color = 'primary',
		size = 'normal',
		variant = 'pages',
		controlVariant = 'ghost',
		ariaLabel = 'Pagination',
		getHref,
		getItemAriaLabel,
		onPageChange,
		class: className,
		theme,
		first,
		previous,
		next,
		last,
		ellipsis,
		children,
		pageItem,
		summary,
		...attachments
	}: PaginationProps = $props();

	const classes = $derived(usePaginationTheme(theme));
	const pagination = new PaginationState({
		get page() {
			return page;
		},
		set page(value) {
			page = value;
		},
		get totalPages() {
			return totalPages;
		},
		get totalItems() {
			return totalItems;
		},
		get pageSize() {
			return pageSize;
		},
		get siblingCount() {
			return siblingCount;
		},
		get boundaryCount() {
			return boundaryCount;
		},
		get disabled() {
			return disabled;
		},
		get getHref() {
			return getHref;
		},
		get getItemAriaLabel() {
			return getItemAriaLabel;
		},
		get onPageChange() {
			return onPageChange;
		}
	});
	const firstIcon = caretDoubleLeftIcon.withProps({});
	const previousIcon = caretLeftIcon.withProps({});
	const nextIcon = caretRightIcon.withProps({});
	const lastIcon = caretDoubleRightIcon.withProps({});
	const ellipsisIcon = dotsThreeIcon.withProps({});

	const renderItems = $derived.by(() => {
		const items: PaginationRenderItem[] = [];

		if (showFirstLast) {
			items.push({
				key: 'control:first',
				kind: 'control',
				control: 'first',
				targetPage: 1,
				disabled: pagination.isPreviousDisabled,
				icon: first ?? firstIcon
			});
		}
		if (showPrevNext) {
			items.push({
				key: 'control:previous',
				kind: 'control',
				control: 'previous',
				targetPage: pagination.currentPage - 1,
				disabled: pagination.isPreviousDisabled,
				icon: previous ?? previousIcon
			});
		}

		if (variant === 'pages') {
			for (const paginationItem of pagination.items) {
				items.push(
					typeof paginationItem === 'number'
						? {
								key: `page:${paginationItem}`,
								kind: 'page',
								pageNumber: paginationItem,
								display: 'page'
							}
						: { key: paginationItem, kind: 'ellipsis' }
				);
			}
		} else if (variant === 'count' && pagination.summary) {
			items.push({ key: 'summary:count', kind: 'count', payload: pagination.summary });
		} else if (variant === 'compact') {
			items.push({ key: 'summary:compact', kind: 'compact' });
		} else if (variant === 'dots') {
			for (let pageNumber = 1; pageNumber <= pagination.pageCount; pageNumber += 1) {
				items.push({ key: `page:${pageNumber}`, kind: 'page', pageNumber, display: 'dot' });
			}
		}

		if (showPrevNext) {
			items.push({
				key: 'control:next',
				kind: 'control',
				control: 'next',
				targetPage: pagination.currentPage + 1,
				disabled: pagination.isNextDisabled,
				icon: next ?? nextIcon
			});
		}
		if (showFirstLast) {
			items.push({
				key: 'control:last',
				kind: 'control',
				control: 'last',
				targetPage: pagination.pageCount,
				disabled: pagination.isNextDisabled,
				icon: last ?? lastIcon
			});
		}

		return items;
	});
</script>

{#snippet defaultSummary(payload: PaginationSummaryPayload)}
	{payload.startItem}-{payload.endItem} of {payload.totalItems}
{/snippet}

{#if pagination.hasPages}
	<nav
		bind:this={ref}
		aria-label={ariaLabel}
		data-slot="pagination"
		data-color={color}
		data-size={size}
		data-variant={variant}
		data-control-variant={controlVariant}
		class={classes.root({ className })}
		{@attach transitionSize({ axis: 'both', duration: 200 })}
		{...attachments}
	>
		{#if children}
			{@render children(pagination)}
		{:else}
			{#if variant !== 'count' && pagination.summary && (showSummary || summary)}
				<Slot
					as="span"
					render={summary ?? defaultSummary}
					class={classes.summary({ size })}
					payload={pagination.summary}
				/>
			{/if}

			<ul class={classes.list({ size, variant })}>
				{#each renderItems as item (item.key)}
					<li
						class={classes.item({
							size,
							display: item.kind === 'page' ? item.display : 'page'
						})}
						aria-live={item.kind === 'count' ? 'polite' : undefined}
						animate:flip={{ duration: 200 }}
						in:scale={{ duration: 150, start: 0.8 }}
						out:scale={{ duration: 100, start: 0.8 }}
					>
						{#if item.kind === 'control'}
							<svelte:element
								this={pagination.controlElement}
								role={pagination.controlElement === 'button' ? 'button' : 'link'}
								type={pagination.controlElement === 'button' ? 'button' : undefined}
								href={pagination.getPageHref(item.targetPage, item.disabled)}
								aria-label={pagination.getControlAriaLabel(
									item.control,
									item.targetPage,
									false,
									item.disabled
								)}
								aria-disabled={item.disabled ? 'true' : undefined}
								disabled={pagination.controlElement === 'button' ? item.disabled : undefined}
								data-disabled={item.disabled}
								class={classes.control({
									size,
									color,
									controlVariant,
									active: false,
									disabled: item.disabled,
									control: 'icon'
								})}
								onclick={(event: MouseEvent) =>
									pagination.handleControlClick(event, item.targetPage, item.disabled)}
							>
								<Slot as="span" render={item.icon} class={classes.icon({ size })} />
							</svelte:element>
						{:else if item.kind === 'page'}
							{@const isActive = item.pageNumber === pagination.currentPage}
							{@const isDisabled = disabled || !pagination.hasPages}
							<svelte:element
								this={pagination.controlElement}
								role={pagination.controlElement === 'button' ? 'button' : 'link'}
								type={pagination.controlElement === 'button' ? 'button' : undefined}
								href={pagination.getPageHref(item.pageNumber, isDisabled)}
								aria-label={pagination.getControlAriaLabel(
									'page',
									item.pageNumber,
									isActive,
									isDisabled
								)}
								aria-current={isActive ? 'page' : undefined}
								aria-disabled={isDisabled ? 'true' : undefined}
								disabled={pagination.controlElement === 'button' ? isDisabled : undefined}
								data-active={isActive}
								data-disabled={isDisabled}
								data-page={item.pageNumber}
								data-display={item.display}
								class={item.display === 'dot'
									? classes.dot({ size, color, active: isActive, disabled: isDisabled })
									: classes.control({
											size,
											color,
											controlVariant,
											active: isActive,
											disabled: isDisabled
										})}
								onclick={(event: MouseEvent) =>
									pagination.handleControlClick(event, item.pageNumber, isDisabled)}
							>
								{#if item.display === 'dot'}
									<Hitbox {size} />
								{:else if pageItem}
									<Slot
										render={pageItem}
										payload={pagination.getPageItemPayload(item.pageNumber, isActive, isDisabled)}
									/>
								{:else}
									{item.pageNumber}
								{/if}
							</svelte:element>
						{:else if item.kind === 'ellipsis'}
							<span aria-hidden="true" class={classes.ellipsis({ size })}>
								<Slot
									as="span"
									render={ellipsis ?? ellipsisIcon}
									class={classes.icon({ size })}
									payload={{}}
								/>
							</span>
						{:else if item.kind === 'count'}
							<Slot
								as="span"
								render={summary ?? defaultSummary}
								class={classes.summary({ size })}
								payload={item.payload}
							/>
						{:else}
							<span aria-live="polite" class={classes.summary({ size })}>
								Page {pagination.currentPage} of {pagination.pageCount}
							</span>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</nav>
{/if}
