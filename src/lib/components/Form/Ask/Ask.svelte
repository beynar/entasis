<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import Dialog from '$lib/components/Dialog/Dialog.svelte';
	import type { Sizes } from '$lib/types/theme.js';
	import { onMount, tick } from 'svelte';
	import Form from '../Form/Form.svelte';
	import type { FormState } from '../Form/form.state.svelte.js';
	import type { FormInputs, InferFormValue, LiveFormValue } from '../Form/form.js';
	import type { AskButton, AskProps, AskResult } from './ask.props.js';
	import { registerAskHost, type AskRequest } from './ask.js';

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
		returnFocusPath: HTMLElement[];
		cancelButton: HTMLElement | null;
		confirmButton: HTMLElement | null;
	};

	let { type }: AskProps = $props();
	let asks = $state<AskViewState[]>([]);

	const focusableControl =
		'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

	function resolveButton(button: AskButton): ResolvedAskButton {
		if (typeof button === 'string') {
			return { text: button, disabled: false, props: {} };
		}

		const { text, disabled = false, size, ...props } = button;
		return { text, disabled, size, props };
	}

	function enqueueAsk(request: AskRequest): void {
		const returnFocusTo =
			document.activeElement instanceof HTMLElement ? document.activeElement : null;
		const parentAsk = getTopOpenAsk();
		const returnFocusPath = [
			...(returnFocusTo ? [returnFocusTo] : []),
			...(parentAsk?.returnFocusPath ?? [])
		].filter((target, index, targets) => targets.indexOf(target) === index);
		const viewState: AskViewState = {
			...request,
			open: false,
			value: { ...request.options.value },
			hasFailure: false,
			settled: false,
			returnFocusPath,
			cancelButton: null,
			confirmButton: null
		};

		asks.push(viewState);
		void openAsk(viewState);
	}

	async function openAsk(askState: AskViewState): Promise<void> {
		await tick();
		const activeAsk = asks.find((candidate) => candidate.id === askState.id);
		if (activeAsk && !activeAsk.settled) activeAsk.open = true;
	}

	function focusFirstControl(askState: AskViewState): void {
		for (const field of askState.form?.fields.values() ?? []) {
			const fieldNode = field.node?.matches(focusableControl)
				? field.node
				: field.rootNode?.querySelector<HTMLElement>(focusableControl);
			if (!fieldNode) continue;
			fieldNode.focus();
			return;
		}

		(askState.cancelButton ?? askState.confirmButton)?.focus();
	}

	function getTopOpenAsk(): AskViewState | undefined {
		for (let index = asks.length - 1; index >= 0; index -= 1) {
			const askState = asks[index];
			if (askState.open && !askState.settled) return askState;
		}
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

	async function restoreFocusAfterClose(returnFocusPath: HTMLElement[]): Promise<void> {
		await tick();
		const remainingAsk = getTopOpenAsk();
		if (remainingAsk) {
			focusFirstControl(remainingAsk);
			return;
		}

		for (const returnFocusTo of returnFocusPath) {
			if (!returnFocusTo.isConnected) continue;
			returnFocusTo.focus();
			return;
		}
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
		void restoreFocusAfterClose(askState.returnFocusPath);
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
		theme={{
			header: { base: '-mx-4 px-4' },
			footer: { base: 'border-neutral-muted -mx-4 mt-2 border-t px-4 pt-3' }
		}}
		onAfterOpen={(dialog) => {
			if (dialog.isTop) focusFirstControl(askState);
		}}
		onAfterClose={() => finishClose(askState)}
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
			theme={askState.options.theme}
		/>

		{#snippet footer()}
			<div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
				<Button
					color="neutral"
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
					{...confirmButton.props}
					type="button"
					size={confirmButton.size ?? askState.options.size}
					loading={askState.form?.loading ?? false}
					disabled={!askState.open ||
						!askState.form ||
						askState.form.loading ||
						confirmButton.disabled}
					bind:ref={askState.confirmButton}
					onclick={() => void submitAsk(askState)}
				>
					{confirmButton.text}
				</Button>
			</div>
		{/snippet}
	</Dialog>
{/each}
