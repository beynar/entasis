<script lang="ts">
	import { Button } from 'entasis/button';
	import { Chip } from 'entasis/chip';
	import { Heading } from 'entasis/heading';
	import { Marquee } from 'entasis/marquee';
	import { calendarIcon } from 'entasis/icons/calendar';
	import { chartBarIcon } from 'entasis/icons/chartBar';
	import { chatCircleIcon } from 'entasis/icons/chatCircle';
	import { cloudIcon } from 'entasis/icons/cloud';
	import { fileTextIcon } from 'entasis/icons/fileText';
	import { gitBranchIcon } from 'entasis/icons/gitBranch';
	const integrations = [
		{ name: 'Calendar', icon: calendarIcon },
		{ name: 'Documents', icon: fileTextIcon },
		{ name: 'Team chat', icon: chatCircleIcon },
		{ name: 'Analytics', icon: chartBarIcon },
		{ name: 'Code', icon: gitBranchIcon },
		{ name: 'Cloud files', icon: cloudIcon }
	];
</script>

<section class="gap-xl p-xl flex flex-col overflow-hidden">
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
		><div class="gap-lg flex">
			{#each integrations as integration (integration.name)}<div
					class="gap-lg border-neutral-muted bg-surface p-xl flex min-w-48 items-center rounded-xl border"
				>
					<span class="text-primary-readable">{@render integration.icon({ size: 30 })}</span><strong
						>{integration.name}</strong
					>
				</div>{/each}
		</div></Marquee
	><Button href="/components" variant="outline" class="self-center">Explore the toolkit</Button>
</section>
