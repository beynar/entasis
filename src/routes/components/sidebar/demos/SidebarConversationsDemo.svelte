<script lang="ts">
	import {
		Sidebar,
		type SidebarApi,
		type SidebarGroup,
		type SidebarMenuEntry,
		type SidebarMenuSubEntry
	} from '$lib/components/Sidebar/index.js';
	import type { Colors } from '$lib/types/theme.js';

	type Agent = { name: string; color: Colors; time: string; preview: string; unread?: boolean };

	const agents: Agent[] = [
		{
			name: 'Ada',
			color: 'primary',
			time: '10:42',
			preview: 'The quarterly report is ready. Want a summary of the key points?',
			unread: true
		},
		{
			name: 'Brune',
			color: 'success',
			time: '09:15',
			preview: 'I booked the venue for Thursday and sent the invitations.'
		},
		{
			name: 'Cyrus',
			color: 'warning',
			time: 'Hier',
			preview: 'Two invoices are still waiting for approval.',
			unread: true
		},
		{
			name: 'Dora',
			color: 'info',
			time: 'Lun.',
			preview: 'Done. The backup finished without errors.'
		}
	];

	let active = $state('Ada');

	const items: SidebarGroup[] = $derived([
		{
			label: 'Agents',
			items: agents.map((agent) => ({
				label: agent.name,
				href: `#${agent.name.toLowerCase()}`,
				media: face,
				meta: agent.time,
				description: agent.preview,
				isActive: active === agent.name,
				suffix: agent.unread ? unread : undefined,
				onclick: (event: MouseEvent) => {
					event.preventDefault();
					active = agent.name;
				}
			}))
		}
	]);

	const colorOf = (entry: SidebarMenuEntry | SidebarMenuSubEntry) =>
		agents.find((agent) => agent.name === entry.label)?.color ?? 'neutral';
</script>

<!-- One snippet draws every face, told apart by the row's entry. -->
<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
{#snippet face(_api: SidebarApi, entry: SidebarMenuEntry | SidebarMenuSubEntry)}
	<svg viewBox="0 0 40 40" aria-hidden="true" data-color={colorOf(entry)} class="text-color">
		<circle cx="20" cy="20" r="20" fill="currentColor" opacity="0.18" />
		<circle cx="14.5" cy="17" r="2.5" fill="currentColor" />
		<circle cx="25.5" cy="17" r="2.5" fill="currentColor" />
		<path
			d="M13 25q7 6 14 0"
			fill="none"
			stroke="currentColor"
			stroke-width="2.5"
			stroke-linecap="round"
		/>
	</svg>
{/snippet}

{#snippet unread()}
	<span class="bg-primary block size-2.5 rounded-full" aria-label="Unread"></span>
{/snippet}

<div class="h-[420px] w-full max-w-sm">
	<Sidebar mode="panel" variant="floating" width="20rem" iconSize="large" {items} />
</div>
