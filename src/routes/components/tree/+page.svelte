<script lang="ts">
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import TreeBasicDemo from './demos/TreeBasicDemo.svelte';
	import TreeCompositionDemo from './demos/TreeCompositionDemo.svelte';
	import TreeCustomSearchDemo from './demos/TreeCustomSearchDemo.svelte';
	import TreeIconsDensityDemo from './demos/TreeIconsDensityDemo.svelte';
	import TreeLargeDemo from './demos/TreeLargeDemo.svelte';
	import TreePoliciesDemo from './demos/TreePoliciesDemo.svelte';

	const controls = createComponentControls([
		{
			name: 'density',
			type: 'segmented',
			label: 'Density',
			value: 'normal',
			options: ['small', 'normal', 'large']
		},
		{ name: 'search', type: 'switch', label: 'Search', value: true }
	]);
</script>

<DocPage
	title="Tree"
	subtitle="Virtualized file trees with SSR markup, search, Git status, snippets, editing policies, and bindable imperative access."
	component="Tree"
	features={[
		'@pierre/trees virtualization and keyboard model',
		'SSR-first render with declarative shadow DOM',
		'Search, selection, Git status, and row decorations',
		'Header and context-menu snippets',
		'Renaming, drag-and-drop, and mutation events'
	]}
>
	<ComponentCard
		{controls}
		description="Pass canonical paths directly for small and medium trees."
		class="!min-h-fit !items-stretch !justify-start"
		code={`<Tree
	id="docs-tree-basic"
	paths={[
		'app.html',
		'src/app.css',
		'src/lib/components/Button.svelte',
		'src/lib/components/Tree/Tree.svelte',
		'src/routes/+layout.svelte',
		'src/routes/+page.svelte',
		'vite.config.ts'
	]}
	height={320}
	density="${controls.value.density}"
	initialExpansion="open"
	initialSelectedPaths={['src/lib/components/Tree/Tree.svelte']}
	search={${controls.value.search}}
	initialSearchQuery="Tree"
	searchBlurBehavior="retain"
/>`}
	>
		<TreeBasicDemo density={controls.value.density} search={controls.value.search} />
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="Drive Pierre Trees search from your own controls through bind:fileTree."
			class="!min-h-fit !items-stretch !justify-start"
		>
			<TreeCustomSearchDemo />
		</ComponentCard>

		<ComponentCard
			description="Use preparedInput for large trees and keep a bounded height for virtualization."
			class="!min-h-fit !items-stretch !justify-start"
		>
			<TreeLargeDemo />
		</ComponentCard>

		<ComponentCard
			description="Density, icons, and Git status are first-class props and inherit svelai tokens."
			class="!min-h-fit !items-stretch !justify-start"
		>
			<TreeIconsDensityDemo />
		</ComponentCard>

		<ComponentCard
			description="Renaming, drag-and-drop, and mutation events can be controlled with policies."
			class="!min-h-fit !items-stretch !justify-start"
		>
			<TreePoliciesDemo />
		</ComponentCard>

		<ComponentCard
			description="Header and context-menu snippets compose with Pierre Trees without replacing the row renderer."
			class="!min-h-fit !items-stretch !justify-start"
		>
			<TreeCompositionDemo />
		</ComponentCard>
	{/snippet}
</DocPage>
