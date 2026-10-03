<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import Popover from './Popover.svelte';
	import type { PopoverState } from './popover.state.svelte.js';
</script>

{#snippet profileTrigger(popover: PopoverState)}
	<div data-testid="profile" {@attach popover.trigger}>Ada Lovelace</div>
{/snippet}

{#snippet legacyTrigger(popover: PopoverState)}
	<button type="button" onclick={popover.toggle} {@attach popover.trigger}>Legacy</button>
{/snippet}

{#snippet openerTrigger(popover: PopoverState)}
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
