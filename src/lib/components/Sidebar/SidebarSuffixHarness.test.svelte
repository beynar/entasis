<script lang="ts">
	// Rows carrying a `suffix` (a count, a Chip, their own « … » menu), top-level and filed in a
	// submenu, with and without a pinned action, in a contained frame.
	import Chip from '../Chip/Chip.svelte';
	import PopupMenu from '../PopupMenu/PopupMenu.svelte';
	import Theme from '../Theme/Theme.svelte';
	import Sidebar from './Sidebar.svelte';
	import type {
		SidebarApi,
		SidebarDisplayState,
		SidebarGroup,
		SidebarMenuEntry,
		SidebarMenuSubEntry
	} from './sidebar.props.js';

	let {
		displayState = 'expanded',
		label = 'Dossiers',
		onrowclick,
		onsuffixclick,
		onsuffixapi
	}: {
		displayState?: SidebarDisplayState;
		/** The first row's label, long to check truncation. */
		label?: string;
		onrowclick?: (event: MouseEvent) => void;
		onsuffixclick?: () => void;
		onsuffixapi?: (api: SidebarApi) => void;
	} = $props();

	const items: SidebarGroup[] = $derived([
		{
			label: 'Pages',
			items: [
				{ label, icon: 'D', href: '#dossiers', onclick: onrowclick, suffix: count },
				{
					label: 'Clients',
					icon: 'C',
					href: '#clients',
					onclick: onrowclick,
					badge: 3,
					suffix: menu,
					action: { label: 'Client actions' }
				},
				// Rows built as data share one snippet, told apart by their entry.
				{ label: 'Factures', icon: 'B', href: '#invoices', suffix: shared },
				{
					label: 'Classeur',
					icon: 'F',
					defaultOpen: true,
					items: [
						{ label: 'Archive', href: '#archive', onclick: onrowclick, suffix: chip },
						{ label: 'Devis', href: '#quotes', suffix: shared },
						{
							label: 'Brouillons partagés avec toute l’équipe',
							href: '#drafts',
							onclick: onrowclick,
							suffix: menu,
							action: { label: 'Draft actions' }
						}
					]
				}
			]
		}
	]);
</script>

{#snippet count(api: SidebarApi)}
	{onsuffixapi?.(api)}
	<span data-testid="count">20</span>
{/snippet}

{#snippet shared(api: SidebarApi, entry: SidebarMenuEntry | SidebarMenuSubEntry)}
	<span data-testid="shared" data-display-state={api.displayState}
		>{entry.href === '#invoices' ? '7' : '2'} · {entry.label}</span
	>
{/snippet}

{#snippet chip()}
	<Chip size="small" color="success">Publié</Chip>
{/snippet}

{#snippet menu()}
	<PopupMenu menu={{ items: [{ type: 'option', title: 'Rename' }] }}>
		{#snippet trigger(popover)}
			<button
				type="button"
				aria-label="Page menu"
				aria-expanded={popover.isOpen}
				{@attach popover.reference}
				onclick={() => {
					onsuffixclick?.();
					popover.toggle();
				}}>…</button
			>
		{/snippet}
	</PopupMenu>
{/snippet}

<Theme>
	<div style="position: relative; width: 1000px; height: 600px;">
		<Sidebar {items} {displayState} collapsible="icon" frame="contained">
			{#snippet children(api)}
				<button type="button" onclick={() => api.setOpenMobile(true)}>Open navigation</button>
			{/snippet}
		</Sidebar>
	</div>
</Theme>
