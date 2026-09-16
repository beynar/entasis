<script lang="ts">
	import { resolveLink } from '../appNavigation.js';
	import type { RouteId } from '$app/types';
	type ShellComponentId = 'app-shell' | 'sidebar' | 'page-shell';

	let { current }: { current: ShellComponentId } = $props();

	const items: {
		id: ShellComponentId;
		label: string;
		href: RouteId;
		responsibility: string;
		use: string;
		how: string;
	}[] = [
		{
			id: 'app-shell',
			label: 'AppShell',
			href: '/components/app-shell',
			responsibility:
				'Composes Sidebar plus PageShell and forwards one shared surface variant to the Sidebar frame.',
			use: 'Use it when routes share the same application navigation and page chrome.',
			how: 'Pass variant, a sidebar config, and PageShell props; use theme.page for PageShell surface tokens.'
		},
		{
			id: 'sidebar',
			label: 'Sidebar',
			href: '/components/sidebar',
			responsibility:
				'Owns navigation, the lower application wall, variant surfaces, collapse, rail, resize, edge reveal, and mobile drawer behavior.',
			use: 'Use it through AppShell for standard application frames, or standalone for custom shell composition.',
			how: 'Pass items plus variant, collapsible, rail, side, or mode; theme root, panel, and main as one frame.'
		},
		{
			id: 'page-shell',
			label: 'PageShell',
			href: '/components/page-shell',
			responsibility:
				'Owns page-level chrome: sticky header and footer, document-flow content, breadcrumbs, and actions.',
			use: 'Use it for screens that need consistent title, context, content width, and footer behavior.',
			how: 'Pass title, subtitle, breadcrumbs, actions, contentPadding, contentWidth, and PageShell theme parts.'
		}
	];
</script>

<section
	aria-labelledby="shell-mental-model-title"
	class="border-neutral-muted bg-surface text-neutral/70 grid gap-3 rounded-xl border p-4 text-sm"
>
	<div class="grid gap-1">
		<p id="shell-mental-model-title" class="text-neutral font-medium">Shell mental model</p>
		<p>
			Sidebar moves and paints the application frame; AppShell composes it with PageShell; PageShell
			shapes the page. Each card links to the component that owns that layer.
		</p>
	</div>

	<div class="grid gap-3 md:grid-cols-3">
		{#each items as item, index (index)}
			<a
				href={resolveLink(item.href)}
				aria-current={current === item.id ? 'page' : undefined}
				class="rounded-lg border p-3 transition {current === item.id
					? 'border-primary bg-primary/10 text-neutral'
					: 'border-neutral-muted bg-surface-raised text-neutral/75 hover:border-primary/50 hover:text-neutral'}"
			>
				<span class="text-neutral block font-medium">{item.label}</span>
				<span class="mt-2 block">{item.responsibility}</span>
				<span class="mt-2 block">
					<span class="text-neutral font-medium">Use:</span>
					{item.use}
				</span>
				<span class="mt-1 block">
					<span class="text-neutral font-medium">How:</span>
					{item.how}
				</span>
			</a>
		{/each}
	</div>
</section>
