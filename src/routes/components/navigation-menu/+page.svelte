<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import { NavigationMenu, type NavigationMenuItem } from '$lib/components/NavigationMenu/index.js';
	import { Button } from '$lib/components/Button/index.js';
	import { Card } from '$lib/components/Card/index.js';
	import { Stack } from '$lib/components/Stack/index.js';
	import { bookOpenIcon } from '$lib/components/Icons/bookOpen.js';
	import { buildingsIcon } from '$lib/components/Icons/buildings.js';
	import { chartLineIcon } from '$lib/components/Icons/chartLine.js';
	import { lifebuoyIcon } from '$lib/components/Icons/lifebuoy.js';
	import { listChecksIcon } from '$lib/components/Icons/listChecks.js';
	import { paletteIcon } from '$lib/components/Icons/palette.js';
	import { puzzlePieceIcon } from '$lib/components/Icons/puzzlePiece.js';
	import { rocketIcon } from '$lib/components/Icons/rocket.js';
	import { squaresFourIcon } from '$lib/components/Icons/squaresFour.js';
	import { usersIcon } from '$lib/components/Icons/users.js';
	import { colors, densities, sizes } from '$lib/utils/tokens.js';

	const controls = createComponentControls([
		{ name: 'size', type: 'segmented', label: 'Size', value: 'normal', options: sizes },
		{ name: 'density', type: 'segmented', label: 'Density', value: 'normal', options: densities },
		{ name: 'color', type: 'segmented', label: 'Color', value: 'neutral', options: colors }
	]);

	const siteItems: NavigationMenuItem[] = [
		{
			type: 'panel',
			value: 'product',
			label: 'Product',
			content: [
				{
					label: 'Components',
					href: '#components',
					description: 'The essential interface pieces.',
					prefix: puzzlePieceIcon
				},
				{
					label: 'Blocks',
					href: '#blocks',
					description: 'Complete patterns in context.',
					prefix: squaresFourIcon
				},
				{
					label: 'Forms',
					href: '#forms',
					description: 'State, validation and feedback.',
					prefix: listChecksIcon
				},
				{
					label: 'Colors',
					href: '#colors',
					description: 'A shared visual language.',
					prefix: paletteIcon
				}
			]
		},
		{
			type: 'panel',
			value: 'company',
			label: 'Company',
			content: [
				{ label: 'About', href: '#about', prefix: buildingsIcon },
				{ label: 'Careers', href: '#careers', prefix: usersIcon },
				{ label: 'Changelog', href: '#changelog', prefix: chartLineIcon }
			]
		},
		{ type: 'link', label: 'Pricing', href: '#pricing', active: true },
		{ type: 'link', label: 'Docs', href: '#docs' }
	];

	const usageCode = $derived(`<script lang="ts">
	import { NavigationMenu, type NavigationMenuItem } from 'entasis/navigation-menu';

	const items: NavigationMenuItem[] = [
		{
			type: 'panel',
			value: 'product',
			label: 'Product',
			content: [
				{ label: 'Components', href: '/components', description: 'The essential interface pieces.' },
				{ label: 'Blocks', href: '/blocks', description: 'Complete patterns in context.' }
			]
		},
		{
			type: 'panel',
			value: 'company',
			label: 'Company',
			content: [
				{ label: 'About', href: '/about' },
				{ label: 'Careers', href: '/careers' }
			]
		},
		{ type: 'link', label: 'Pricing', href: '/pricing', active: true },
		{ type: 'link', label: 'Docs', href: '/docs' }
	];
</scr${'ipt'}>

<NavigationMenu {items} label="Main" size="${controls.value.size}" density="${controls.value.density}" color="${controls.value.color}" />`);

	// Controlled value, reported with a reason.
	type Section = 'product' | 'company';
	let section = $state<Section | null>(null);
	let lastReason = $state('none yet');
	const controlledItems: NavigationMenuItem<Section>[] = [
		{
			type: 'panel',
			value: 'product',
			label: 'Product',
			content: [
				{ label: 'Components', href: '#components' },
				{ label: 'Blocks', href: '#blocks' }
			]
		},
		{
			type: 'panel',
			value: 'company',
			label: 'Company',
			content: [{ label: 'About', href: '#about' }]
		}
	];

	// A rich panel: any markup, with `close` to dismiss the whole menu.
	const richItems = $derived<NavigationMenuItem[]>([
		{
			type: 'panel',
			value: 'explore',
			label: 'Explore',
			content: richPanel
		},
		{ type: 'link', label: 'Guides', href: '#guides' },
		{ type: 'link', label: 'Pricing', href: '#pricing' }
	]);
	const richLinks = [
		{ title: 'Components', description: 'The essential interface pieces.', icon: puzzlePieceIcon },
		{ title: 'Blocks', description: 'Complete patterns in context.', icon: squaresFourIcon },
		{ title: 'Forms', description: 'State, validation and feedback.', icon: listChecksIcon },
		{ title: 'Colors', description: 'A shared visual language.', icon: paletteIcon }
	];

	const nestedItems: NavigationMenuItem[] = [
		{
			type: 'panel',
			value: 'learn',
			label: 'Learn',
			content: [{ label: 'Getting started', href: '#start', prefix: rocketIcon }],
			items: [
				{
					type: 'panel',
					value: 'guides',
					label: 'Guides',
					content: [
						{ label: 'Theming', href: '#theming' },
						{ label: 'Forms', href: '#forms' }
					]
				},
				{ type: 'link', label: 'Support', href: '#support', prefix: lifebuoyIcon }
			]
		},
		{ type: 'link', label: 'Docs', href: '#docs', prefix: bookOpenIcon }
	];

	const statesItems: NavigationMenuItem[] = [
		{
			type: 'panel',
			value: 'a',
			label: 'Available',
			content: [
				{ label: 'Current page', href: '#current', active: true },
				{ label: 'Another page', href: '#another' },
				{ label: 'Unavailable page', href: '#unavailable', disabled: true }
			]
		},
		{ type: 'panel', value: 'b', label: 'Disabled panel', disabled: true, content: [] },
		{ type: 'link', label: 'Disabled link', href: '#nope', disabled: true }
	];
</script>

{#snippet richPanel({ close }: { close: () => void })}
	<div class="grid w-[34rem] max-w-full gap-4 sm:grid-cols-5">
		<Card color="primary" variant="soft" class="sm:col-span-2" title="A thoughtful foundation">
			<Stack gap="lg">
				<p class="text-sm">Start with the patterns that make the whole product feel coherent.</p>
				<Button href="#start" color="primary" size="small" onclick={close}>Get started</Button>
			</Stack>
		</Card>
		<ul class="m-0 grid list-none gap-1 p-0 sm:col-span-3">
			{#each richLinks as link (link.title)}
				<li>
					<Button
						href={`#${link.title.toLowerCase()}`}
						variant="ghost"
						fullWidth
						class="h-auto justify-start py-2"
						onclick={close}
					>
						<span class="text-primary-readable">{@render link.icon({ size: 20 })}</span>
						<span class="flex flex-col text-start">
							<span class="font-medium">{link.title}</span>
							<span class="text-neutral/70 text-xs font-normal">{link.description}</span>
						</span>
					</Button>
				</li>
			{/each}
		</ul>
	</div>
{/snippet}

<DocPage
	title="Navigation menu"
	subtitle="Site navigation with mega-menu panels: disclosure buttons, hover switching and one animated panel area."
	component="NavigationMenu"
	features={[
		'A nav landmark with disclosure buttons, not a menu',
		{
			label: 'Opening by keyboard keeps focus on the trigger',
			test: 'a11y:navigation-menu.opening-keeps-focus'
		},
		{
			label: 'Tab enters the panel and continues after the trigger',
			test: 'a11y:navigation-menu.tab-enters-panel'
		},
		{
			label: 'Escape closes and returns focus to the trigger',
			test: 'a11y:navigation-menu.escape-restores-focus'
		},
		{
			label: 'Arrow keys, Home and End move inside the open panel',
			test: 'a11y:navigation-menu.panel-arrows'
		},
		'Hover switching with an animated panel size',
		'A link press closes every level',
		'Panels can stay in the HTML for crawlers',
		'RTL and nested inline levels'
	]}
>
	<ComponentCard
		{controls}
		title="Site header"
		description="Open a panel with a press, or rest the pointer on a trigger and move between them: the panel follows and resizes."
		class="min-h-[420px] items-start"
		code={usageCode}
	>
		<div class="min-h-72 w-full">
			<NavigationMenu
				items={siteItems}
				label="Main"
				size={controls.value.size}
				density={controls.value.density}
				color={controls.value.color}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Controlled value"
			description="Bind value to read or set the open panel. onValueChange reports why it changed and can cancel the change."
			class="min-h-[320px] items-start"
			code={`<script lang="ts">
	type Section = 'product' | 'company';
	let section = $state<Section | null>(null);
</scr${'ipt'}>

<NavigationMenu
	{items}
	bind:value={section}
	onValueChange={({ value, details }) => console.log(value, details.reason)}
/>`}
		>
			<div class="grid min-h-72 w-full content-start gap-4">
				<div class="flex flex-wrap items-center gap-2">
					<Button size="small" variant="outline" onclick={() => (section = 'company')}>
						Open Company
					</Button>
					<Button size="small" variant="outline" onclick={() => (section = null)}>Close</Button>
				</div>
				<p class="text-neutral/70 text-sm">
					value: <code>{JSON.stringify(section)}</code> · last reason: <code>{lastReason}</code>
				</p>
				<NavigationMenu
					items={controlledItems}
					label="Controlled"
					bind:value={section}
					onValueChange={({ details }) => (lastReason = details.reason)}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Rich panel"
			description="A panel's content can be a snippet. It receives close to dismiss the whole menu."
			class="min-h-[360px] items-start"
			code={`<script lang="ts">
	const items: NavigationMenuItem[] = [
		{ type: 'panel', value: 'explore', label: 'Explore', content: explore },
		{ type: 'link', label: 'Guides', href: '/guides' }
	];
</scr${'ipt'}>

{#snippet explore({ close })}
	<Card title="A thoughtful foundation">
		<Button href="/docs" onclick={close}>Get started</Button>
	</Card>
{/snippet}

<NavigationMenu {items} />`}
		>
			<div class="min-h-80 w-full"><NavigationMenu items={richItems} label="Rich" /></div>
		</ComponentCard>

		<ComponentCard
			title="Nested inline levels"
			description="items under a panel render inline. A nested panel expands in place, and a link press anywhere closes every level."
			class="min-h-[360px] items-start"
			code={`const items: NavigationMenuItem[] = [
	{
		type: 'panel',
		value: 'learn',
		label: 'Learn',
		content: [{ label: 'Getting started', href: '/start' }],
		items: [
			{ type: 'panel', value: 'guides', label: 'Guides', content: [{ label: 'Theming', href: '/theming' }] },
			{ type: 'link', label: 'Support', href: '/support' }
		]
	}
];`}
		>
			<div class="min-h-80 w-full"><NavigationMenu items={nestedItems} label="Nested" /></div>
		</ComponentCard>

		<ComponentCard
			title="Current page and disabled entries"
			description="active marks the current page. A disabled panel never opens and is skipped by the arrow keys; a disabled link drops its href."
			class="min-h-[320px] items-start"
		>
			<div class="min-h-72 w-full"><NavigationMenu items={statesItems} label="States" /></div>
		</ComponentCard>

		<ComponentCard
			title="Press to open"
			description="openOnHover={false} leaves opening to presses and the keyboard."
			class="min-h-[320px] items-start"
			code={`<NavigationMenu {items} openOnHover={false} />`}
		>
			<div class="min-h-72 w-full">
				<NavigationMenu items={siteItems} label="Press to open" openOnHover={false} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Kept mounted"
			description="keepMounted renders every panel under hidden, so crawlers and the server-rendered HTML see their links. Inspect the markup: the closed panels are already in it."
			class="min-h-[320px] items-start"
			code={`<NavigationMenu {items} keepMounted />`}
		>
			<div class="min-h-72 w-full">
				<NavigationMenu items={siteItems} label="Kept mounted" keepMounted />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Right to left"
			description="The arrow keys, the panel alignment and the hover direction mirror."
			class="min-h-[320px] items-start"
			code={`<NavigationMenu {items} dir="rtl" />`}
		>
			<div class="min-h-72 w-full" dir="rtl">
				<NavigationMenu items={siteItems} label="RTL" dir="rtl" />
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
