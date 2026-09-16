<script lang="ts">
	import Theme from './Theme/Theme.svelte';
	import Breadcrumbs from './Breadcrumbs/Breadcrumbs.svelte';
	import Sidebar from './Sidebar/Sidebar.svelte';
	import Menu from './Menu/Menu.svelte';

	let {
		scenario,
		disabled = true,
		onclick
	}: {
		scenario: 'breadcrumbs' | 'breadcrumbs-overflow' | 'sidebar' | 'menu';
		disabled?: boolean;
		onclick?: (event: MouseEvent) => void;
	} = $props();
</script>

<Theme>
	{#if scenario === 'sidebar'}
		<Sidebar
			mode="panel"
			items={[
				{
					items: [
						{ label: 'Sidebar destination', href: '#sidebar', disabled, onclick },
						{
							label: 'Parent',
							defaultOpen: true,
							items: [{ label: 'Nested destination', href: '#nested', disabled, onclick }]
						}
					]
				}
			]}
		/>
	{:else if scenario === 'menu'}
		<Menu
			items={[
				{
					type: 'submenu',
					title: 'Disabled submenu',
					disabled,
					openOnHover: true,
					delay: 0,
					menu: [{ type: 'option', title: 'Nested action', onclick }]
				}
			]}
		/>
	{:else}
		<Breadcrumbs
			maxItems={scenario === 'breadcrumbs-overflow' ? 1 : undefined}
			items={[
				{ label: 'Breadcrumb destination', href: '#breadcrumb', disabled, onclick },
				{ label: 'Current page', active: true }
			]}
		/>
	{/if}
</Theme>
