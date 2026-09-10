<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Chip } from 'svelai/chip';
	import { Card } from 'svelai/card';
	const releases = [
		{
			version: '2.4',
			date: 'June 18, 2026',
			type: 'New',
			title: 'A clearer view of your work',
			body: 'Saved views keep your most useful filters close. Share a view with your team and come back to the same focused workspace.',
			changes: [
				'Save and name a filtered view',
				'Reorder your favorite views',
				'Share view settings with your team'
			]
		},
		{
			version: '2.3',
			date: 'May 28, 2026',
			type: 'Improved',
			title: 'Small details, smoother days',
			body: 'This release focuses on the interactions you repeat most often.',
			changes: [
				'Faster keyboard navigation',
				'Clearer empty states',
				'More readable activity history'
			]
		}
	];
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">Changelog</p>
		<Heading size="h2" weight="bold">Always getting a little better.</Heading>
		<p class="max-w-2xl text-neutral/65">
			New capabilities, useful improvements, and the details in between.
		</p>
	</header>
	{#each releases as release (release.version)}<article
			class="grid gap-xl border-t border-neutral/15 pt-xl md:grid-cols-[12rem_1fr]"
		>
			<aside class="flex flex-col gap-md">
				<Chip variant="soft" class="w-fit">v{release.version}</Chip><time
					class="text-sm text-neutral/50">{release.date}</time
				>
			</aside>
			<div class="flex flex-col gap-xl">
				<Heading size="h3">{release.title}</Heading>
				<p class="text-neutral/65">{release.body}</p>
				<Card variant="soft"
					><ul class="flex flex-col gap-md list-inside list-disc">
						{#each release.changes as change (change)}<li>{change}</li>{/each}
					</ul></Card
				>
			</div>
		</article>{/each}
</section>
