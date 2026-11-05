<script lang="ts">
	// A key the user names: holds its draft until the name is settled, so a half-typed name never
	// reaches the value and a taken one is refused where it was typed.
	import { useJsonEditor } from './jsonEditor.state.svelte.js';

	let {
		value,
		placeholder,
		ariaLabel,
		readOnly = false,
		autofocus = false,
		onCommit,
		onCancel
	}: {
		value: string;
		placeholder?: string;
		ariaLabel: string;
		readOnly?: boolean;
		autofocus?: boolean;
		/** Takes the new name; returns why it cannot be used, or nothing. */
		onCommit: (next: string) => string | undefined;
		/** Called when the draft is left empty or abandoned. */
		onCancel?: () => void;
	} = $props();

	const editor = useJsonEditor();
	const classes = $derived(editor.classes);

	let draft = $state<string | null>(null);
	let problem = $state<string | undefined>();
	const shown = $derived(draft ?? value);
	const id = $props.id();

	const settle = () => {
		if (draft === null) return;
		const next = draft;
		if (next === value) {
			draft = null;
			problem = undefined;
			return;
		}
		if (next === '') {
			draft = null;
			problem = undefined;
			onCancel?.();
			return;
		}
		problem = onCommit(next);
		if (!problem) draft = null;
	};

	const abandon = (input: HTMLInputElement) => {
		draft = null;
		problem = undefined;
		input.value = value;
		onCancel?.();
	};
</script>

<input
	{id}
	type="text"
	autocomplete="off"
	spellcheck="false"
	data-1p-ignore
	data-json-key
	data-json-key-draft={draft === null ? undefined : ''}
	aria-label={ariaLabel}
	aria-invalid={problem ? 'true' : undefined}
	aria-describedby={problem ? `${id}-problem` : undefined}
	title={problem ?? shown}
	readonly={readOnly}
	{placeholder}
	value={shown}
	class={classes.keyInput({ size: editor.size, invalid: Boolean(problem) })}
	oninput={(event) => {
		draft = event.currentTarget.value;
		problem = undefined;
	}}
	onblur={settle}
	onkeydown={(event) => {
		if (event.isComposing) return;
		if (event.key === 'Enter') {
			event.preventDefault();
			settle();
			if (!problem) event.currentTarget.blur();
		} else if (event.key === 'Escape') {
			event.stopPropagation();
			abandon(event.currentTarget);
		}
	}}
	{@attach (node) => {
		if (autofocus) node.focus();
	}}
/>
{#if problem}
	<span id="{id}-problem" class="sr-only" role="alert">{problem}</span>
{/if}
