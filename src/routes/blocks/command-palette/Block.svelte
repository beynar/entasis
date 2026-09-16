<script lang="ts">
	import { Button } from 'svelai/button';
	import { Command, type CommandGroup } from 'svelai/command';
	import { Kbd } from 'svelai/kbd';
	import { commandIcon } from 'svelai/icons/command';
	import { envelopeSimpleIcon } from 'svelai/icons/envelopeSimple';
	import { folderSimpleIcon } from 'svelai/icons/folderSimple';
	import { gearIcon } from 'svelai/icons/gear';
	import { houseIcon } from 'svelai/icons/house';
	import { magnifyingGlassIcon } from 'svelai/icons/magnifyingGlass';
	import { moonIcon } from 'svelai/icons/moon';
	import { plusIcon } from 'svelai/icons/plus';
	import { questionIcon } from 'svelai/icons/question';
	import { userIcon } from 'svelai/icons/user';

	type Action = 'home' | 'projects' | 'inbox' | 'new-project' | 'profile' | 'appearance' | 'help';

	let paletteOpen = $state(false);
	let lastAction = $state('No command selected');

	const actionLabels: Record<Action, string> = {
		home: 'Opened home',
		projects: 'Opened projects',
		inbox: 'Opened inbox',
		'new-project': 'Created a new project',
		profile: 'Opened profile settings',
		appearance: 'Changed appearance',
		help: 'Opened help center'
	};

	const groups: CommandGroup<Action>[] = [
		{
			heading: 'Navigate',
			items: [
				{ value: 'home', label: 'Go to home', icon: houseIcon, shortcut: 'G H' },
				{
					value: 'projects',
					label: 'Browse projects',
					icon: folderSimpleIcon,
					shortcut: 'G P'
				},
				{ value: 'inbox', label: 'Open inbox', icon: envelopeSimpleIcon, shortcut: 'G I' }
			]
		},
		{
			heading: 'Create',
			items: [
				{
					value: 'new-project',
					label: 'Create new project',
					icon: plusIcon,
					shortcut: '⌘ N',
					keywords: ['add', 'start']
				}
			]
		},
		{
			heading: 'Account',
			items: [
				{ value: 'profile', label: 'Profile settings', icon: userIcon },
				{
					value: 'appearance',
					label: 'Switch appearance',
					icon: moonIcon,
					keywords: ['theme', 'dark mode']
				},
				{ value: 'help', label: 'Help center', icon: questionIcon, shortcut: '?' }
			]
		}
	];

	const handleSelection = (action: Action) => {
		lastAction = actionLabels[action];
	};
</script>

<section
	class="bg-surface-recessed p-lg sm:p-xl flex min-h-96 w-full items-center justify-center rounded-lg"
>
	<div
		class="border-neutral-muted bg-surface w-full max-w-3xl overflow-hidden rounded-xl border shadow-lg"
	>
		<header class="border-neutral-muted gap-md p-md flex items-center justify-between border-b">
			<div class="gap-md flex min-w-0 items-center">
				<span
					class="bg-primary text-primary-contrast flex size-10 shrink-0 items-center justify-center rounded-lg"
				>
					{@render commandIcon({ size: 20 })}
				</span>
				<div class="min-w-0">
					<p class="text-neutral truncate font-semibold">Northstar</p>
					<p class="text-neutral/70 truncate text-sm">Product workspace</p>
				</div>
			</div>
			<Button variant="ghost" size="small" squared label="Workspace settings">
				{#snippet prefix()}{@render gearIcon({ size: 18 })}{/snippet}
			</Button>
		</header>

		<main class="gap-xl p-lg sm:p-xl flex flex-col">
			<div class="gap-sm flex max-w-xl flex-col">
				<p class="text-primary-readable text-sm font-medium">Quick actions</p>
				<h2 class="text-neutral text-2xl font-semibold tracking-tight">
					Move through your workspace without leaving the keyboard.
				</h2>
				<p class="text-neutral/70 text-sm leading-relaxed">
					Search pages, create work, and open settings from one command palette.
				</p>
			</div>

			<Command
				dialog
				shortcut="k"
				title="Workspace command palette"
				placeholder="Search pages and actions..."
				items={groups}
				bind:open={paletteOpen}
				onSelect={handleSelection}
			>
				{#snippet trigger({ open })}
					<Button variant="outline" fullWidth onclick={open}>
						{#snippet prefix()}{@render magnifyingGlassIcon({ size: 18 })}{/snippet}
						Search pages and actions
						{#snippet suffix()}<Kbd keys={['⌘', 'K']} />{/snippet}
					</Button>
				{/snippet}

				{#snippet footer()}
					<div class="text-neutral/70 gap-md flex flex-wrap items-center text-sm">
						<span class="gap-sm flex items-center"><Kbd keys={['↑', '↓']} /> Navigate</span>
						<span class="gap-sm flex items-center"><Kbd>Enter</Kbd> Select</span>
						<span class="gap-sm flex items-center"><Kbd>Esc</Kbd> Close</span>
					</div>
				{/snippet}
			</Command>

			<div
				class="border-neutral-muted bg-surface-raised gap-md p-md flex flex-col rounded-lg border sm:flex-row sm:items-center sm:justify-between"
				aria-live="polite"
			>
				<div class="gap-md flex items-center">
					<span
						class="bg-primary-muted text-primary-muted-readable flex size-10 shrink-0 items-center justify-center rounded-lg"
					>
						{@render commandIcon({ size: 20 })}
					</span>
					<div>
						<p class="text-neutral text-sm font-medium">Last activity</p>
						<p class="text-neutral/70 text-sm">{lastAction}</p>
					</div>
				</div>
				<p class="text-neutral/70 text-sm">
					{paletteOpen ? 'Palette is open' : 'Press ⌘K anytime'}
				</p>
			</div>
		</main>
	</div>
</section>
