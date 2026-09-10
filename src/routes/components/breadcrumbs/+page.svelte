<script lang="ts">
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import { Breadcrumbs } from '$lib/components/Breadcrumbs/index.js';
	import type { BreadcrumbItem } from '$lib/components/Breadcrumbs/breadcrumbs.props.js';
	import type { MenuItem } from '$lib/components/Menu/menu.props.js';

	const controls = createComponentControls([
		{ name: 'showSeparator', type: 'switch', label: 'Separator', value: true }
	]);
</script>

<DocPage
	title="Breadcrumbs"
	subtitle="Shows the current page's location within a navigational hierarchy."
	component="Breadcrumbs"
	features={[
		'nav aria-label=Breadcrumbs',
		'aria-current=page on active crumb',
		'Horizontal keyboard navigation',
		'maxItems ellipsis with dropdown menu',
		'Custom separator and item snippets'
	]}
>
	<ComponentCard
		{controls}
		description="Standard breadcrumb trail with an active last item."
		code={`<Breadcrumbs
	showSeparator={${controls.value.showSeparator}}
	items={[
		{ label: 'Home', href: '/' },
		{ label: 'Products', href: '/products' },
		{ label: 'Electronics', href: '/products/electronics', active: true }
	]}
/>`}
	>
		<Breadcrumbs
			showSeparator={controls.value.showSeparator}
			items={[
				{ label: 'Home', href: '/' },
				{ label: 'Products', href: '/products' },
				{ label: 'Electronics', href: '/products/electronics', active: true }
			]}
		/>
	</ComponentCard>

	{#snippet examples()}
		{#snippet productsLabel()}
			<strong>Products</strong>
		{/snippet}

		<ComponentCard description="Basic Breadcrumbs">
			<Breadcrumbs
				items={[
					{ label: 'Home', href: '/' },
					{ label: 'Products', href: '/products' },
					{ label: 'Electronics', href: '/products/electronics', active: true }
				]}
			/>
			<Breadcrumbs
				items={[
					{ label: 'Home', href: '/' },
					{ label: 'Products', href: '/products' },
					{ label: 'Electronics', href: '/products/electronics', active: true }
				]}
			>
				{#snippet item(britem)}
					{#if britem.label === 'Electronics'}
						<strong>{britem.label}</strong>
					{:else}
						yo
					{/if}
				{/snippet}
			</Breadcrumbs>
		</ComponentCard>

		<ComponentCard description="Breadcrumbs with Home Prop">
			<Breadcrumbs
				home={{ label: 'Home', href: '/' }}
				items={[
					{ label: 'Products', href: '/products' },
					{ label: 'Electronics', href: '/products/electronics', active: true }
				]}
			/>
		</ComponentCard>

		<ComponentCard description="Breadcrumbs with Active State">
			<Breadcrumbs
				items={[
					{ label: 'Home', href: '/' },
					{ label: 'About', href: '/about' },
					{ label: 'Team', href: '/about/team', active: true }
				]}
			/>
		</ComponentCard>

		<ComponentCard description="Breadcrumbs with Disabled Items">
			<Breadcrumbs
				items={[
					{ label: 'Home', href: '/' },
					{ label: 'Products', href: '/products', disabled: true },
					{ label: 'Details', href: '/products/details', active: true }
				]}
			/>
		</ComponentCard>

		<ComponentCard description="Custom Separator">
			<Breadcrumbs
				items={[
					{ label: 'Home', href: '/' },
					{ label: 'Products', href: '/products' },
					{ label: 'Details', href: '/products/details', active: true }
				]}
			>
				{#snippet separator()}
					<span class="text-neutral/60">›</span>
				{/snippet}
			</Breadcrumbs>
		</ComponentCard>

		<ComponentCard description="Without Separators">
			<Breadcrumbs
				showSeparator={false}
				items={[
					{ label: 'Home', href: '/' },
					{ label: 'Products', href: '/products' },
					{ label: 'Details', href: '/products/details', active: true }
				]}
			/>
		</ComponentCard>

		<ComponentCard description="Breadcrumbs with Dropdown Menus">
			<Breadcrumbs
				items={[
					{ label: 'Home', href: '/' },
					{
						label: 'Products',
						menu: [
							{ type: 'option', children: 'All Products', href: '/products' },
							{
								type: 'option',
								children: 'Electronics',
								href: '/products/electronics'
							},
							{ type: 'option', children: 'Clothing', href: '/products/clothing' }
						] as MenuItem[]
					},
					{ label: 'Electronics', href: '/products/electronics', active: true }
				]}
			/>
		</ComponentCard>

		<ComponentCard description="Long Breadcrumb Path">
			<Breadcrumbs
				items={[
					{ label: 'Home', href: '/' },
					{ label: 'Category', href: '/category' },
					{ label: 'Subcategory', href: '/category/subcategory' },
					{ label: 'Product', href: '/category/subcategory/product' },
					{ label: 'Details', href: '/category/subcategory/product/details', active: true }
				]}
			/>
		</ComponentCard>

		<ComponentCard description="Using maxItems prop (shows first + last 2 items).">
			<Breadcrumbs
				maxItems={3}
				home={{ href: '/' }}
				items={[
					{ label: 'Category 1', href: '/cat1' },
					{ label: 'Category 2', href: '/cat2' },
					{ label: 'Category 3', href: '/cat3' },
					{ label: 'Category 4', href: '/cat4' },
					{ label: 'Current Page', href: '/current', active: true }
				]}
			/>
		</ComponentCard>

		<ComponentCard description="Very long path with ellipsis.">
			<Breadcrumbs
				maxItems={2}
				items={[
					{ label: 'Home', href: '/' },
					{ label: 'Products', href: '/products' },
					{ label: 'Electronics', href: '/products/electronics' },
					{ label: 'Computers', href: '/products/electronics/computers' },
					{ label: 'Laptops', href: '/products/electronics/computers/laptops' },
					{ label: 'Gaming', href: '/products/electronics/computers/laptops/gaming' },
					{ label: 'Current', href: '/current', active: true }
				]}
			/>
		</ComponentCard>

		<ComponentCard description="Edge case: maxItems >= items.length (shows all items, no ellipsis).">
			<Breadcrumbs
				maxItems={5}
				items={[
					{ label: 'Home', href: '/' },
					{ label: 'Products', href: '/products' },
					{ label: 'Electronics', href: '/products/electronics', active: true }
				]}
			/>
		</ComponentCard>

		<ComponentCard description="Custom Item Rendering with Snippets">
			<Breadcrumbs
				items={[
					{ label: 'Home', href: '/' },
					{
						label: productsLabel,
						href: '/products'
					},
					{ label: 'Details', href: '/products/details', active: true }
				]}
			/>
		</ComponentCard>

		<ComponentCard description="Simple String Items">
			<Breadcrumbs
				items={[
					{ label: 'Home', href: '/' },
					{ label: 'Products', href: '/products' },
					{ label: 'Electronics', href: '/products/electronics' }
				]}
			/>
		</ComponentCard>

		<ComponentCard description="Mixed Items">
			<Breadcrumbs
				items={[
					{ label: 'Home', href: '/' },
					{ label: 'Products', href: '/products' },
					{ label: 'Electronics', href: '/products/electronics' },
					{ label: 'Details', href: '/products/details', active: true }
				]}
			/>
		</ComponentCard>
	{/snippet}
</DocPage>
