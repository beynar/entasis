<script lang="ts">
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { Marquee } from 'svelai/marquee';
	import { calendarIcon } from 'svelai/icons/calendar';
	import { chartBarIcon } from 'svelai/icons/chartBar';
	import { chatCircleIcon } from 'svelai/icons/chatCircle';
	import { cloudIcon } from 'svelai/icons/cloud';
	import { fileTextIcon } from 'svelai/icons/fileText';
	import { gitBranchIcon } from 'svelai/icons/gitBranch';
	const integrations = [
		{ name: 'Calendar', icon: calendarIcon },
		{ name: 'Documents', icon: fileTextIcon },
		{ name: 'Team chat', icon: chatCircleIcon },
		{ name: 'Analytics', icon: chartBarIcon },
		{ name: 'Code', icon: gitBranchIcon },
		{ name: 'Cloud files', icon: cloudIcon }
	];
</script>

<section class="flex flex-col gap-xl overflow-hidden p-xl">
	<div class="mx-auto max-w-2xl text-center">
		<Chip variant="outline">Your tools, together</Chip><Heading
			as="h2"
			size="h2"
			weight="bold"
			class="mt-xl">Build on the way you already work.</Heading
		>
		<p class="mt-lg text-neutral/70">
			The best workflow connects the tools, people, and context you trust.
		</p>
	</div>
	<Marquee speed="slow" fade innerClass="gap-lg"
		><div class="flex gap-lg">
			{#each integrations as integration (integration.name)}<div
					class="flex min-w-48 items-center gap-lg rounded-xl border border-neutral-muted bg-surface p-xl"
				>
					<span class="text-primary">{@render integration.icon({ size: 30 })}</span><strong
						>{integration.name}</strong
					>
				</div>{/each}
		</div></Marquee
	><Button href="/components" variant="outline" class="self-center">Explore the toolkit</Button>
</section>
