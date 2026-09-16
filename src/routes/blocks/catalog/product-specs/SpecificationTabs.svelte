<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Tabs } from 'svelai/tabs';
	import { Card } from 'svelai/card';
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
	<div class="gap-xl grid md:grid-cols-[1fr_2fr]">
		<div>
			<header class="gap-lg flex flex-col">
				<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
					Product information
				</p>
				<Heading size="h2" weight="bold">Everything you need to know.</Heading>
				<p class="text-neutral/65 max-w-2xl">
					Materials, dimensions, and the details behind the Arc desk lamp.
				</p>
			</header>
		</div>
		<Card class="min-w-0"
			><Tabs items={specifications.map((section) => ({ ...section, label: section.title }))}
				>{#snippet children({ item: section })}<div class="py-lg">
						<dl class="gap-lg grid">
							{#each section.rows as row (row[0])}<div
									class="gap-xl border-neutral/10 py-lg grid grid-cols-2 border-b"
								>
									<dt class="text-neutral/65">{row[0]}</dt>
									<dd class="text-right">{row[1]}</dd>
								</div>{/each}
						</dl>
					</div>{/snippet}</Tabs
			></Card
		>
	</div>
</section>
