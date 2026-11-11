<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import PageShell from './PageShell.svelte';
	import PageShellSubheaderPage from './PageShellSubheaderPage.test.svelte';
	import type { PageShellThemeProps } from './pageShell.theme.js';

	let {
		withSubheader = true,
		title = 'Projects',
		theme,
		page = false
	}: {
		withSubheader?: boolean;
		title?: string;
		theme?: PageShellThemeProps;
		page?: boolean;
	} = $props();
</script>

{#snippet tabs()}
	<nav data-testid="tabs" class="border-neutral-muted border-b" style="height: 40px">Overview</nav>
{/snippet}

<Theme>
	<div data-testid="scroller" style="height: 320px; width: 640px; overflow: auto">
		<PageShell
			{title}
			subheader={withSubheader ? tabs : undefined}
			contentPadding="normal"
			contentWidth="narrow"
			theme={{ ...theme, contentInner: { base: 'flex flex-col gap-xl' } }}
		>
			{#if page}
				<PageShellSubheaderPage />
			{/if}
			<p data-testid="first">First</p>
			<div style="height: 1200px">Tall</div>
		</PageShell>
	</div>
</Theme>
