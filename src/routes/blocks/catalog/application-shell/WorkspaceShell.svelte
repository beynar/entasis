<script lang="ts">
	import { Grid } from 'svelai/grid';
	import { Stack } from 'svelai/stack';
	import { AppShell } from 'svelai/app-shell';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Form } from 'svelai/form';
	import { Meter } from 'svelai/meter';
	import { Stat } from 'svelai/stat';
	import { houseIcon } from 'svelai/icons/house';
	import { usersIcon } from 'svelai/icons/users';
	import { folderIcon } from 'svelai/icons/folder';
	import { sidebarIcon } from 'svelai/icons/sidebar';
	import { commandIcon } from 'svelai/icons/command';
	let active = $state('Overview');
	let adding = $state(false);
	let projects = $state([
		{ name: 'Website redesign', status: 'In progress', progress: 70 },
		{ name: 'Design system', status: 'In review', progress: 45 },
		{ name: 'Mobile app', status: 'Planning', progress: 20 }
	]);
	const sections = [
		{ label: 'Overview', icon: houseIcon },
		{ label: 'Projects', icon: folderIcon },
		{ label: 'People', icon: usersIcon }
	];
</script>

<AppShell
	title={active}
	subtitle="Your team’s work, all in one place."
	breadcrumbs={[{ label: 'Northstar' }, { label: active }]}
	sidebar={{
		headerButton: { title: 'Northstar', subtitle: 'Design workspace', icon: commandIcon },
		items: [
			{
				label: 'Workspace',
				items: sections.map((section) => ({
					label: section.label,
					icon: section.icon,
					isActive: active === section.label,
					onclick: () => (active = section.label)
				}))
			}
		],
		footerButton: { title: 'Alex Morgan', subtitle: 'alex@example.com', avatar: { fallback: 'AM' } }
	}}
	class="min-h-screen"
	variant="inset"
	>{#snippet headerActions({ sidebar })}<Button
			label="Toggle navigation"
			prefix={sidebarIcon}
			variant="ghost"
			onclick={sidebar.toggle}
		/><Button onclick={() => (adding = !adding)}>{adding ? 'Close editor' : 'New project'}</Button
		>{/snippet}<Stack gap="lg">
		{#if adding}<Card title="New project"
				><Form
					inputs={{ name: { type: 'text', label: 'Project name', required: true } }}
					actions={[{ children: 'Add project', onAction: (form) => form.submit() }]}
					onSubmit={({ name }) => {
						projects = [...projects, { name, status: 'Planning', progress: 0 }];
						adding = false;
					}}
				/></Card
			>{/if}{#if active === 'Overview'}<Grid columns={{ minWidth: 220, max: 3 }} gap="md">
				<Stat label="Projects" value={String(projects.length)} /><Stat
					label="Team members"
					value="12"
				/><Stat label="This week" value="8 completed" />
			</Grid>{/if}
		<Grid columns={{ minWidth: 220, max: 3 }} gap="lg">
			{#each projects as project (project)}<Card
					title={project.name}
					description={active === 'People' ? 'Maya, Sam, and Alex' : project.status}
					><Stack gap="lg">
						<Meter label="Progress" value={{ value: project.progress, color: 'primary' }} /><Button
							variant="outline"
							size="small"
							onclick={() => {
								project.progress = Math.min(100, project.progress + 10);
								project.status = project.progress === 100 ? 'Complete' : 'In progress';
							}}>Complete next milestone</Button
						>
					</Stack></Card
				>{/each}
		</Grid>
	</Stack></AppShell
>
