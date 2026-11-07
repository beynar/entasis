<script lang="ts">
	// An activity bar whose footer item opens a controlled Popover from its square.
	import Theme from '../Theme/Theme.svelte';
	import Sidebar from './Sidebar.svelte';
	import type { SidebarActivityBar } from './sidebar.props.js';
	import type { OpenChangeDetails } from '$lib/utils/openChange.js';

	let { reasons = [] }: { reasons?: string[] } = $props();
	let open = $state(false);

	const activityBar: SidebarActivityBar = $derived({
		items: [{ label: 'Home', icon: 'H', isActive: true }],
		footerItems: [
			{
				label: 'Notifications',
				icon: 'N',
				popover: {
					open,
					onOpenChange: (next: boolean, details: OpenChangeDetails) => {
						reasons.push(details.reason);
						open = next;
					},
					children: panel
				}
			}
		]
	});
</script>

{#snippet panel()}
	<button type="button">Mark all read</button>
{/snippet}

<Theme>
	<div style="position: relative; width: 900px; height: 500px;">
		<Sidebar
			{activityBar}
			items={[{ label: 'Pages', items: [{ label: 'Inbox', href: '#inbox' }] }]}
		>
			<p>page</p>
		</Sidebar>
	</div>
	<output data-testid="open">{open}</output>
</Theme>
