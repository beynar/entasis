<script lang="ts">
	// Harness for `browser-foundation.browser.test.ts`: real layout, focus order and keyboard
	// input in Chromium and WebKit, which jsdom cannot provide.
	import Theme from './Theme/Theme.svelte';
	import Dialog from './Dialog/Dialog.svelte';
	import Popover from './Popover/Popover.svelte';
	import PopupMenu from './PopupMenu/PopupMenu.svelte';
	import type { MenuItem } from './Menu/menu.props.js';

	type Scenario = 'tabbables' | 'popover' | 'dialog' | 'menu';
	let { scenario }: { scenario: Scenario } = $props();

	const zero = { in: { duration: 0 }, out: { duration: 0 } };
	const menuItems: MenuItem[] = [
		{ type: 'option', title: 'Archive' },
		{ type: 'option', title: 'Copy' },
		{ type: 'option', title: 'Cut' },
		{ type: 'option', title: 'Delete' }
	];
</script>

<Theme>
	<button type="button" data-testid="before">Before</button>

	{#if scenario === 'tabbables'}
		<!-- Every way an element can be skipped by Tab, next to the ones that are reached. -->
		<div data-testid="region">
			<button type="button">Visible</button>
			<button type="button" class="hidden">Display none</button>
			<button type="button" class="invisible">Visibility hidden</button>
			<div inert><button type="button">Inert</button></div>
			<div hidden><button type="button">Hidden attribute</button></div>
			<button type="button" disabled>Disabled</button>
			<div tabindex="-1">Programmatic only</div>
			<a href="#anchor">Link</a>
			<input aria-label="Text field" />
			<fieldset>
				<legend>Plan</legend>
				<input type="radio" name="plan" value="free" aria-label="Free" />
				<input type="radio" name="plan" value="pro" aria-label="Pro" checked />
			</fieldset>
			<div class="contents"><button type="button">Inside display contents</button></div>
			<div role="button" tabindex="0">Custom stop</div>
			<div class="h-0 overflow-hidden"><button type="button">Clipped to zero height</button></div>
		</div>
	{:else if scenario === 'popover'}
		<div class="p-32">
			<Popover transition={zero} position="bottom-start" trigger={{ content: 'Open popover' }}>
				<button type="button">Inside popover</button>
			</Popover>
		</div>
	{:else if scenario === 'dialog'}
		<Dialog responsive={false} transition={zero} title="Foundation dialog">
			{#snippet trigger(dialog)}
				<button type="button" onclick={dialog.open}>Open dialog</button>
			{/snippet}
			{#snippet children(dialog)}
				<input aria-label="First field" />
				<input aria-label="Second field" />
				<button type="button" onclick={dialog.close}>Done</button>
			{/snippet}
		</Dialog>
	{:else if scenario === 'menu'}
		<PopupMenu menu={{ items: menuItems }} transition={zero} trigger={{ content: 'Actions' }} />
	{/if}

	<button type="button" data-testid="after">After</button>
</Theme>
