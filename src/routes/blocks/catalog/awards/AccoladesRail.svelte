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

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<div class="grid gap-xl md:grid-cols-[1fr_2fr]">
		<div class="flex flex-col gap-xl md:sticky md:top-xl md:self-start">
			<header class="flex flex-col gap-lg">
				<p class="text-xs font-semibold uppercase tracking-widest text-primary">Recognition</p>
				<Heading size="h2" weight="bold">A little outside perspective.</Heading>
				<p class="max-w-2xl text-neutral/65">
					We care most about making useful things. It is nice when others notice, too.
				</p>
			</header>
			<Button href="/components" variant="outline" class="self-start">Explore our work ↗</Button>
		</div>
		<div>
			{#each awards as award, i (award.project)}<div
					class="grid grid-cols-[auto_1fr_auto] gap-lg border-t border-neutral/15 py-xl"
				>
					<span class="text-sm text-neutral/40">0{i + 1}</span>
					<div class="flex flex-col gap-md">
						<h3 class="text-xl font-semibold">{award.name}</h3>
						<p class="text-neutral/60">{award.project}</p>
						<Chip size="small" variant="soft" class="w-fit">{award.honor}</Chip>
					</div>
					<span class="text-sm text-neutral/45">{award.year}</span>
				</div>{/each}
		</div>
	</div>
</section>
