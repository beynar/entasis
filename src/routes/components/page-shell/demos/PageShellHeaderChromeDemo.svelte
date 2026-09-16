<script lang="ts">
	import type { BreadcrumbItem } from '$lib/components/Breadcrumbs/index.js';
	import { PageShell, type PageShellAction } from '$lib/components/PageShell/index.js';
	import { arrowClockwiseIcon } from '$lib/components/Icons/arrowClockwise.js';
	import { usersIcon } from '$lib/components/Icons/users.js';

	const breadcrumbs: BreadcrumbItem[] = [
		{ label: 'Customers', href: '#customers' },
		{ label: 'Accounts', href: '#accounts' },
		{ label: 'Acme Group', active: true }
	];

	const headerActions = [
		{ content: 'Refresh', variant: 'outline', prefix: arrowClockwiseIcon },
		{ content: 'Invite', color: 'primary', prefix: usersIcon }
	] satisfies PageShellAction[];
</script>

<div class="border-neutral-muted h-[420px] w-full overflow-auto rounded-lg border">
	<PageShell
		title="Acme Group"
		subtitle="Enterprise account"
		{breadcrumbs}
		back={{ href: '#accounts' }}
		{headerActions}
		contentPadding="normal"
		contentWidth="normal"
	>
		<section class="border-neutral-muted bg-surface-raised rounded-lg border p-5">
			<p class="text-neutral text-sm font-medium">Header chrome</p>
			<p class="text-neutral/70 mt-2 text-sm">
				Breadcrumbs take precedence over eyebrow text and the back affordance uses a default arrow.
			</p>
		</section>
	</PageShell>
</div>
