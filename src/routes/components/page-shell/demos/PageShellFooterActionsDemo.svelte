<script lang="ts">
	import { PageShell, type PageShellAction } from '$lib/components/PageShell/index.js';
	import { checkIcon } from '$lib/components/Icons/check.js';
	import { xIcon } from '$lib/components/Icons/x.js';

	const footerActions = [
		{ content: 'Cancel', variant: 'outline', prefix: xIcon },
		{ content: 'Save changes', color: 'primary', prefix: checkIcon }
	] satisfies PageShellAction[];
</script>

<div class="border-neutral-muted h-[420px] w-full overflow-auto rounded-lg border">
	<PageShell
		eyebrow="Settings"
		title="Billing profile"
		subtitle="Footer actions remain available while the page scrolls."
		{footerActions}
		contentPadding="normal"
		contentWidth="narrow"
	>
		{#snippet footer()}
			<span>2 unsaved changes</span>
		{/snippet}

		<div class="grid gap-3">
			{#each ['Company name', 'Billing email', 'VAT number', 'Address', 'Invoice notes', 'Purchase order'] as field, index (index)}
				<div class="border-neutral-muted bg-surface-raised grid gap-1 rounded-lg border p-3">
					<span class="text-neutral text-sm font-medium">{field}</span>
					<span class="border-neutral-muted bg-surface h-9 rounded-md border"></span>
				</div>
			{/each}
		</div>
	</PageShell>
</div>
