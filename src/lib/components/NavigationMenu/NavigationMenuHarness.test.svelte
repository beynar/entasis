<script lang="ts">
	// Harness for the NavigationMenu tests: a bar with two link panels, a snippet panel, a plain
	// link, a disabled panel and something focusable after it all, so Tab order can be checked.
	import Theme from '../Theme/Theme.svelte';
	import NavigationMenu from './NavigationMenu.svelte';
	import type { NavigationMenuItem, NavigationMenuProps } from './navigationMenu.props.js';

	let {
		menu = {},
		items,
		value = $bindable(),
		changes = [],
		dir,
		withSnippet = false,
		align = 'start'
	}: {
		menu?: Partial<NavigationMenuProps<string>>;
		items?: NavigationMenuItem<string>[];
		value?: string | null;
		changes?: Array<{ value: string | null; reason: string }>;
		dir?: 'ltr' | 'rtl';
		withSnippet?: boolean;
		/** Where the bar sits in the page: `end` pushes it against the inline end edge. */
		align?: 'start' | 'end';
	} = $props();

	const zero = { in: { duration: 0 }, out: { duration: 0 } };

	const rich: NavigationMenuItem<string> = {
		type: 'panel',
		value: 'rich',
		label: 'Rich',
		content: richContent
	};

	const defaults: NavigationMenuItem<string>[] = [
		{
			type: 'panel',
			value: 'product',
			label: 'Product',
			content: [
				{ label: 'Components', href: '#components', description: 'Interface pieces' },
				{ label: 'Blocks', href: '#blocks' }
			]
		},
		{
			type: 'panel',
			value: 'company',
			label: 'Company',
			content: [{ label: 'About', href: '#about' }]
		},
		{ type: 'link', label: 'Pricing', href: '#pricing', active: true },
		{ type: 'panel', value: 'labs', label: 'Labs', disabled: true, content: [] }
	];
	const all = $derived(items ?? (withSnippet ? [...defaults, rich] : defaults));
</script>

{#snippet richContent({ close }: { close: () => void })}
	<p>Custom content</p>
	<a href="#guide">Guide</a>
	<input aria-label="Search the docs" />
	<button type="button" onclick={close}>Close panel</button>
{/snippet}

<Theme>
	<div
		{dir}
		style:display="flex"
		style:justify-content={align === 'end' ? 'flex-end' : 'flex-start'}
	>
		<NavigationMenu
			label="Main"
			items={all}
			transition={zero}
			bind:value
			onValueChange={({ value, details }) => changes.push({ value, reason: details.reason })}
			{...menu}
		/>
	</div>
	<button type="button">After the menu</button>
	<p>Outside</p>
</Theme>
