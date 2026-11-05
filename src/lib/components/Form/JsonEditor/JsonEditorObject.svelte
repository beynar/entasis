<script lang="ts">
	// The rows of an object: the keys the schema declares, in its order, then whatever else the value
	// holds. A key the user named keeps its row identity through a rename, so it keeps focus too.
	import { untrack } from 'svelte';
	import { flip } from 'svelte/animate';
	import { prefersReducedMotion } from '$lib/utils/motion.svelte.js';
	import { plusIcon } from '../../Icons/plus.js';
	import { xIcon } from '../../Icons/x.js';
	import JsonEditorGuides from './JsonEditorGuides.svelte';
	import JsonEditorKey from './JsonEditorKey.svelte';
	import JsonEditorNode from './JsonEditorNode.svelte';
	import { rowTransition } from './jsonEditor.motion.js';
	import { useJsonEditor } from './jsonEditor.state.svelte.js';
	import {
		blankJsonValue,
		canAddProperty,
		isJsonKeyFree,
		propertySchema,
		renameJsonKey,
		type JsonObject,
		type JsonPath,
		type JsonSchemaObject
	} from './jsonEditor.schema.js';
	import { isValidJson } from './jsonEditor.validate.js';

	let {
		path,
		object,
		schema,
		depth,
		addRequested = false,
		onAddHandled,
		inlineAdd = false
	}: {
		path: JsonPath;
		object: JsonObject;
		schema: JsonSchemaObject;
		depth: number;
		/** The add button of the row above was pressed; this may be why the rows just mounted. */
		addRequested?: boolean;
		onAddHandled?: () => void;
		/** The row above has the add button, so none is needed under the keys. */
		inlineAdd?: boolean;
	} = $props();

	const editor = useJsonEditor();
	const t = $derived(editor.t);
	const classes = $derived(editor.classes);
	const size = $derived(editor.size);
	const density = $derived(editor.density);
	const iconSize = $derived(size === 'small' ? 12 : 14);
	const id = $props.id();

	let nextId = 0;
	const makeId = () => `${id}-key-${nextId++}`;
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Row identity, written as the keys change.
	const keyIds = new Map<string, string>();
	const idFor = (key: string) => {
		let found = keyIds.get(key);
		if (!found) {
			found = makeId();
			keyIds.set(key, found);
		}
		return found;
	};

	type Entry = { id: string; key: string; declared: boolean; required: boolean };
	const entries = $derived.by<Entry[]>(() => {
		const required = new Set(schema.required ?? []);
		// Without a schema of the app's, the value alone decides which keys exist.
		const declaredKeys = editor.free ? [] : Object.keys(schema.properties ?? {});
		const declared = new Set(declaredKeys);
		const extras = Object.keys(object).filter((key) => !declared.has(key));
		return [
			...declaredKeys.map((key) => ({
				id: idFor(key),
				key,
				declared: true,
				required: required.has(key)
			})),
			...extras.map((key) => ({
				id: idFor(key),
				key,
				declared: false,
				required: required.has(key) && !editor.free
			}))
		];
	});

	// Keys named here start open: the user is about to fill them in.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Read once, when a row mounts.
	const fresh = new Set<string>();
	const canAdd = $derived(!editor.locked && canAddProperty(schema, object, editor.free));
	let pending = $state<string | null>(null);
	$effect.pre(() => {
		if (!addRequested) return;
		untrack(() => {
			if (canAdd) pending = makeId();
			onAddHandled?.();
		});
	});

	const nameProblem = (name: string, current?: string) => {
		if (name !== current && !isJsonKeyFree(object, name)) return t.jsonIssueKeyTaken;
		if (
			schema.propertyNames !== undefined &&
			!isValidJson(name, schema.propertyNames, editor.rootSchema)
		) {
			return t.jsonIssueKeyInvalid;
		}
		if (schema.additionalProperties === false && !propertySchema(schema, name)) {
			return t.jsonIssueKeyInvalid;
		}
		return undefined;
	};

	const childSchema = (key: string) =>
		editor.free ? schema.properties?.[key] : propertySchema(schema, key);

	const rename = (from: string, to: string) => {
		const problem = nameProblem(to, from);
		if (problem) return problem;
		const rowId = keyIds.get(from);
		if (rowId) {
			keyIds.delete(from);
			keyIds.set(to, rowId);
		}
		editor.set(path, renameJsonKey(object, from, to));
		return undefined;
	};

	const addKey = (key: string) => {
		const problem = nameProblem(key);
		if (problem) return problem;
		const rowId = pending ?? makeId();
		keyIds.set(key, rowId);
		fresh.add(rowId);
		pending = null;
		const blank = blankJsonValue(childSchema(key), editor.rootSchema);
		editor.set([...path, key], blank === undefined ? '' : blank);
		void editor.focusRow(rowId);
		return undefined;
	};

	const removeKey = (key: string, index: number) => {
		const after = entries[index + 1]?.id ?? entries[index - 1]?.id;
		keyIds.delete(key);
		editor.set([...path, key], undefined);
		editor.touch(path);
		if (after) void editor.focusRow(after);
	};

	const flipParams = $derived({ duration: prefersReducedMotion() ? 0 : 160 });
</script>

<div class={classes.rows()} data-slot="json-editor-rows">
	{#each entries as entry, index (entry.id)}
		<!-- A row hears of a change in the object only if its own value changed. -->
		{@const entryValue = object[entry.key]}
		<div animate:flip={flipParams} transition:rowTransition>
			<JsonEditorNode
				path={[...path, entry.key]}
				value={entryValue}
				schema={childSchema(entry.key)}
				{depth}
				rowId={entry.id}
				name={entry.key}
				kind={entry.declared ? 'property' : 'additional'}
				required={entry.required}
				removable={!entry.declared && !entry.required}
				startOpen={fresh.has(entry.id)}
				onRemove={entry.declared ? undefined : () => removeKey(entry.key, index)}
				onRename={entry.declared ? undefined : (next) => rename(entry.key, next)}
			/>
		</div>
	{/each}

	{#if pending}
		<div
			class={classes.row({ density })}
			style:grid-template-columns={editor.rowColumns}
			transition:rowTransition
		>
			<div class={classes.key()}>
				<JsonEditorGuides {depth} />
				<div class={classes.keyContent({ size, density })}>
					<span aria-hidden="true" class={classes.typeIcon({ size })}>
						{@render plusIcon({ size: iconSize })}
					</span>
					<JsonEditorKey
						value=""
						autofocus
						placeholder={t.jsonPropertyName}
						ariaLabel={t.jsonPropertyName}
						onCommit={addKey}
						onCancel={() => (pending = null)}
					/>
				</div>
			</div>
			<div></div>
			<div class={classes.actions({ size, density })}>
				<button
					type="button"
					class={classes.removeButton({ size })}
					aria-label={t.close}
					onclick={() => (pending = null)}
				>
					{@render xIcon({ size: iconSize })}
				</button>
			</div>
		</div>
	{:else if entries.length === 0 && !canAdd}
		<div class={classes.addRow()}>
			<JsonEditorGuides {depth} />
			<span class={classes.empty({ size })}>{t.jsonEmptyObject}</span>
		</div>
	{/if}

	{#if canAdd && !pending && !inlineAdd}
		<div class={classes.addRow()}>
			<JsonEditorGuides {depth} />
			<button
				type="button"
				class={classes.addButton({ size })}
				onclick={() => (pending = makeId())}
			>
				{@render plusIcon({ size: iconSize })}
				{t.jsonAddProperty}
			</button>
		</div>
	{/if}
</div>
