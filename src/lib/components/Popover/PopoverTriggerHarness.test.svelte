<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import Popover from './Popover.svelte';
	import type { PopoverApi } from './popover.api.js';
</script>

{#snippet profileTrigger(popover: PopoverApi)}
	<div data-testid="profile" {@attach popover.trigger}>Ada Lovelace</div>
{/snippet}

{#snippet legacyTrigger(popover: PopoverApi)}
	<button type="button" onclick={popover.toggle} {@attach popover.trigger}>Legacy</button>
{/snippet}

{#snippet openerTrigger(popover: PopoverApi)}
	<button type="button" onclick={() => popover.open()} {@attach popover.trigger}>Opener</button>
{/snippet}

{#snippet richBody()}
	<strong>Rich</strong> body
{/snippet}

<Theme>
	<Popover trigger={profileTrigger}>
		<p>Profile details</p>
	</Popover>
	<Popover trigger={{ children: richBody }}>
		<p>Rich panel</p>
	</Popover>
	<Popover trigger={legacyTrigger}>
		<p>Legacy panel</p>
	</Popover>
	<Popover trigger={openerTrigger}>
		<p>Opener panel</p>
	</Popover>
</Theme>
