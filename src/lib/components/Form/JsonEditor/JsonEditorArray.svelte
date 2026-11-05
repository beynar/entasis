<script lang="ts">
	// The rows of a list: added, removed, duplicated and moved, by pointer or by keyboard. Rows keep
	// their identity through all of it (law 7), so the row being moved keeps focus and its state.
	import { tick } from 'svelte';
	import { arrowDownIcon } from '../../Icons/arrowDown.js';
	import { arrowUpIcon } from '../../Icons/arrowUp.js';
	import { copySimpleIcon } from '../../Icons/copySimple.js';
	import { dotsSixVerticalIcon } from '../../Icons/dotsSixVertical.js';
	import { plusIcon } from '../../Icons/plus.js';
	import { trashSimpleIcon } from '../../Icons/trashSimple.js';
	import SortableList from '../../SortableList/SortableList.svelte';
	import JsonEditorGuides from './JsonEditorGuides.svelte';
	import JsonEditorNode from './JsonEditorNode.svelte';
	import { rowTransition } from './jsonEditor.motion.js';
	import { JsonRowIds, useJsonEditor } from './jsonEditor.state.svelte.js';
	import { jsonEditorListTheme } from './jsonEditor.theme.js';
	import {
		blankFromInferred,
		blankJsonValue,
		itemSchema,
		restItemSchema,
		tupleSchemas,
		type JsonPath,
		type JsonSchemaObject,
		type JsonValue
	} from './jsonEditor.schema.js';

	let {
		path,
		list,
		schema,
		depth
	}: {
		path: JsonPath;
		list: JsonValue[];
		schema: JsonSchemaObject;
		depth: number;
	} = $props();

	const editor = useJsonEditor();
	const t = $derived(editor.t);
	const classes = $derived(editor.classes);
	const size = $derived(editor.size);
	const iconSize = $derived(size === 'small' ? 12 : 14);
	const id = $props.id();

	type Row = { id: string };
	const ids = new JsonRowIds(`${id}-row`);
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- A cache of stable objects, never read reactively.
	const rowObjects = new Map<string, Row>();
	const rowFor = (rowId: string) => {
		let row = rowObjects.get(rowId);
		if (!row) {
			row = { id: rowId };
			rowObjects.set(rowId, row);
		}
		return row;
	};
	const rows = $derived(ids.sync(list.length).map(rowFor));
	// Where a row really is. While it is dragged the list draws a preview of the new order, and a row's
	// path and value must not follow that until it is dropped.
	const positions = $derived(new Map(rows.map((row, index) => [row.id, index])));
	// Rows made here start open: the user is about to fill them in.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Read once, when a row mounts.
	const fresh = new Set<string>();
	// A row animates only when it is added or removed here. Without this it would also animate each
	// time the list around it opens, and when a drag takes it out of the preview.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Read once, when a row comes or goes.
	const animated = new Set<string>();
	const rowMotion = (node: Element, rowId: string) =>
		animated.delete(rowId) ? rowTransition(node) : { duration: 0 };

	const tupleLength = $derived(tupleSchemas(schema).length);
	const rest = $derived(restItemSchema(schema));
	const canAdd = $derived(
		!editor.locked &&
			rest !== false &&
			(schema.maxItems === undefined || list.length < schema.maxItems)
	);
	const minItems = $derived(Math.max(schema.minItems ?? 0, tupleLength));
	const canRemove = $derived(!editor.locked && list.length > minItems);
	// The items of a tuple each mean something at their position.
	const canMove = $derived(!editor.locked && tupleLength === 0 && list.length > 1);

	const blankRow = (index: number): JsonValue => {
		const blank = editor.free
			? blankFromInferred(itemSchema(schema, index))
			: blankJsonValue(itemSchema(schema, index), editor.rootSchema);
		return blank === undefined ? null : blank;
	};

	const addAt = (index: number) => {
		if (!canAdd) return;
		const rowId = ids.insert(index);
		fresh.add(rowId);
		animated.add(rowId);
		editor.set(path, [...list.slice(0, index), blankRow(index), ...list.slice(index)]);
		editor.touch(path);
		void editor.focusRow(rowId);
	};

	const removeAt = (index: number) => {
		if (!canRemove) return;
		const neighbour = rows[index + 1]?.id ?? rows[index - 1]?.id;
		animated.add(rows[index].id);
		ids.remove(index);
		editor.set(
			path,
			list.filter((_, position) => position !== index)
		);
		editor.touch(path);
		if (neighbour) void editor.focusRow(neighbour);
		else void focusAdd();
	};

	const duplicateAt = (index: number) => {
		if (!canAdd) return;
		const rowId = ids.insert(index + 1);
		fresh.add(rowId);
		animated.add(rowId);
		const copy = JSON.parse(JSON.stringify(list[index])) as JsonValue;
		editor.set(path, [...list.slice(0, index + 1), copy, ...list.slice(index + 1)]);
		void editor.focusRow(rowId);
	};

	const moveTo = (from: number, to: number) => {
		if (!canMove || to < 0 || to >= list.length || from === to) return;
		ids.move(from, to);
		const next = [...list];
		const [moved] = next.splice(from, 1);
		next.splice(to, 0, moved);
		// The browser drops focus from a node that moves: the control in use takes it back.
		const active = document.activeElement as HTMLElement | null;
		editor.set(path, next);
		editor.announce(t.jsonMoved(to + 1, list.length));
		void tick().then(() => {
			if (active?.isConnected && document.activeElement !== active) active.focus();
		});
	};

	let addButton = $state<HTMLButtonElement | null>(null);
	const focusAdd = async () => {
		await Promise.resolve();
		addButton?.focus();
	};

	const openRowMenu = (event: MouseEvent, index: number) => {
		const label = String(index);
		editor.openMenu({
			anchor: event.currentTarget as HTMLElement,
			items: [
				{
					key: 'duplicate',
					label: t.jsonDuplicate,
					icon: copySimpleIcon,
					disabled: !canAdd,
					action: () => duplicateAt(index)
				},
				{
					key: 'up',
					label: t.jsonMoveUp,
					icon: arrowUpIcon,
					disabled: !canMove || index === 0,
					action: () => moveTo(index, index - 1)
				},
				{
					key: 'down',
					label: t.jsonMoveDown,
					icon: arrowDownIcon,
					disabled: !canMove || index === list.length - 1,
					action: () => moveTo(index, index + 1)
				},
				{
					key: 'remove',
					label: t.jsonRemoveValue(label),
					icon: trashSimpleIcon,
					danger: true,
					disabled: !canRemove,
					action: () => removeAt(index)
				}
			]
		});
	};

	// Keys pressed in a row's control. Enter adds the next row, as in a list being typed out;
	// Backspace in an empty one takes it away; Alt+arrows move it.
	const onRowKey = (event: KeyboardEvent, index: number) => {
		if (event.isComposing || editor.locked) return;
		const target = event.target;
		if (!(target instanceof HTMLInputElement)) return;
		if (target.getAttribute('role') === 'combobox') return;
		if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
			event.preventDefault();
			moveTo(index, index + (event.key === 'ArrowUp' ? -1 : 1));
			return;
		}
		if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
			if (typeof list[index] === 'object') return;
			event.preventDefault();
			addAt(index + 1);
		} else if (event.key === 'Backspace' && target.value === '' && canRemove) {
			if (typeof list[index] === 'object') return;
			event.preventDefault();
			removeAt(index);
		}
	};
</script>

{#snippet grip(index: number)}
	<button
		type="button"
		data-dnd-handle
		class={classes.handle({ size })}
		aria-haspopup="menu"
		aria-label={t.jsonRowActions(index)}
		title={t.dragToReorder}
		onclick={(event) => openRowMenu(event, index)}
		onkeydown={(event) => {
			if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
				event.preventDefault();
				moveTo(index, index + (event.key === 'ArrowUp' ? -1 : 1));
			}
		}}
	>
		{@render dotsSixVerticalIcon({ size: iconSize })}
	</button>
{/snippet}

<div class={classes.rows()} data-slot="json-editor-rows">
	<SortableList
		items={rows}
		customHandle
		disabled={!canMove}
		theme={jsonEditorListTheme}
		onReorder={({ from, to }) => moveTo(from, to)}
	>
		{#snippet item({ item: row })}
			<!-- A row hears of a change in the list only if its own item changed: a long list stays quick. -->
			{@const index = positions.get(row.id) ?? 0}
			<div transition:rowMotion|global={row.id}>
				{#snippet handle()}
					{#if !editor.locked}{@render grip(index)}{/if}
				{/snippet}
				<JsonEditorNode
					path={[...path, index]}
					value={list[index]}
					schema={itemSchema(schema, index)}
					{depth}
					rowId={row.id}
					name={String(index)}
					kind="item"
					removable={canRemove}
					startOpen={fresh.has(row.id)}
					{handle}
					onRemove={() => removeAt(index)}
					onKeyCommand={(event) => onRowKey(event, index)}
				/>
			</div>
		{/snippet}
	</SortableList>

	{#if list.length === 0 && !canAdd}
		<div class={classes.addRow()}>
			<JsonEditorGuides {depth} />
			<span class={classes.empty({ size })}>{t.jsonEmptyArray}</span>
		</div>
	{/if}

	{#if canAdd}
		<div class={classes.addRow()}>
			<JsonEditorGuides {depth} />
			<button
				bind:this={addButton}
				type="button"
				class={classes.addButton({ size })}
				onclick={() => addAt(list.length)}
			>
				{@render plusIcon({ size: iconSize })}
				{t.jsonAddItem}
			</button>
		</div>
	{/if}
</div>
