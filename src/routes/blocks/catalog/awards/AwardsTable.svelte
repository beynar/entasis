<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Chip } from 'entasis/chip';
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
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			Selected recognition
		</p>
		<Heading size="h2" weight="bold">Work that gets noticed.</Heading>
		<p class="text-neutral/65 max-w-2xl">A few kind nods from the creative community.</p>
	</header>
	<div class="overflow-x-auto">
		<table class="w-full min-w-[32rem] text-left">
			<thead class="text-neutral/65 text-xs tracking-widest uppercase"
				><tr
					><th class="py-lg">Award</th><th>Project</th><th>Recognition</th><th class="text-right"
						>Year</th
					></tr
				></thead
			><tbody
				>{#each awards as award (award.project)}<tr class="border-neutral/15 border-t"
						><th class="py-xl font-semibold">{award.name}</th><td class="text-neutral/65"
							>{award.project}</td
						><td><Chip size="small" variant="soft" color="neutral">{award.honor}</Chip></td><td
							class="text-neutral/65 text-right">{award.year}</td
						></tr
					>{/each}</tbody
			>
		</table>
	</div>
</section>
