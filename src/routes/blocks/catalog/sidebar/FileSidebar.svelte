<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Sidebar } from 'svelai/sidebar';
	import { folderIcon } from 'svelai/icons/folder';
	import { sidebarIcon } from 'svelai/icons/sidebar';
	let file = $state('README.md');
	const descriptions: Record<string, string> = {
		'README.md': 'Project setup and development notes.',
		'page.svelte': 'The main landing page.',
		'layout.svelte': 'The shared application frame.',
		'package.json': 'Package metadata and development commands.'
	};
	const contents: Record<string, string[]> = {
		'README.md': [
			'# Northstar website',
			'',
			'A workspace for thoughtful teams.',
			'',
			'Install: npm install',
			'Develop: npm run dev'
		],
		'page.svelte': ['<main>', '  <h1>Make room for better work.</h1>', '</main>'],
		'layout.svelte': ['Shared application frame', 'Navigation · Page content · Footer'],
		'package.json': ['name: northstar-website', 'private: true']
	};
</script>

<Sidebar
	frame="contained"
	class="min-h-screen"
	variant="admin"
	headerButton={{ title: 'northstar / website', subtitle: 'Project explorer', icon: folderIcon }}
	items={[
		{
			label: 'Files',
			tree: [
				{
					label: 'src',
					defaultOpen: true,
					children: [
						{
							label: 'app',
							defaultOpen: true,
							children: [
								{
									label: 'page.svelte',
									onclick: () => (file = 'page.svelte'),
									isActive: file === 'page.svelte'
								},
								{
									label: 'layout.svelte',
									onclick: () => (file = 'layout.svelte'),
									isActive: file === 'layout.svelte'
								}
							]
						},
						{
							label: 'components',
							children: [
								{ label: 'Header.svelte', onclick: () => (file = 'Header.svelte') },
								{ label: 'Footer.svelte', onclick: () => (file = 'Footer.svelte') }
							]
						}
					]
				},
				{ label: 'README.md', onclick: () => (file = 'README.md') },
				{ label: 'package.json', onclick: () => (file = 'package.json') }
			]
		}
	]}
	>{#snippet children(sidebar)}<Stack as="main" gap="lg" class="min-w-0 p-md sm:p-xl">
			<div class="flex items-center gap-md">
				<Button
					label="Toggle file explorer"
					prefix={sidebarIcon}
					variant="ghost"
					onclick={sidebar.toggle}
				/><Chip color="neutral">{file}</Chip>
			</div>
			<Card title={file} description="Selected project file"
				><Stack gap="lg">
					<p class="text-sm text-neutral/65">
						{descriptions[file] ?? 'A reusable interface component used by the website.'}
					</p>
					<div class="rounded-lg bg-surface-recessed p-lg font-mono text-sm leading-loose">
						{#each contents[file] ?? ['Reusable component', 'Available in the component library'] as line, index (index)}<Stack
								orientation="horizontal"
								gap="lg"
							>
								<span class="text-neutral/40">{index + 1}</span><span class="whitespace-pre-wrap"
									>{line}</span
								>
							</Stack>{/each}
					</div>
				</Stack></Card
			>
		</Stack>{/snippet}</Sidebar
>
