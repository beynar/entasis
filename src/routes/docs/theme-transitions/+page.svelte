<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/Button/Button.svelte';
	import Code from '$lib/components/Code/Code.svelte';
	import { themeTransitions, type ThemeTransition } from '$lib/components/Theme/themeTransition.js';
	import { useTheme } from '$lib/components/Theme/theme.state.svelte.js';
	import { tick } from 'svelte';

	type TransitionGroup = {
		name: string;
		description: string;
		transitions: readonly ThemeTransition[];
	};

	const groups: readonly TransitionGroup[] = [
		{
			name: 'Radial',
			description: 'A circular reveal expanding from one viewport corner.',
			transitions: [
				'radial-top-left',
				'radial-top-right',
				'radial-bottom-left',
				'radial-bottom-right'
			]
		},
		{
			name: 'Line',
			description: 'Full bands revealed one at a time from the selected edge.',
			transitions: ['line-top', 'line-right', 'line-bottom', 'line-left']
		},
		{
			name: 'Shutter',
			description: 'Each band appears as a thin slat, opens fully, then advances to the next.',
			transitions: ['shutter-top', 'shutter-right', 'shutter-bottom', 'shutter-left']
		},
		{
			name: 'Grid',
			description: 'Discrete cells revealed randomly or in directional columns.',
			transitions: ['random-grid', 'column-grid-left', 'column-grid-right']
		}
	] as const;

	const theme = useTheme();
	const selectedTransition = $derived(
		themeTransitions.find((transition) => transition === page.url.searchParams.get('transition')) ??
			'radial-top-right'
	);
	const usage = $derived(
		`<Theme transition="${selectedTransition}">\n\t{@render children()}\n</Theme>`
	);

	async function previewTransition(transition: ThemeTransition) {
		const searchParams = new URLSearchParams(page.url.searchParams);
		searchParams.set('transition', transition);
		await goto(`${page.url.pathname}?${searchParams}`, {
			keepFocus: true,
			noScroll: true,
			replaceState: true
		});
		await tick();
		theme.theme = theme.resolvedTheme === 'dark' ? 'light' : 'dark';
	}
</script>

<article class="mx-auto flex w-full max-w-4xl flex-col gap-14 pb-24 text-neutral">
	<header class="flex max-w-3xl flex-col gap-3">
		<h1 class="text-3xl font-semibold">Theme transitions</h1>
		<p class="text-balance">
			Choose a variation to apply it to the real page. Each preview switches between light and dark
			so the animation is shown with genuine application content.
		</p>
	</header>

	<section class="flex flex-col gap-5">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<h2 class="text-lg font-semibold">Current variation</h2>
				<code class="mt-1 block text-sm">{selectedTransition}</code>
			</div>
			<Button onclick={() => previewTransition(selectedTransition)}>Replay transition</Button>
		</div>
		<Code language="svelte" code={usage} />
	</section>

	{#each groups as group (group.name)}
		<section class="flex flex-col gap-5">
			<div class="max-w-2xl">
				<h2 class="text-lg font-semibold">{group.name}</h2>
				<p class="mt-1 text-sm leading-relaxed">{group.description}</p>
			</div>
			<div class="grid gap-3 sm:grid-cols-2">
				{#each group.transitions as transition (transition)}
					<Button
						variant={selectedTransition === transition ? 'solid' : 'outline'}
						color={selectedTransition === transition ? 'primary' : 'neutral'}
						class="justify-start font-mono"
						onclick={() => previewTransition(transition)}
					>
						{transition}
					</Button>
				{/each}
			</div>
		</section>
	{/each}

	<section class="flex max-w-3xl flex-col gap-3">
		<h2 class="text-lg font-semibold">Behavior</h2>
		<p class="text-sm leading-relaxed">
			The transition runs whenever <code>ThemeState.theme</code> changes. Omitting the prop keeps the
			change instant. Browsers without View Transitions and people requesting reduced motion also receive
			the instant change.
		</p>
	</section>
</article>
