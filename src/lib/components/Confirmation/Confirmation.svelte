<script lang="ts">
	import Dialog from '../Dialog/Dialog.svelte';
	import Button from '../Button/Button.svelte';
	import type { ButtonProps } from '../Button/button.props.js';
	import type { ConfirmationOutcome, ConfirmationState } from './confirmation.state.svelte.js';
	import { registerConfirmationHost } from './confirmation.state.svelte.js';
	import type { ConfirmationProps } from './confirmation.props.js';
	import { useConfirmationTheme } from './confirmation.theme.js';
	import { useTheme } from '../Theme/theme.state.svelte.js';
	import { onMount } from 'svelte';
	import { composeHandlers } from '$lib/utils/handlers.js';
	let { theme }: ConfirmationProps = $props();

	let confirmations = $state<ConfirmationState[]>([]);

	const classes = $derived(useConfirmationTheme(theme));
	const themeState = useTheme();

	// Requests the user has not answered yet. A plain set, not `$state`: the unmount teardown
	// reads it, and a `$state` read in teardown can return the value from before the last change.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- read in teardown, never rendered
	const unanswered = new Set<(outcome: ConfirmationOutcome) => void>();
	// Set by the unmount teardown; a plain flag for the same reason.
	let unmounted = false;

	// Each request mounts its Dialog open: the Dialog itself renders once mounted, so it still
	// plays its enter transition and reports `onAfterOpen`.
	onMount(() => {
		const unregister = registerConfirmationHost(themeState, {
			request: (detail) =>
				new Promise<ConfirmationOutcome>((resolve) => {
					const settle = (outcome: ConfirmationOutcome) => {
						unanswered.delete(settle);
						resolve(outcome);
					};
					unanswered.add(settle);
					const confirmationState = Object.assign({}, detail, {
						isOpen: true,
						loading: false,
						settle
					}) satisfies ConfirmationState;
					confirmations.push(confirmationState);
				})
		});
		return () => {
			unmounted = true;
			unregister();
			// Nobody can answer these dialogs any more: settle them as declined so an
			// `await confirmation()` never hangs on a host that left (a layout remount). A request
			// whose `onConfirm` is running was answered, and settles when that finishes.
			for (const settle of [...unanswered]) settle({ confirmed: false });
		};
	});

	// The button's own `onclick` runs first; calling `event.preventDefault()` there keeps the
	// question open.
	const actionConfirmation = (
		confirmation: ConfirmationState,
		continued: boolean,
		onclick?: ButtonProps['onclick']
	): NonNullable<ButtonProps['onclick']> =>
		composeHandlers(onclick, async () => {
			let result: unknown;
			if (continued && confirmation.onConfirm) {
				// The user answered: while `onConfirm` runs, an unmount must not decline the request
				// (the action may be what navigated away), so it settles with the action's outcome.
				unanswered.delete(confirmation.settle);
				// A throwing or rejected `onConfirm` ends the loading state and keeps the dialog
				// open, so Cancel works again; the error still propagates like any handler error.
				try {
					const pending = confirmation.onConfirm();
					if (pending instanceof Promise) confirmation.loading = true;
					result = await pending;
				} catch (error) {
					// The question is open again, unless the host left and nobody can answer it.
					if (unmounted) confirmation.settle({ confirmed: false });
					else unanswered.add(confirmation.settle);
					throw error;
				} finally {
					confirmation.loading = false;
				}
			}
			confirmation.isOpen = false;
			confirmation.settle({ confirmed: continued, result });
		});
	// A Dialog sizes to its content, so it takes the device decision from JS rather than CSS — and
	// from the SAME value the Dialog itself used to pick sheet-versus-floating, instead of a second
	// hand-written `(max-width: 768px)` that can drift out of step with it.
	const isMobile = $derived(themeState.isMobile);
</script>

{#each confirmations as confirmation (confirmation.id)}
	<Dialog
		type="alert"
		class={classes.root()}
		onAfterClose={() => {
			confirmations = confirmations.filter((a) => a.id !== confirmation.id);
		}}
		closable={false}
		closeOnClickOutside={false}
		closeOnEscape={false}
		bind:open={confirmation.isOpen}
		title={confirmation.title}
		description={confirmation.description}
	>
		{#snippet footer()}
			<div class={classes.footer({ layout: isMobile ? 'stacked' : 'inline' })}>
				{#if typeof confirmation.cancel === 'object'}
					<Button
						disabled={confirmation.loading}
						color="neutral"
						{...confirmation.cancel}
						onclick={actionConfirmation(confirmation, false, confirmation.cancel.onclick)}
						fullWidth={isMobile}
					>
						{confirmation.cancel.text}
					</Button>
				{:else}
					<Button
						disabled={confirmation.loading}
						color="neutral"
						onclick={actionConfirmation(confirmation, false)}
						fullWidth={isMobile}
					>
						{confirmation.cancel}
					</Button>
				{/if}

				{#if typeof confirmation.confirm === 'object'}
					<Button
						loading={confirmation.loading}
						{...confirmation.confirm}
						onclick={actionConfirmation(confirmation, true, confirmation.confirm.onclick)}
						fullWidth={isMobile}
					>
						{confirmation.confirm.text}
					</Button>
				{:else}
					<Button
						loading={confirmation.loading}
						onclick={actionConfirmation(confirmation, true)}
						fullWidth={isMobile}
					>
						{confirmation.confirm}
					</Button>
				{/if}
			</div>
		{/snippet}
	</Dialog>
{/each}
