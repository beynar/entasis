<script lang="ts">
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { Stat } from 'svelai/stat';
	import { Tabbar } from 'svelai/tabbar';
	import { arrowRightIcon } from 'svelai/icons/arrowRight';
	const tabs = ['Our purpose', 'Our people', 'Our approach'];
	let active = $state(tabs[0]);
	const panels = [
		{
			label: 'Purpose',
			body: 'Give every team a clear place to start and the confidence to keep moving.',
			quote: 'Work should create momentum.',
			first: '1',
			firstLabel: 'Shared mission',
			second: '42',
			secondLabel: 'Products shaped'
		},
		{
			label: 'People',
			body: 'Designers, engineers, and curious minds, working across borders and disciplines.',
			quote: 'Different backgrounds. Shared care.',
			first: '24',
			firstLabel: 'Teammates',
			second: '14',
			secondLabel: 'Countries'
		},
		{
			label: 'Approach',
			body: 'Start with a real problem, make a small working version, and learn from the people who use it.',
			quote: 'Make it useful. Then make it better.',
			first: '2 weeks',
			firstLabel: 'First prototype',
			second: 'Weekly',
			secondLabel: 'Feedback rhythm'
		}
	];
	const panel = $derived(panels[Math.max(0, tabs.indexOf(active))]);
</script>

<section class="gap-xl p-lg md:p-xl mx-auto grid max-w-6xl md:grid-cols-2">
	<div class="gap-xl flex flex-col">
		<Chip class="self-start" variant="soft">Inside Northstar</Chip><Heading
			as="h2"
			size="h1"
			weight="bold">The people behind the product.</Heading
		><Tabbar items={tabs} bind:value={active} />
		<p class="text-neutral/70 text-lg">{panel.body}</p>
		<Button href="/docs" variant="link" class="self-start" suffix={arrowRightIcon}
			>Discover our approach</Button
		>
	</div>
	<Card variant="soft" color="primary" class="min-h-80"
		><div class="gap-xl flex h-full flex-col justify-between">
			<span class="text-sm tracking-widest uppercase">{panel.label}</span><Heading as="h3" size="h2"
				>{panel.quote}</Heading
			>
			<div class="gap-md grid grid-cols-2">
				<Stat variant="ghost" label={panel.firstLabel} value={panel.first} /><Stat
					variant="ghost"
					label={panel.secondLabel}
					value={panel.second}
				/>
			</div>
		</div></Card
	>
</section>
