<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Chip } from 'svelai/chip';
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
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">Selected recognition</p>
		<Heading size="h2" weight="bold">Work that gets noticed.</Heading>
		<p class="max-w-2xl text-neutral/65">A few kind nods from the creative community.</p>
	</header>
	<div class="overflow-x-auto">
		<table class="w-full min-w-[32rem] text-left">
			<thead class="text-xs uppercase tracking-widest text-neutral/50"
				><tr
					><th class="py-lg">Award</th><th>Project</th><th>Recognition</th><th class="text-right"
						>Year</th
					></tr
				></thead
			><tbody
				>{#each awards as award (award.project)}<tr class="border-t border-neutral/15"
						><th class="py-xl font-semibold">{award.name}</th><td class="text-neutral/65"
							>{award.project}</td
						><td><Chip size="small" variant="soft" color="neutral">{award.honor}</Chip></td><td
							class="text-right text-neutral/50">{award.year}</td
						></tr
					>{/each}</tbody
			>
		</table>
	</div>
</section>
