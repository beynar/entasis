<script lang="ts">
	import { PageShell, type PageShellApi } from '$lib/components/PageShell/index.js';
	import { Sidebar } from '$lib/components/Sidebar/index.js';
	import { cx } from '$lib/utils/cva/index.js';
	import type { AppShellProps } from './appShell.props.js';
	import { useAppShellTheme } from './appShell.theme.js';

	let {
		ref = $bindable(),
		sidebar = {},
		variant = 'admin',
		eyebrow,
		breadcrumbs,
		breadcrumbsMaxItems,
		back,
		label,
		title,
		subtitle,
		header,
		headerActions,
		footer,
		footerActions,
		contentPadding,
		contentWidth,
		actionOverflow,
		mobileActionCount,
		children: pageContent,
		class: className,
		pageShellTheme,
		theme,
		...attachments
	}: AppShellProps = $props();

	const classes = $derived(useAppShellTheme(theme));
</script>

<div
	bind:this={ref}
	data-slot="app-shell"
	data-sidebar-variant={variant}
	data-sidebar-side={sidebar.side ?? 'left'}
	class={classes.root({ variant, className })}
	{...attachments}
>
	<div data-slot="app-shell-frame" class={classes.frame({ variant })}>
		<Sidebar
			{...sidebar}
			{variant}
			frame="contained"
			mode="layout"
			class={cx('h-full min-h-0', sidebar.class)}
		>
			{#snippet children(sidebarApi)}
				{#snippet appHeader(pageShell: PageShellApi)}
					{#if header}
						{@render header({ pageShell, sidebar: sidebarApi })}
					{/if}
				{/snippet}

				{#snippet appHeaderActions(pageShell: PageShellApi)}
					{#if headerActions && !Array.isArray(headerActions)}
						{@render headerActions({ pageShell, sidebar: sidebarApi })}
					{/if}
				{/snippet}

				{#snippet appBack(pageShell: PageShellApi)}
					{#if typeof back === 'function'}
						{@render back({ pageShell, sidebar: sidebarApi })}
					{/if}
				{/snippet}

				{#snippet appBreadcrumbs(pageShell: PageShellApi)}
					{#if breadcrumbs && !Array.isArray(breadcrumbs)}
						{@render breadcrumbs({ pageShell, sidebar: sidebarApi })}
					{/if}
				{/snippet}

				{#snippet appFooter(pageShell: PageShellApi)}
					{#if footer}
						{@render footer({ pageShell, sidebar: sidebarApi })}
					{/if}
				{/snippet}

				{#snippet appFooterActions(pageShell: PageShellApi)}
					{#if footerActions && !Array.isArray(footerActions)}
						{@render footerActions({ pageShell, sidebar: sidebarApi })}
					{/if}
				{/snippet}

				<PageShell
					{eyebrow}
					breadcrumbs={Array.isArray(breadcrumbs)
						? breadcrumbs
						: breadcrumbs
							? appBreadcrumbs
							: undefined}
					{breadcrumbsMaxItems}
					back={typeof back === 'function' ? appBack : back}
					{label}
					{title}
					{subtitle}
					header={header ? appHeader : undefined}
					headerActions={Array.isArray(headerActions)
						? headerActions
						: headerActions
							? appHeaderActions
							: undefined}
					footer={footer ? appFooter : undefined}
					footerActions={Array.isArray(footerActions)
						? footerActions
						: footerActions
							? appFooterActions
							: undefined}
					{contentPadding}
					{contentWidth}
					{actionOverflow}
					{mobileActionCount}
					class={classes.page({
						variant,
						side: sidebar.side ?? 'left'
					})}
					theme={pageShellTheme}
				>
					{#snippet children(pageShell)}
						{@render pageContent({ pageShell, sidebar: sidebarApi })}
					{/snippet}
				</PageShell>
			{/snippet}
		</Sidebar>
	</div>
</div>
