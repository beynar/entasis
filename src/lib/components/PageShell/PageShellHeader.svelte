<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs/Breadcrumbs.svelte';
	import { arrowLeftIcon } from '$lib/components/Icons/arrowLeft.js';
	import Slot from '$lib/components/Slot/Slot.svelte';
	import PageShellActions from './PageShellActions.svelte';
	import type {
		PageShellAction,
		PageShellApi,
		PageShellBack,
		PageShellRegion
	} from './pageShell.props.js';
	import { usePageShellTheme, type PageShellThemeProps } from './pageShell.theme.js';

	let {
		api,
		class: className,
		theme
	}: {
		/** Page state and regions supplied by the owning PageShell. */
		api: PageShellApi;
		/** Additional classes for the header element. */
		class?: string;
		/** Per-instance page theme overrides. */
		theme?: PageShellThemeProps;
	} = $props();

	const classes = $derived(usePageShellTheme(theme));

	function isBackSnippet(back: PageShellBack): back is PageShellRegion {
		return typeof back === 'function';
	}

	function asBackAction(back: PageShellBack): PageShellAction {
		return back as PageShellAction;
	}
</script>

<header data-slot="page-shell-header" class={classes.header({ className })}>
	{#if api.header}
		{@render api.header(api)}
	{:else}
		<div class={classes.headerInner()}>
			<div class={classes.titleStack()}>
				{#if api.back || api.breadcrumbs || api.eyebrow}
					<div data-slot="page-shell-header-meta" class={classes.meta()}>
						{#if api.back}
							{@const back = api.back}
							{#if isBackSnippet(back)}
								<div data-slot="page-shell-back" class={classes.back()}>
									{@render back(api)}
								</div>
							{:else}
								{@const {
									content: backLabel = 'Back',
									label,
									prefix = arrowLeftIcon,
									variant = 'ghost',
									size = 'small',
									squared = true,
									class: buttonClass,
									...buttonProps
								} = asBackAction(back)}
								<Button
									{...buttonProps}
									{prefix}
									{variant}
									{size}
									{squared}
									class={classes.back({ className: buttonClass })}
									label={label ?? backLabel}
								/>
							{/if}
						{/if}

						{#if api.breadcrumbs}
							{#if Array.isArray(api.breadcrumbs)}
								<Breadcrumbs
									items={api.breadcrumbs}
									maxItems={api.breadcrumbsMaxItems ?? 4}
									class={classes.breadcrumbs()}
								/>
							{:else}
								{@render api.breadcrumbs(api)}
							{/if}
						{:else if api.eyebrow}
							<Slot render={api.eyebrow} payload={api} class={classes.eyebrow()} />
						{/if}
					</div>
				{/if}

				<Slot
					as="h1"
					render={api.title}
					renderIf={!!api.title}
					payload={api}
					class={classes.title()}
				/>
				<Slot
					as="p"
					render={api.subtitle}
					renderIf={!!api.subtitle}
					payload={api}
					class={classes.subtitle()}
				/>
			</div>
			{#if api.headerActions}
				<div data-slot="page-shell-header-actions" class={classes.actions()}>
					<PageShellActions
						{api}
						actions={api.headerActions}
						actionOverflow={api.actionOverflow ?? 'auto'}
						mobileActionCount={api.mobileActionCount ?? 1}
						{theme}
					/>
				</div>
			{/if}
		</div>
	{/if}
</header>
