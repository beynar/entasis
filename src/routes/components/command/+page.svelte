<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import Command from '$lib/components/Command/Command.svelte';
	import type { CommandGroup } from '$lib/components/Command/command.props.js';
	import { bookOpenIcon } from '$lib/components/Icons/bookOpen.js';
	import { calculatorIcon } from '$lib/components/Icons/calculator.js';
	import { calendarIcon } from '$lib/components/Icons/calendar.js';
	import { creditCardIcon } from '$lib/components/Icons/creditCard.js';
	import { gearIcon } from '$lib/components/Icons/gear.js';
	import { magnifyingGlassIcon } from '$lib/components/Icons/magnifyingGlass.js';
	import { rocketIcon } from '$lib/components/Icons/rocket.js';
	import { smileyIcon } from '$lib/components/Icons/smiley.js';
	import { userIcon } from '$lib/components/Icons/user.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import { densities, sizes } from '$lib/utils/tokens.js';

	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'density',
			type: 'segmented',
			label: 'Density',
			value: 'normal',
			options: densities
		}
	]);

	let lastSelected = $state('nothing yet');

	const groups: CommandGroup[] = [
		{
			heading: 'Suggestions',
			items: [
				{ value: 'calendar', label: 'Calendar', icon: calendarIcon },
				{ value: 'search-emoji', label: 'Search Emoji', icon: smileyIcon },
				{ value: 'calculator', label: 'Calculator', icon: calculatorIcon, disabled: true },
				{ value: 'launch', label: 'Launch', icon: rocketIcon, keywords: ['deploy', 'ship'] }
			]
		},
		{
			heading: 'Settings',
			items: [
				{ value: 'profile', label: 'Profile', icon: userIcon, shortcut: '⌘P' },
				{ value: 'billing', label: 'Billing', icon: creditCardIcon, shortcut: '⌘B' },
				{ value: 'settings', label: 'Settings', icon: gearIcon, shortcut: '⌘S' }
			]
		},
		{
			heading: 'Help',
			items: [{ value: 'docs', label: 'Documentation', icon: bookOpenIcon, href: '/docs' }]
		}
	];
</script>

<DocPage
	title="Command"
	subtitle="A searchable, keyboard-navigable command palette — inline or as a ⌘K dialog."
	component="Command"
	features={[
		{ label: 'Listbox + combobox ARIA wiring', test: 'a11y:command.aria' },
		'Arrow, Home, End, Enter navigation',
		'Optional dialog mode with ⌘K shortcut',
		'bind:open, bind:value, and bind:search',
		'Keyword-aware fuzzy filtering'
	]}
>
	<ComponentCard
		{controls}
		description="Inline searchable command palette."
		class="max-w-md"
		code={`<Command
	items={[
		{
			heading: 'Suggestions',
			items: [
				{ value: 'calendar', label: 'Calendar' },
				{ value: 'search-emoji', label: 'Search Emoji' },
				{ value: 'calculator', label: 'Calculator', disabled: true },
				{ value: 'launch', label: 'Launch', keywords: ['deploy', 'ship'] }
			]
		},
		{
			heading: 'Settings',
			items: [
				{ value: 'profile', label: 'Profile', shortcut: '⌘P' },
				{ value: 'billing', label: 'Billing', shortcut: '⌘B' },
				{ value: 'settings', label: 'Settings', shortcut: '⌘S' }
			]
		},
		{
			heading: 'Help',
			items: [{ value: 'docs', label: 'Documentation', href: '/docs' }]
		}
	]}
	size="${controls.value.size}"
	density="${controls.value.density}"
	onSelect={(value) => console.log(value)}
/>`}
	>
		<div class="border-neutral-muted w-full rounded-xl border">
			<Command
				items={groups}
				size={controls.value.size}
				density={controls.value.density}
				onSelect={(value) => (lastSelected = value)}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="Inline palette — type to filter, navigate with ↑↓ / Home / End, select with Enter. The Calculator item is disabled."
			class="max-w-md"
		>
			<div class="border-neutral-muted w-full rounded-xl border">
				<Command items={groups} onSelect={(value) => (lastSelected = value)} />
			</div>
			<p class="text-neutral text-center text-sm">
				Last selected: <span class="font-medium">{lastSelected}</span>
			</p>
		</ComponentCard>

		<ComponentCard
			description="Dialog mode — click the trigger or press ⌘K to open it."
			class="max-w-md"
		>
			<Command dialog shortcut="k" items={groups} onSelect={(value) => (lastSelected = value)}>
				{#snippet trigger({ open })}
					<Button variant="outline" onclick={() => open()}>
						{@render magnifyingGlassIcon({ size: 16 })}
						Search commands...
						<span class="text-neutral/70 ml-2 text-xs tracking-widest">⌘K</span>
					</Button>
				{/snippet}
				{#snippet footer({ close })}
					<div
						class="border-neutral-muted text-neutral/70 mt-1 flex items-center gap-3 border-t px-3 py-2 text-xs"
					>
						<span>↵ Select</span>
						<span>↑↓ Navigate</span>
						<button class="ml-auto hover:underline" onclick={() => close()}>Esc Close</button>
					</div>
				{/snippet}
			</Command>
			<p class="text-neutral text-center text-sm">
				Last selected: <span class="font-medium">{lastSelected}</span>
			</p>
		</ComponentCard>
	{/snippet}
</DocPage>
