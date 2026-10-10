<script lang="ts">
	import Dialog from '../Dialog/Dialog.svelte';
	import Button from '../Button/Button.svelte';
	import type { ButtonProps } from '../Button/button.props.js';
	import type { ConfirmationOutcome, ConfirmationState } from './confirmation.state.svelte.js';
	import { registerConfirmationHost } from './confirmation.state.svelte.js';
	import type { ConfirmationProps } from './confirmation.props.js';
	import { useConfirmationTheme } from './confirmation.theme.js';
	import { useTheme } from '../Theme/theme.state.svelte.js';
	import { onMount, tick } from 'svelte';
	let { theme }: ConfirmationProps = $props();

	let confirmations = $state<ConfirmationState[]>([]);

	const classes = $derived(useConfirmationTheme(theme));
	const themeState = useTheme();

	// Requests this host still owes an answer. A plain set, not `$state`: the unmount teardown
	// reads it, and a `$state` read in teardown can return the value from before the last change.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- read in teardown, never rendered
	const unanswered = new Set<(outcome: ConfirmationOutcome) => void>();

	// Mounted first, then opened on the next tick so the Dialog plays its enter transition.
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
						isOpen: false,
						loading: false,
						settle
					}) satisfies ConfirmationState;
					confirmations.push(confirmationState);
					tick().then(() => {
						confirmations.forEach((a) => {
							if (a.id === confirmationState.id) {
								a.isOpen = true;
							}
						});
					});
				})
		});
		return () => {
			unregister();
			// Nobody can answer these dialogs any more: settle them as declined so an
			// `await confirmation()` never hangs on a host that left (a layout remount).
			for (const settle of [...unanswered]) settle({ confirmed: false });
		};
	});

	const actionConfirmation =
		(
			confirmation: ConfirmationState,
			continued: boolean,
			onclick?: ButtonProps['onclick']
		): NonNullable<ButtonProps['onclick']> =>
		async (event) => {
			onclick?.(event);
			let result: unknown;
			if (continued && confirmation.onConfirm) {
				// A throwing or rejected `onConfirm` ends the loading state and keeps the dialog
				// open, so Cancel works again; the error still propagates like any handler error.
				try {
					const pending = confirmation.onConfirm();
					if (pending instanceof Promise) confirmation.loading = true;
					result = await pending;
				} finally {
					confirmation.loading = false;
				}
			}
			confirmation.isOpen = false;
			confirmation.settle({ confirmed: continued, result });
		};
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
