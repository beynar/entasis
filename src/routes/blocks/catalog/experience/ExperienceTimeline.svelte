<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Timeline } from 'svelai/timeline';
	import { Avatar } from 'svelai/avatar';
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
	<div class="grid gap-xl md:grid-cols-[1fr_2fr]">
		<div class="flex flex-col gap-xl md:sticky md:top-xl md:self-start">
			<Avatar size="large" user={{ name: 'Alex Morgan' }} />
			<header class="flex flex-col gap-lg">
				<p class="text-xs font-semibold uppercase tracking-widest text-primary">Designer & maker</p>
				<Heading size="h2" weight="bold">Always a work in progress.</Heading>
				<p class="max-w-2xl text-neutral/65">
					I build thoughtful digital experiences with teams who care about the details.
				</p>
			</header>
		</div>
		<Timeline
			items={roles.map((role) => ({
				id: role.company,
				title: role.role,
				date: role.dates,
				description: role.company + ' — ' + role.description
			}))}
			variant="outline"
			color="primary"
			density="large"
		/>
	</div>
</section>
