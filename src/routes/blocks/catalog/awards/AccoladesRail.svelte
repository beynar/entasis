<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
	const awards = [
		{
			name: 'Independent Design Awards',
			project: 'Forms of everyday',
			honor: 'Best digital experience',
			year: '2026'
		},
		{ name: 'Awwwards', project: 'Fieldnotes studio', honor: 'Site of the day', year: '2025' },
		{
			name: 'The Brand Identity',
			project: 'Considered objects',
			honor: 'Editorial selection',
			year: '2025'
		},
		{
			name: 'CSS Design Awards',
			project: 'A quieter internet',
			honor: 'Special kudos',
			year: '2024'
		}
	];
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<div class="gap-xl grid md:grid-cols-[1fr_2fr]">
		<div class="gap-xl md:top-xl flex flex-col md:sticky md:self-start">
			<header class="gap-lg flex flex-col">
				<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
					Recognition
				</p>
				<Heading size="h2" weight="bold">A little outside perspective.</Heading>
				<p class="text-neutral/65 max-w-2xl">
					We care most about making useful things. It is nice when others notice, too.
				</p>
			</header>
			<Button href="/components" variant="outline" class="self-start">Explore our work ↗</Button>
		</div>
		<div>
			{#each awards as award, i (award.project)}<div
					class="gap-lg border-neutral/15 py-xl grid grid-cols-[auto_1fr_auto] border-t"
				>
					<span class="text-neutral/65 text-sm">0{i + 1}</span>
					<div class="gap-md flex flex-col">
						<h3 class="text-xl font-semibold">{award.name}</h3>
						<p class="text-neutral/70">{award.project}</p>
						<Chip size="small" variant="soft" class="w-fit">{award.honor}</Chip>
					</div>
					<span class="text-neutral/65 text-sm">{award.year}</span>
				</div>{/each}
		</div>
	</div>
</section>
