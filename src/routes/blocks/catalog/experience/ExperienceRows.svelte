<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
	const roles = [
		{
			company: 'Forma',
			role: 'Lead product designer',
			dates: '2023 — Present',
			description: 'Building a shared design language for tools that help teams do better work.'
		},
		{
			company: 'Northstar',
			role: 'Senior designer',
			dates: '2020 — 2023',
			description: 'Led the redesign of a growing commerce platform from discovery to delivery.'
		},
		{
			company: 'Independent',
			role: 'Designer & maker',
			dates: '2017 — 2020',
			description: 'Brand identities and digital experiences for ambitious small businesses.'
		}
	];
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">A little background</p>
		<Heading size="h2" weight="bold">Experience, earned by doing.</Heading>
	</header>
	<div>
		{#each roles as role (role.company)}<div
				class="grid gap-lg border-t border-neutral/15 py-xl md:grid-cols-[12rem_1fr_auto]"
			>
				<p class="text-sm text-neutral/50">{role.dates}</p>
				<div class="flex flex-col gap-md">
					<h3 class="text-xl font-semibold">{role.role}</h3>
					<p class="text-neutral/65">{role.description}</p>
				</div>
				<Chip color="neutral" variant="soft" class="h-fit w-fit">{role.company}</Chip>
			</div>{/each}
	</div>
	<Button href="/components" variant="outline" class="self-start">Explore selected work ↗</Button>
</section>
