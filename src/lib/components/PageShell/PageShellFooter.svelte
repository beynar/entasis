<script lang="ts">
	import PageShellActions from './PageShellActions.svelte';
	import type { PageShellApi } from './pageShell.props.js';
	import { usePageShellTheme, type PageShellThemeProps } from './pageShell.theme.js';

	let {
		api,
		class: className,
		theme
	}: {
		/** Page state and regions supplied by the owning PageShell. */
		api: PageShellApi;
		/** Additional classes for the footer element. */
		class?: string;
		/** Per-instance page theme overrides. */
		theme?: PageShellThemeProps;
	} = $props();

	const classes = $derived(usePageShellTheme(theme));
</script>

<footer data-slot="page-shell-footer" class={classes.footer({ className })}>
	<div class={classes.footerInner()}>
		{#if api.footer}
			<div class={classes.footerContent()}>
				{@render api.footer(api)}
			</div>
		{/if}

		{#if api.footerActions}
			<div data-slot="page-shell-footer-actions" class={classes.actions()}>
				<PageShellActions
					{api}
					actions={api.footerActions}
					actionOverflow={api.actionOverflow ?? 'auto'}
					mobileActionCount={api.mobileActionCount ?? 1}
					{theme}
				/>
			</div>
		{/if}
	</div>
</footer>
