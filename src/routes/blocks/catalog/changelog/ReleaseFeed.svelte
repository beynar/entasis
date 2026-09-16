<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Tabbar } from 'svelai/tabbar';
	import { Chip } from 'svelai/chip';
	import { Avatar } from 'svelai/avatar';
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
	let filter = $state('All updates');
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			Product updates
		</p>
		<Heading size="h2" weight="bold">What’s new around here.</Heading>
	</header>
	<Tabbar items={['All updates', 'New', 'Improved']} bind:value={filter} />
	<div class="gap-xl grid md:grid-cols-2">
		{#each releases.filter((release) => filter === 'All updates' || release.type === filter) as release (release.version)}<article
				class="gap-xl p-xl border-neutral/15 flex flex-col rounded-lg border"
			>
				<div class="gap-md flex justify-between">
					<Chip size="small" variant="soft" color={release.type === 'New' ? 'primary' : 'success'}
						>{release.type}</Chip
					><span class="text-neutral/65 text-xs">{release.date}</span>
				</div>
				<h3 class="text-2xl font-semibold">{release.title}</h3>
				<p class="text-neutral/65">{release.body}</p>
				<ul class="gap-md flex list-inside list-disc flex-col text-sm">
					{#each release.changes as change (change)}<li>{change}</li>{/each}
				</ul>
				<div class="gap-md border-neutral/15 pt-lg mt-auto flex items-center border-t">
					<Avatar size="small" name="The product team" /><span class="text-neutral/65 text-xs"
						>The product team · v{release.version}</span
					>
				</div>
			</article>{/each}
	</div>
</section>
