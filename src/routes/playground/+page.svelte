<script lang="ts">
	import { useRuntimeThemePlayground } from '../runtimeThemePlayground.svelte.js';
	import TokenControls from './TokenControls.svelte';
	import TokenPreview from './TokenPreview.svelte';

	const playground = useRuntimeThemePlayground();
</script>

<article class="mx-auto grid max-w-7xl gap-layout-md pb-20" style={playground.colorStyle}>
	<header class="grid gap-md">
		<h1 class="text-3xl font-semibold">Theme playground</h1>
		<p class="text-neutral/60 max-w-2xl text-balance">
			Start from eight presets, tune runtime tokens, and inspect the result across real components.
		</p>
	</header>

	<div class="grid items-start gap-layout-md xl:grid-cols-[minmax(20rem,0.8fr)_minmax(0,1.4fr)]">
		<TokenControls />
		<TokenPreview />
	</div>
</article>
