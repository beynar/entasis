<script lang="ts">
	// A conversation list built as data: each row leads with a face, reads a name and a time over
	// a preview, and ends with a status dot. One submenu row carries the same parts.
	import Theme from '../Theme/Theme.svelte';
	import Sidebar from './Sidebar.svelte';
	import type {
		SidebarApi,
		SidebarDisplayState,
		SidebarGroup,
		SidebarMenuEntry,
		SidebarMenuSubEntry,
		SidebarSize
	} from './sidebar.props.js';

	let {
		displayState = 'expanded',
		size = 'normal',
		iconSize,
		name = 'Ada',
		onmediaentry
	}: {
		displayState?: SidebarDisplayState;
		size?: SidebarSize;
		iconSize?: SidebarSize;
		/** The first row's label, long to check truncation. */
		name?: string;
		onmediaentry?: (api: SidebarApi, entry: SidebarMenuEntry | SidebarMenuSubEntry) => void;
	} = $props();

	const items: SidebarGroup[] = $derived([
		{
			label: 'Agents',
			items: [
				{
					label: name,
					href: '#ada',
					media: face,
					meta: '10:42',
					description: 'The report is ready, want a summary of the key points?',
					isActive: true,
					suffix: dot
				},
				{
					label: 'Brune',
					href: '#brune',
					media: face,
					meta: metaSnippet,
					description: descriptionSnippet,
					badge: 2
				},
				{
					label: 'Dora',
					href: '#dora',
					media: face,
					meta: 'Lun.',
					description: 'Done. The backup finished without errors.'
				},
				{ label: 'Réglages', href: '#settings', icon: 'R', meta: 'Hier' },
				{
					label: 'Équipe',
					icon: 'E',
					defaultOpen: true,
					items: [
						{
							label: 'Cyrus',
							href: '#cyrus',
							media: face,
							meta: '09:15',
							description: 'On it.'
						},
						{ label: 'Plain', href: '#plain' }
					]
				}
			]
		}
	]);
</script>

{#snippet face(api: SidebarApi, entry: SidebarMenuEntry | SidebarMenuSubEntry)}
	{onmediaentry?.(api, entry)}
	<svg data-testid="face" viewBox="0 0 40 40" aria-hidden="true">
		<circle cx="20" cy="20" r="20" fill="currentColor" />
	</svg>
{/snippet}

{#snippet dot()}
	<span data-testid="dot" style="display: block; width: 8px; height: 8px; border-radius: 50%;"
	></span>
{/snippet}

{#snippet metaSnippet()}<time datetime="2026-10-31">Hier</time>{/snippet}

{#snippet descriptionSnippet()}<em>Typing…</em>{/snippet}

<Theme>
	<div style="position: relative; width: 1000px; height: 600px;">
		<Sidebar {items} {displayState} {size} {iconSize} collapsible="icon" frame="contained" />
	</div>
</Theme>
