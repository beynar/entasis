<script lang="ts">
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { Stat } from 'svelai/stat';
	import { Tabbar } from 'svelai/tabbar';
	import { arrowRightIcon } from 'svelai/icons/arrowRight';
	let active = $state(0);
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
</script>

<section class="mx-auto grid max-w-6xl gap-xl p-lg md:grid-cols-2 md:p-xl">
	<div class="flex flex-col gap-xl">
		<Chip class="self-start" variant="soft">Inside Northstar</Chip><Heading
			as="h2"
			size="h1"
			weight="bold">The people behind the product.</Heading
		><Tabbar items={['Our purpose', 'Our people', 'Our approach']} bind:value={active} />
		<p class="text-lg text-neutral/70">{panels[active].body}</p>
		<Button href="/docs" variant="link" class="self-start" suffix={arrowRightIcon}
			>Discover our approach</Button
		>
	</div>
	<Card variant="soft" color="primary" class="min-h-80"
		><div class="flex h-full flex-col justify-between gap-xl">
			<span class="text-sm uppercase tracking-widest">{panels[active].label}</span><Heading
				as="h3"
				size="h2">{panels[active].quote}</Heading
			>
			<div class="grid grid-cols-2 gap-md">
				<Stat variant="ghost" label={panels[active].firstLabel} value={panels[active].first} /><Stat
					variant="ghost"
					label={panels[active].secondLabel}
					value={panels[active].second}
				/>
			</div>
		</div></Card
	>
</section>
