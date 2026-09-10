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
	let filter = $state(0);
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">Product updates</p>
		<Heading size="h2" weight="bold">What’s new around here.</Heading>
	</header>
	<Tabbar items={['All updates', 'New', 'Improved']} bind:value={filter} />
	<div class="grid gap-xl md:grid-cols-2">
		{#each releases.filter((release) => filter === 0 || release.type === ['', 'New', 'Improved'][filter]) as release (release.version)}<article
				class="flex flex-col gap-xl p-xl rounded-lg border border-neutral/15"
			>
				<div class="flex gap-md justify-between">
					<Chip size="small" variant="soft" color={release.type === 'New' ? 'primary' : 'success'}
						>{release.type}</Chip
					><span class="text-xs text-neutral/50">{release.date}</span>
				</div>
				<h3 class="text-2xl font-semibold">{release.title}</h3>
				<p class="text-neutral/65">{release.body}</p>
				<ul class="flex flex-col gap-md list-inside list-disc text-sm">
					{#each release.changes as change (change)}<li>{change}</li>{/each}
				</ul>
				<div class="flex gap-md items-center mt-auto border-t border-neutral/15 pt-lg">
					<Avatar size="small" user={{ name: 'The product team' }} /><span
						class="text-xs text-neutral/55">The product team · v{release.version}</span
					>
				</div>
			</article>{/each}
	</div>
</section>
