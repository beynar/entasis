<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import { dotsThreeIcon } from '$lib/components/Icons/dotsThree.js';
	import PopupMenu from '$lib/components/PopupMenu/PopupMenu.svelte';
	import type { MenuItem } from '$lib/components/Menu/index.js';
	import type {
		PageShellAction,
		PageShellActionOverflow,
		PageShellActions,
		PageShellApi,
		PageShellMobileActionCount
	} from './pageShell.props.js';
	import { usePageShellTheme, type PageShellThemeProps } from './pageShell.theme.js';

	let {
		api,
		actions,
		actionOverflow = 'auto',
		mobileActionCount = 1,
		theme
	}: {
		api: PageShellApi;
		actions?: PageShellActions;
		actionOverflow?: PageShellActionOverflow;
		mobileActionCount?: PageShellMobileActionCount;
		theme?: PageShellThemeProps;
	} = $props();

	const classes = $derived(usePageShellTheme(theme));
	const actionItems = $derived(Array.isArray(actions) ? actions : []);
	const shouldOverflow = $derived(
		actionOverflow === 'auto' && actionItems.length > mobileActionCount
	);
	const mobileActions = $derived(
		shouldOverflow ? actionItems.slice(0, mobileActionCount) : actionItems
	);
	const overflowActions = $derived(shouldOverflow ? actionItems.slice(mobileActionCount) : []);
	const overflowItems = $derived(overflowActions.map(toMenuItem));

	function toMenuItem(action: PageShellAction): MenuItem {
		const { content, type: _buttonType, ...buttonProps } = action;
		return {
			...buttonProps,
			type: 'button',
			children: buttonProps.children ?? content ?? action.label
		};
	}
</script>

{#if actions}
	{#if Array.isArray(actions)}
		<div class={classes.inlineActions()}>
			{#each actions as action, index (index)}
				{@const { content: label, ...buttonProps } = action}
				<Button {...buttonProps}>{label}</Button>
			{/each}
		</div>

		<div class={classes.mobileActions()}>
			{#each mobileActions as action, index (index)}
				{@const { content: label, ...buttonProps } = action}
				<Button {...buttonProps}>{label}</Button>
			{/each}

			{#if overflowItems.length}
				<PopupMenu menu={{ items: overflowItems }} position="bottom-end" fitTrigger={false}>
					{#snippet trigger(popover)}
						<Button
							variant="outline"
							squared
							label="More actions"
							prefix={dotsThreeIcon}
							class={classes.overflowTrigger()}
							{@attach popover.reference}
							onclick={() => popover.toggle()}
						/>
					{/snippet}
				</PopupMenu>
			{/if}
		</div>
	{:else}
		{@render actions(api)}
	{/if}
{/if}
