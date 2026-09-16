<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Accordion } from 'svelai/accordion';
	import { Chip } from 'svelai/chip';
	const specifications = [
		{
			title: 'Dimensions & weight',
			rows: [
				['Height', '38 cm'],
				['Shade diameter', '24 cm'],
				['Base diameter', '16 cm'],
				['Weight', '1.8 kg']
			]
		},
		{
			title: 'Light & power',
			rows: [
				['Light source', 'Integrated LED'],
				['Power', '8 watts'],
				['Color temperature', '2700K warm white'],
				['Dimming', 'Three levels, touch control']
			]
		},
		{
			title: 'Materials & care',
			rows: [
				['Shade', 'Powder-coated aluminum'],
				['Base', 'Weighted steel'],
				['Cable', '2 m textile cord'],
				['Care', 'Wipe with a soft, dry cloth']
			]
		}
	];
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			Arc desk lamp
		</p>
		<Heading size="h2" weight="bold">The details, considered.</Heading>
	</header>
	<Chip class="w-fit" variant="soft">Technical specifications</Chip><Accordion
		items={specifications}
		variant="outline"
		defaultValue={['0']}
		>{#snippet content({ item: section })}<dl class="gap-lg grid">
				{#each section.rows as row (row[0])}<div
						class="gap-xl border-neutral/10 py-lg grid grid-cols-2 border-b"
					>
						<dt class="text-neutral/65">{row[0]}</dt>
						<dd class="text-right">{row[1]}</dd>
					</div>{/each}
			</dl>{/snippet}</Accordion
	>
</section>
