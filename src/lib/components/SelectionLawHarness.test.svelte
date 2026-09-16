<script lang="ts">
	import Theme from './Theme/Theme.svelte';
	import Accordion from './Accordion/Accordion.svelte';
	import AITool from './AITool/AITool.svelte';
	import AISuggestions from './AISuggestion/AISuggestions.svelte';
	import Sidebar from './Sidebar/Sidebar.svelte';
	import Tabs from './Tabs/Tabs.svelte';
	import ToggleButton from './ToggleButton/ToggleButton.svelte';
	import type { SidebarProps } from './Sidebar/sidebar.props.js';

	let {
		scenario,
		onValueChange,
		onOpenChange,
		onDisplayStateChange,
		onSelect,
		defaultOpen = false
	}: {
		scenario:
			| 'toggle'
			| 'toggle-spread'
			| 'tabs'
			| 'accordion'
			| 'sidebar'
			| 'ai-tool-single'
			| 'ai-tool-group'
			| 'ai-suggestions';
		onValueChange?: (
			value: boolean | number | string | string[] | { value: string; item: string; index: number }
		) => void;
		onOpenChange?: SidebarProps['onOpenChange'];
		onDisplayStateChange?: SidebarProps['onDisplayStateChange'];
		onSelect?: (value: string) => void;
		defaultOpen?: boolean;
	} = $props();

	let checked = $state(false);
	let toggleProps = $state({ label: 'Spread toggle', defaultValue: true, class: '' });
	let tab = $state('Overview');
	let expanded = $state(['first']);
	let displayState = $state<SidebarProps['displayState']>();
</script>

<Theme>
	{#if scenario === 'toggle'}
		<ToggleButton label="Bound toggle" bind:value={checked} {onValueChange} />
		<button onclick={() => (checked = false)}>External reset</button>
		<output>{String(checked)}</output>
	{:else if scenario === 'toggle-spread'}
		<ToggleButton
			{...toggleProps}
			onValueChange={(next) => {
				onValueChange?.(next);
				toggleProps = { ...toggleProps, class: 'updated-during-callback' };
			}}
		/>
	{:else if scenario === 'tabs'}
		<button onclick={() => (tab = 'Settings')}>External tab change</button>
		<Tabs items={['Overview', 'Settings']} bind:value={tab} {onValueChange}>
			{#snippet children({ api, item })}
				<p>{item} panel</p>
				<button onclick={() => api.goTo(0)}>Go to first panel</button>
			{/snippet}
		</Tabs>
		<output>{tab}</output>
	{:else if scenario === 'accordion'}
		<button onclick={() => (expanded = ['second'])}>External accordion change</button>
		<Accordion
			items={[
				{ id: 'first', title: 'First section', content: 'First content' },
				{ id: 'second', title: 'Second section', content: 'Second content' }
			]}
			bind:value={expanded}
			{onValueChange}
		/>
		<output>{expanded.join(',')}</output>
	{:else if scenario === 'ai-tool-single' || scenario === 'ai-tool-group'}
		<AITool
			tool={{ id: 'lookup', name: 'Lookup', output: 'Answer' }}
			tools={scenario === 'ai-tool-group'
				? [
						{ id: 'lookup', name: 'Lookup', output: 'Answer' },
						{ id: 'summary', name: 'Summary', output: 'Summary' }
					]
				: undefined}
			defaultValue={['lookup']}
			{onValueChange}
		/>
	{:else if scenario === 'ai-suggestions'}
		<AISuggestions
			suggestions={['Summarize', 'Explain']}
			defaultValue="Summarize"
			{onValueChange}
			{onSelect}
		/>
	{:else}
		<button onclick={() => (displayState = 'hidden')}>External sidebar change</button>
		<Sidebar mode="panel" {defaultOpen} bind:displayState {onOpenChange} {onDisplayStateChange}>
			{#snippet header(api)}
				<button onclick={() => api.setOpen(true)}>Expand sidebar</button>
				<button onclick={() => api.setOpen(false)}>Hide sidebar</button>
				<output>{String(api.open)}</output>
			{/snippet}
		</Sidebar>
	{/if}
</Theme>
