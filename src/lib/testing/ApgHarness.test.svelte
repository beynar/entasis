<script lang="ts">
	// Harness for the `*.apg.browser.test.ts` files: one composite widget between two page controls,
	// in a left-to-right or right-to-left I18n and Theme, for `checkPattern`.
	import I18n from '$lib/i18n/I18n.svelte';
	import Theme from '$lib/components/Theme/Theme.svelte';
	import Tabs from '$lib/components/Tabs/Tabs.svelte';
	import ToggleMenu from '$lib/components/ToggleMenu/ToggleMenu.svelte';
	import type { ToggleMenuItem } from '$lib/components/ToggleMenu/toggleMenu.props.js';
	import Select from '$lib/components/Form/Select/Select.svelte';
	import Combobox from '$lib/components/Form/Combobox/Combobox.svelte';
	import Tree from '$lib/components/Tree/Tree.svelte';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import RadioInput from '$lib/components/Form/RadioInput/RadioInput.svelte';

	let {
		scenario,
		dir = 'ltr'
	}: {
		scenario: 'tabs' | 'toolbar' | 'select' | 'combobox' | 'tree' | 'segmented' | 'radio';
		dir?: 'ltr' | 'rtl';
	} = $props();

	const fruits = [
		{ value: 'apple', label: 'Apple' },
		{ value: 'banana', label: 'Banana' },
		{ value: 'cherry', label: 'Cherry' },
		{ value: 'kiwi', label: 'Kiwi' }
	];
	let toolbar = $state<ToggleMenuItem[]>([
		{ type: 'toggle', label: 'Bold', children: 'Bold', value: false },
		{ type: 'toggle', label: 'Italic', children: 'Italic', value: false },
		{ type: 'toggle', label: 'Underline', children: 'Underline', value: false }
	]);
	let tab = $state('Overview');
	let fruit = $state<string | null>('banana');
	let view = $state<'grid' | 'list' | 'table'>('list');
	let size = $state<string | null>('m');
</script>

<I18n {dir} manageDocument={false}>
	<Theme>
		<div {dir} class="p-4">
			<button type="button">Before</button>
			{#if scenario === 'tabs'}
				<Tabs items={['Overview', 'Billing', 'Members', 'Settings']} bind:value={tab}>
					{#snippet children({ item })}
						<p>Panel {item}</p>
					{/snippet}
				</Tabs>
			{:else if scenario === 'toolbar'}
				<ToggleMenu bind:items={toolbar} label="Format" />
			{:else if scenario === 'select'}
				<Select label="Fruit" items={fruits} bind:value={fruit} />
			{:else if scenario === 'combobox'}
				<Combobox label="Fruit" items={fruits} bind:value={fruit} />
			{:else if scenario === 'tree'}
				<Tree
					aria-label="Files"
					paths={['docs/guide.md', 'docs/intro.md', 'src/app.ts', 'src/main.ts', 'readme.md']}
					height="240px"
				/>
			{:else if scenario === 'segmented'}
				<SegmentedControl
					label="View"
					items={[
						{ value: 'grid', label: 'Grid' },
						{ value: 'list', label: 'List' },
						{ value: 'table', label: 'Table' }
					]}
					bind:value={view}
				/>
			{:else}
				<RadioInput
					label="Size"
					items={[
						{ value: 's', label: 'Small' },
						{ value: 'm', label: 'Medium' },
						{ value: 'l', label: 'Large' }
					]}
					bind:value={size}
				/>
			{/if}
			<button type="button">After</button>
		</div>
	</Theme>
</I18n>
