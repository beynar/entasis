<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Avatar } from 'svelai/avatar';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Timeline } from 'svelai/timeline';

	let view = $state('Experience');
	const experience = [
		{
			id: 'northstar',
			title: 'Senior Product Designer · Northstar',
			description: 'Leading the design of calmer, more useful team workflows.',
			date: '2023 — Present'
		},
		{
			id: 'orbit',
			title: 'Product Designer · Orbit Labs',
			description: 'Built a shared design system and improved first-run activation.',
			date: '2020 — 2023'
		},
		{
			id: 'studio',
			title: 'Designer · Common Ground',
			description: 'Worked with small teams on brands and digital products.',
			date: '2017 — 2020'
		}
	];
	const education = [
		{
			id: 'school',
			title: 'MA Interaction Design',
			description: 'Focused on human-centered digital services.',
			date: '2015 — 2017'
		},
		{
			id: 'award',
			title: 'Design community mentor',
			description: 'Supporting designers through feedback and shared learning.',
			date: '2022 — Present'
		}
	];
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<div class="gap-xl grid md:grid-cols-3">
		<Stack as="aside" gap="lg">
			<Avatar name="Alex Morgan" size="large" />
			<div>
				<h2 class="text-3xl font-semibold">Alex Morgan</h2>
				<p class="mt-sm text-primary-readable text-sm">Product designer</p>
			</div>
			<p class="text-neutral/65 text-sm">
				Making complex things feel simple, with good people and a little curiosity.
			</p>
			<Chip color="success">Open to collaboration</Chip>
		</Stack>
		<Card class="md:col-span-2"
			><Stack gap="xl">
				<nav class="gap-sm flex flex-wrap" aria-label="Career sections">
					<Button
						variant={view === 'Experience' ? 'soft' : 'ghost'}
						onclick={() => (view = 'Experience')}>Experience</Button
					><Button
						variant={view === 'Education' ? 'soft' : 'ghost'}
						onclick={() => (view = 'Education')}>Education & recognition</Button
					>
				</nav>
				<Timeline
					items={view === 'Experience' ? experience : education}
					variant="ghost"
					density="comfortable"
				/>
			</Stack></Card
		>
	</div>
</Stack>
