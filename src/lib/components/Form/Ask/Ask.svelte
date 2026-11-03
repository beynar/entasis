<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import Dialog from '$lib/components/Dialog/Dialog.svelte';
	import type { Sizes } from '$lib/types/theme.js';
	import { onMount } from 'svelte';
	import Form from '../Form/Form.svelte';
	import type { FormState } from '../Form/form.state.svelte.js';
	import type { FormInputs, InferFormValue, LiveFormValue } from '../Form/form.js';
	import type { AskButton, AskProps, AskResult } from './ask.props.js';
	import { registerAskHost, type AskRequest } from './ask.js';
	import type { FormToolOptions } from '../Form/form.props.js';
	import {
		registerWebMCPTool,
		toolText,
		useWebMCPConfig,
		type WebMCPToolHandle
	} from '$lib/utils/webmcp/webmcp.registry.js';
	import type { WebMCPTool } from '$lib/utils/webmcp/webmcp.types.js';

	type AskButtonOptions = Exclude<AskButton, string>;
	type ResolvedAskButton = {
		text: string;
		disabled: boolean;
		size?: Sizes;
		props: Omit<AskButtonOptions, 'text' | 'disabled' | 'size'>;
	};

	type AskViewState = AskRequest & {
		open: boolean;
		form?: FormState<FormInputs>;
		value: LiveFormValue<FormInputs>;
		outcome?: AskResult<FormInputs>;
		failure?: unknown;
		hasFailure: boolean;
		settled: boolean;
		cancelButton: HTMLElement | null;
		confirmButton: HTMLElement | null;
	};

	let { type }: AskProps = $props();
	let asks = $state<AskViewState[]>([]);
	const webmcp = useWebMCPConfig();
	// By ask id. Plain: the effect below writes it and must not depend on it.
	const cancelTools: Record<string, WebMCPToolHandle> = {};

	// The tools follow the buttons: a disabled one has no tool, as a person could not press it.
	function askTool(askState: AskViewState): boolean | FormToolOptions {
		const { title, description, confirm, tool } = askState.options;
		if (tool === false || resolveButton(confirm).disabled) return false;
		const dialog = [toolText(title), toolText(description)].filter(Boolean).join(': ');
		return {
			name: 'answer_dialog',
			title: toolText(title) || undefined,
			description:
				`A dialog is waiting for an answer${dialog ? ` (${dialog})` : ''}. ` +
				`Calling this tool fills it in and confirms it with "${toolText(resolveButton(confirm).text)}".`,
			...(typeof tool === 'object' ? tool : {})
		};
	}

	function cancelTool(askState: AskViewState): WebMCPTool {
		const { id } = askState;
		return {
			name: 'cancel_dialog',
			description: `Dismisses the open dialog with "${toolText(resolveButton(askState.options.cancel).text)}", without answering it.`,
			execute: () => {
				const current = asks.find((candidate) => candidate.id === id);
				if (!current?.open || current.form?.loading) return { status: 'busy' };
				cancelAsk(current);
				return { status: 'cancelled' };
			}
		};
	}

	$effect(() => {
		const config = webmcp.options;
		const open = asks.filter(
			({ open, options }) =>
				config && open && options.tool !== false && !resolveButton(options.cancel).disabled
		);
		for (const askState of open) {
			const exposedTo = config?.exposedTo;
			const handle = cancelTools[askState.id];
			if (handle) handle.update(cancelTool(askState), { exposedTo });
			else {
				cancelTools[askState.id] = registerWebMCPTool(cancelTool(askState), {
					exposedTo,
					modal: askState.id
				});
			}
		}
		for (const [id, handle] of Object.entries(cancelTools)) {
			if (open.some((askState) => askState.id === id)) continue;
			handle.remove();
			delete cancelTools[id];
		}
	});

	function resolveButton(button: AskButton): ResolvedAskButton {
		if (typeof button === 'string') {
			return { text: button, disabled: false, props: {} };
		}

		const { text, disabled = false, size, ...props } = button;
		return { text, disabled, size, props };
	}

	// Each request mounts its Dialog open: the Dialog itself renders once mounted, so it still
	// plays its enter transition and reports `onAfterOpen`.
	function enqueueAsk(request: AskRequest): void {
		const viewState: AskViewState = {
			...request,
			open: true,
			value: { ...request.options.value },
			hasFailure: false,
			settled: false,
			cancelButton: null,
			confirmButton: null
		};

		asks.push(viewState);
	}

	function cancelAsk(askState: AskViewState): void {
		if (!askState.open || askState.settled || askState.form?.loading) return;
		askState.outcome = { submitted: false, value: { ...askState.value } };
		askState.open = false;
	}

	async function submitAsk(askState: AskViewState): Promise<void> {
		if (!askState.open || !askState.form || askState.form.loading || askState.settled) return;

		try {
			const value = await askState.form.submit();
			if (value === false || !askState.open || askState.settled) return;
			askState.outcome = { submitted: true, value };
			askState.open = false;
		} catch (error) {
			if (!askState.open || askState.settled) return;
			askState.failure = error;
			askState.hasFailure = true;
			askState.open = false;
		}
	}

	async function completeAskSubmission(
		askState: AskViewState,
		value: InferFormValue<FormInputs>
	): Promise<void> {
		try {
			await askState.options.onSubmit?.(value);
		} catch (error) {
			if (askState.open && !askState.settled) {
				askState.failure = error;
				askState.hasFailure = true;
				askState.open = false;
			}
			throw error;
		}

		if (!askState.open || askState.settled) return;
		askState.outcome = { submitted: true, value };
		askState.open = false;
	}

	function finishClose(askState: AskViewState): void {
		if (askState.settled) return;
		askState.settled = true;

		if (askState.hasFailure) {
			askState.reject(askState.failure);
		} else {
			askState.resolve(askState.outcome ?? { submitted: false, value: { ...askState.value } });
		}

		asks = asks.filter((candidate) => candidate.id !== askState.id);
	}

	onMount(() => {
		const unregister = registerAskHost(enqueueAsk);
		return () => {
			unregister();
			const error = new Error('<Ask /> was unmounted before the request completed.');
			for (const askState of asks) {
				if (askState.settled) continue;
				askState.settled = true;
				askState.reject(error);
			}
			asks = [];
			for (const [id, handle] of Object.entries(cancelTools)) {
				handle.remove();
				delete cancelTools[id];
			}
		};
	});
</script>

{#each asks as askState (askState.id)}
	{@const cancelButton = resolveButton(askState.options.cancel)}
	{@const confirmButton = resolveButton(askState.options.confirm)}
	<Dialog
		id={askState.id}
		type={askState.options.dialog?.type ?? type ?? 'modal'}
		responsive={askState.options.dialog?.responsive}
		size={askState.options.dialog?.size}
		scroll={askState.options.dialog?.scroll}
		bind:open={askState.open}
		title={askState.options.title}
		description={askState.options.description}
		closable={askState.open && !askState.form?.loading}
		closeOnEscape={askState.open && !askState.form?.loading}
		closeOnClickOutside={false}
		swipeToDismiss={false}
		tool={false}
		theme={{
			header: { base: '-mx-4 shrink-0 px-4' },
			footer: { base: 'border-neutral-muted -mx-4 mt-2 shrink-0 border-t px-4 pt-3' }
		}}
		onAfterClose={() => finishClose(askState)}
	>
		<!-- The form is the body, and the only part that scrolls: with `scroll: 'inner'` the card is
		     capped to the viewport, so a tall form shrinks here and the title, description and
		     buttons stay on screen. It runs to the card's edges (`-mx-4 px-4`, like the header and
		     footer) with a little room above and below, so a full-width field's focus ring is never
		     clipped. With `scroll: 'outer'` nothing caps it and it never scrolls. -->
		<div
			data-slot="ask-body"
			class="-mx-4 -my-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-1"
		>
			<Form
				inputs={askState.options.inputs}
				onSubmit={(value) => completeAskSubmission(askState, value)}
				bind:value={askState.value}
				bind:form={askState.form}
				class={askState.options.class}
				size={askState.options.size}
				density={askState.options.density}
				variant={askState.options.variant}
				layout={askState.options.layout}
				validationMode={askState.options.validationMode}
				validationDebounce={askState.options.validationDebounce}
				theme={askState.options.theme}
				tool={askTool(askState)}
			/>
		</div>

		{#snippet footer()}
			<!-- The button row lays itself out against the dialog footer's own width, not the
			     viewport: the wrapper is the inline-size container and `@sm` (24rem) is the width
			     at which a Cancel + Confirm pair sits side by side without either button wrapping. -->
			<!-- Confirm marks itself `loading`, never natively `disabled`, while the form submits: the
			     pressed button keeps keyboard focus, and Button still refuses activation. -->
			<div class="@container w-full">
				<div class="flex flex-col gap-2 @sm:flex-row @sm:justify-end">
					<Button
						color="neutral"
						tool={false}
						{...cancelButton.props}
						type="button"
						size={cancelButton.size ?? askState.options.size}
						disabled={!askState.open ||
							!askState.form ||
							askState.form.loading ||
							cancelButton.disabled}
						bind:ref={askState.cancelButton}
						onclick={() => cancelAsk(askState)}
					>
						{cancelButton.text}
					</Button>
					<Button
						tool={false}
						{...confirmButton.props}
						type="button"
						size={confirmButton.size ?? askState.options.size}
						loading={askState.form?.loading ?? false}
						disabled={!askState.open || !askState.form || confirmButton.disabled}
						bind:ref={askState.confirmButton}
						onclick={() => void submitAsk(askState)}
					>
						{confirmButton.text}
					</Button>
				</div>
			</div>
		{/snippet}
	</Dialog>
{/each}
