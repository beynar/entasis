<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Tabs } from 'svelai/tabs';
	import { Code } from 'svelai/code';
	import { Chip } from 'svelai/chip';
	const examples = [
		{
			label: 'TypeScript',
			language: 'typescript',
			filename: 'active-projects.ts',
			code: 'type Project = { name: string; active: boolean };\n\nexport function activeProjects(projects: Project[]) {\n  return projects.filter(project => project.active);\n}'
		},
		{
			label: 'Python',
			language: 'python',
			filename: 'active_projects.py',
			code: 'def active_projects(projects):\n    return [project for project in projects if project["active"]]\n'
		},
		{
			label: 'SQL',
			language: 'sql',
			filename: 'active-projects.sql',
			code: 'SELECT name, updated_at\nFROM projects\nWHERE active = true\nORDER BY updated_at DESC;'
		}
	];
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">One useful pattern</p>
		<Heading size="h2" weight="bold">Speak your language.</Heading>
		<p class="max-w-2xl text-neutral/65">The same collection filter in three familiar languages.</p>
	</header>
	<Chip size="small" variant="soft" class="w-fit">Local collection example</Chip><Tabs
		items={examples}
		>{#snippet children({ item: example })}<Code
				code={example.code}
				language={example.language}
				title={example.filename}
				showLineNumbers
			/>{/snippet}</Tabs
	>
</section>
