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

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">Changelog</p>
		<Heading size="h2" weight="bold">Always getting a little better.</Heading>
		<p class="text-neutral/65 max-w-2xl">
			New capabilities, useful improvements, and the details in between.
		</p>
	</header>
	{#each releases as release (release.version)}<article
			class="gap-xl border-neutral/15 pt-xl grid border-t md:grid-cols-[12rem_1fr]"
		>
			<aside class="gap-md flex flex-col">
				<Chip variant="soft" class="w-fit">v{release.version}</Chip><time
					class="text-neutral/65 text-sm">{release.date}</time
				>
			</aside>
			<div class="gap-xl flex flex-col">
				<Heading size="h3">{release.title}</Heading>
				<p class="text-neutral/65">{release.body}</p>
				<Card variant="soft"
					><ul class="gap-md flex list-inside list-disc flex-col">
						{#each release.changes as change (change)}<li>{change}</li>{/each}
					</ul></Card
				>
			</div>
		</article>{/each}
</section>
