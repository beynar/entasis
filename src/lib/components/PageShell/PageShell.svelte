<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import type { PageShellProps } from './pageShell.props.js';
	import PageShellFooter from './PageShellFooter.svelte';
	import PageShellHeader from './PageShellHeader.svelte';
	import { PageShellState } from './pageShell.state.svelte.js';
	import { usePageShellTheme } from './pageShell.theme.js';

	let {
		ref = $bindable(),
		title,
		subtitle,
		eyebrow,
		breadcrumbs,
		breadcrumbsMaxItems = 4,
		back,
		header,
		headerActions,
		subheader,
		footer,
		footerActions,
		contentPadding = 'none',
		contentWidth = 'full',
		actionOverflow = 'auto',
		mobileActionCount = 1,
		children,
		class: className,
		label,
		theme,
		...attachments
	}: PageShellProps = $props();

	let isContentScrolled = $state(false);

	const trackPageScroll: Attachment<HTMLElement> = (node) => {
		const scrollContainer = isScrollContainer(node) ? node : findScrollContainer(node);
		const update = () => {
			isContentScrolled = scrollContainer ? scrollContainer.scrollTop > 0 : window.scrollY > 0;
		};

		update();
		const target = scrollContainer ?? window;
		target.addEventListener('scroll', update, { passive: true });

		return () => target.removeEventListener('scroll', update);
	};

	const shell = new PageShellState({
		get eyebrow() {
			return eyebrow;
		},
		get breadcrumbs() {
			return breadcrumbs;
		},
		get breadcrumbsMaxItems() {
			return breadcrumbsMaxItems;
		},
		get back() {
			return back;
		},
		get title() {
			return title;
		},
		get subtitle() {
			return subtitle;
		},
		get header() {
			return header;
		},
		get headerActions() {
			return headerActions;
		},
		get subheader() {
			return subheader;
		},
		get footer() {
			return footer;
		},
		get footerActions() {
			return footerActions;
		},
		get contentPadding() {
			return contentPadding;
		},
		get contentWidth() {
			return contentWidth;
		},
		get actionOverflow() {
			return actionOverflow;
		},
		get mobileActionCount() {
			return mobileActionCount;
		},
		get isContentScrolled() {
			return isContentScrolled;
		}
	});

	const classes = $derived(usePageShellTheme(theme));

	// The subheader follows the header: pinned under it while it is sticky, at its measured height.
	let headerSticky = $state(false);
	let headerHeight = $state(0);

	const followHeader: Attachment<HTMLElement> = (node) => {
		void shell.hasHeader;
		const header = node.parentElement?.querySelector<HTMLElement>(
			':scope > [data-slot="page-shell-header"]'
		);
		if (!header) {
			headerSticky = false;
			headerHeight = 0;
			return;
		}
		const measure = () => {
			headerSticky = getComputedStyle(header).position === 'sticky';
			headerHeight = header.offsetHeight;
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(header);
		return () => observer.disconnect();
	};

	function findScrollContainer(node: HTMLElement) {
		let parent = node.parentElement;
		while (parent && parent !== document.documentElement) {
			if (/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) return parent;
			parent = parent.parentElement;
		}
		return null;
	}

	function isScrollContainer(node: HTMLElement) {
		return /(auto|scroll)/.test(getComputedStyle(node).overflowY);
	}
</script>

<div
	bind:this={ref}
	data-slot="page-shell"
	data-scrolled={isContentScrolled ? 'true' : undefined}
	class={classes.root({ className })}
	{...attachments}
>
	{#if shell.hasHeader}
		<PageShellHeader api={shell.api} {theme} />
	{/if}

	{#if shell.api.subheader}
		<div
			{@attach followHeader}
			data-slot="page-shell-subheader"
			data-sticky={headerSticky ? 'true' : undefined}
			style:--page-shell-header-height={`${headerHeight}px`}
			class={classes.subheader({ sticky: headerSticky })}
		>
			{@render shell.api.subheader(shell.api)}
		</div>
	{/if}

	<main
		{@attach trackPageScroll}
		aria-label={label}
		data-slot="page-shell-content"
		class={classes.content()}
	>
		<div
			data-slot="page-shell-content-inner"
			class={classes.contentInner({
				padding: shell.api.contentPadding ?? 'none',
				width: shell.api.contentWidth ?? 'full'
			})}
		>
			{@render children(shell.api)}
		</div>
	</main>

	{#if shell.hasFooter}
		<PageShellFooter api={shell.api} {theme} />
	{/if}
</div>
