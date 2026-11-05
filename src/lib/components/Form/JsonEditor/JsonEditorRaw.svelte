<script lang="ts">
	// The value as JSON text. What parses is the value at once; what does not stays a draft, reported
	// where it was typed, and the value keeps what it had.
	import TextArea from '../TextArea/TextArea.svelte';
	import { useJsonEditor } from './jsonEditor.state.svelte.js';
	import { jsonEquals } from './jsonEditor.validate.js';

	const editor = useJsonEditor();
	const t = $derived(editor.t);
	const classes = $derived(editor.classes);

	const format = (value: unknown) =>
		value === undefined || value === null ? '' : JSON.stringify(value, null, 2);

	let draft = $state<string | null>(null);
	let problem = $state<string | null>(null);
	const text = $derived(draft ?? format(editor.value));

	const onInput = (next: string | null) => {
		const source = next ?? '';
		draft = source;
		if (source.trim() === '') {
			problem = null;
			editor.replace(null);
			return;
		}
		try {
			const parsed = JSON.parse(source);
			problem = null;
			if (!jsonEquals(parsed, editor.value)) editor.replace(parsed);
		} catch {
			problem = t.jsonInvalidSyntax;
		}
	};

	const issuePath = (path: readonly (string | number)[]) =>
		path.length === 0 ? '$' : path.map((segment) => String(segment)).join('.');
</script>

<div class={classes.raw()} data-slot="json-editor-raw">
	<TextArea
		label={t.jsonViewRaw}
		density="compact"
		size={editor.controlSize}
		rows={8}
		class="w-full"
		theme={{
			header: { base: 'absolute sr-only' },
			inputContainer: { base: 'h-auto' },
			input: { base: 'font-mono text-xs leading-relaxed' }
		}}
		textareaAttrs={{
			spellcheck: false,
			onblur: () => {
				// Settled text reads as the editor writes it, unless it still does not parse.
				if (!problem) draft = null;
			}
		}}
		bind:errors={() => (problem ? [problem] : []), () => {}}
		bind:value={() => text, onInput}
	/>
	{#if !problem && editor.issues.length > 0}
		<ul class={classes.rawIssues()}>
			{#each editor.issues as issue (`${issuePath(issue.path)}:${issue.code}`)}
				<li class={classes.rawIssue()}>
					<span class={classes.rawIssuePath()}>{issuePath(issue.path)}</span>
					<span>{issue.text}</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>
