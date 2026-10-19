<script lang="ts">
	import type { Snippet } from 'svelte';
	import Heading from '$lib/components/Heading/Heading.svelte';
	import Collapsible from '$lib/components/Collapsible/Collapsible.svelte';
	import Code from '$lib/components/Code/Code.svelte';
	import ComponentControls from './ComponentControls.svelte';
	import type { ComponentControls as ComponentControlsState } from './componentControls.svelte.js';

	let {
		children,
		controls,
		title,
		class: className = '',
		description,
		code,
		language = 'svelte',
		...attachments
	}: {
		children: Snippet;
		/** Declarative interactive controls rendered as a raised layer at the top of the preview. */
		controls?: ComponentControlsState;
		description?: string;
		class?: string;
		title?: string;
		/** Source snippet shown under the preview in a "View code" reveal. */
		code?: string;
		/** Highlighting language for `code`. Defaults to svelte. */
		language?: string;
		// Doc pages declare their demo snippets inside <ComponentCard>, so every extra prop lands
		// here. `any` keeps those snippet locals typed by their own declaration; `unknown` would
		// widen them and break every nested component that receives one.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[key: string]: any;
	} = $props();

	let showCode = $state(false);
</script>

<!-- Phones get tighter spacing everywhere, so the preview keeps the width it needs. -->
<div {...attachments} class="my-6 grid gap-3 first:mt-0 sm:my-10 sm:gap-4 sm:first:mt-10">
	{#if title || description}
		<div>
			{#if title}
				<Heading>{title}</Heading>
			{/if}
			{#if description}
				<p class="text-neutral/70 mt-1 text-sm">{description}</p>
			{/if}
		</div>
	{/if}
	<div class="border-neutral-muted bg-surface raised overflow-hidden rounded-xl border">
		<div
			class="dotted-grid relative flex min-h-[240px] w-full items-center justify-center gap-2 p-2 sm:min-h-[400px] sm:gap-4 sm:p-8 {controls
				? 'flex-col items-stretch justify-start'
				: ''} {className}"
		>
			{#if controls}
				<div
					role="group"
					aria-label="Preview controls"
					class="border-neutral-muted sm:bg-surface/95 sm:raised z-20 mx-auto flex w-full max-w-full flex-col items-stretch gap-0.5 rounded-lg sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-4 sm:gap-y-2 sm:border sm:p-2 sm:backdrop-blur-sm"
				>
					<ComponentControls {controls} />
				</div>
			{/if}
			<div class="z-10 mx-auto flex w-full min-w-0 flex-1 items-center justify-center gap-4">
				{@render children()}
			</div>
		</div>
		{#if code}
			<div class="border-neutral-muted border-t p-2">
				<Collapsible variant="peek" peekHeight={84} bind:open={showCode} trigger={codeTrigger}>
					<Code
						{code}
						showHeader={false}
						{language}
						showLineNumbers
						class="rounded-lg border-none"
					/>
				</Collapsible>
			</div>
		{/if}
	</div>
</div>

{#snippet codeTrigger()}
	<span class="text-neutral/80 text-sm font-medium">{showCode ? 'Hide code' : 'View code'}</span>
{/snippet}
