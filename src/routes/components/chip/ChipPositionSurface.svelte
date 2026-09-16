<script lang="ts">
	import type { Snippet } from 'svelte';
	import Card from '$lib/components/Card/Card.svelte';

	let {
		children,
		title = 'Atlas launch',
		detail = 'Product design - Updated 12 min ago',
		class: className = ''
	}: {
		children: Snippet;
		title?: string;
		detail?: string;
		class?: string;
	} = $props();
</script>

<div class="relative w-full max-w-sm {className}">
	<Card class="w-full overflow-visible" {title} description={detail}>
		<div class="grid gap-4">
			<div class="flex items-end justify-between gap-4">
				<div>
					<p class="text-neutral/70 text-xs">Progress</p>
					<p class="text-neutral mt-1 text-2xl font-semibold tabular-nums">72%</p>
				</div>
				<p class="text-neutral/70 text-xs">Due Friday</p>
			</div>
			<div class="bg-neutral-muted h-1.5 overflow-hidden rounded-full">
				<div class="bg-primary h-full w-[72%] rounded-full"></div>
			</div>
			<div class="text-neutral/70 flex items-center justify-between text-xs">
				<span>9 of 12 tasks</span>
				<span>3 collaborators</span>
			</div>
		</div>
	</Card>

	{@render children()}
</div>
