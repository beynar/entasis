<script lang="ts">
	// One value of the tree: its row (key, type, control, remove) and, for an object or an array, the
	// rows below it. The root object or array has no row of its own: the editor is its row.
	import { untrack, type Snippet } from 'svelte';
	import { disclosurePanel } from '$lib/attachments/disclosurePanel.svelte.js';
	import { tooltip } from '../../Tooltip/tooltip.attachment.svelte.js';
	import { caretDownIcon } from '../../Icons/caretDown.js';
	import { caretRightIcon } from '../../Icons/caretRight.js';
	import { infoIcon } from '../../Icons/info.js';
	import { plusIcon } from '../../Icons/plus.js';
	import { xIcon } from '../../Icons/x.js';
	import { presence } from '$lib/utils/stateAttributes.js';
	import Select from '../Select/Select.svelte';
	import JsonEditorArray from './JsonEditorArray.svelte';
	import JsonEditorGuides from './JsonEditorGuides.svelte';
	import JsonEditorKey from './JsonEditorKey.svelte';
	import JsonEditorObject from './JsonEditorObject.svelte';
	import JsonEditorValue from './JsonEditorValue.svelte';
	import { jsonTypeIcon, jsonValueIcon } from './jsonEditor.icons.js';
	import { jsonTypeLabel } from './jsonEditor.messages.js';
	import { useJsonEditor } from './jsonEditor.state.svelte.js';
	import { jsonEditorFieldTheme } from './jsonEditor.theme.js';
	import {
		JSON_TYPES,
		blankJsonValue,
		coerceJsonValue,
		editedType,
		canAddProperty,
		itemSchema,
		jsonPathKey,
		jsonTypeOf,
		resolveJsonSchema,
		type JsonObject,
		type JsonPath,
		type JsonSchema,
		type JsonType,
		type JsonValue
	} from './jsonEditor.schema.js';

	let {
		path,
		value,
		schema,
		depth,
		rowId,
		name,
		kind,
		required = false,
		startOpen = false,
		removable = false,
		handle,
		onRemove,
		onRename,
		onKeyCommand,
		attach
	}: {
		path: JsonPath;
		value: JsonValue | undefined;
		schema: JsonSchema | undefined;
		depth: number;
		rowId: string;
		/** The key, an index or a title: what the row calls this value. */
		name: string;
		/** `additional` keys are named by the user; `property` and `item` ones are given. */
		kind: 'root' | 'property' | 'additional' | 'item';
		required?: boolean;
		startOpen?: boolean;
		removable?: boolean;
		handle?: Snippet;
		onRemove?: () => void;
		onRename?: (next: string) => string | undefined;
		/** Keys pressed in this row's control, for the list that holds it. */
		onKeyCommand?: (event: KeyboardEvent) => void;
		attach?: import('svelte/attachments').Attachment<HTMLElement>;
	} = $props();

	const editor = useJsonEditor();
	const t = $derived(editor.t);
	const classes = $derived(editor.classes);
	const size = $derived(editor.size);
	const density = $derived(editor.density);

	let preferredVariant = $state<number | undefined>();
	const node = $derived(resolveJsonSchema(schema, editor.rootSchema, value, preferredVariant));
	const flat = $derived(node.schema);

	// Anything goes here: the editor has no schema, or this value's says nothing about its type.
	const loose = $derived(
		editor.free ||
			(node.types.length === 0 &&
				!node.options &&
				flat.const === undefined &&
				!flat.properties &&
				!flat.items &&
				!flat.prefixItems &&
				node.variants.length === 0)
	);
	const type = $derived<JsonType | undefined>(
		editor.free
			? (jsonTypeOf(value) ?? editedType(node, undefined) ?? 'string')
			: (editedType(node, value) ?? (loose ? 'string' : undefined))
	);

	// A closed list of unique options is one choice of several, not a list of rows.
	const itemOptions = $derived.by(() => {
		if (type !== 'array' || !flat.uniqueItems || !flat.items) return null;
		return resolveJsonSchema(itemSchema(flat, 0), editor.rootSchema, undefined).options;
	});
	const isContainer = $derived((type === 'object' || type === 'array') && !itemOptions);
	const isRoot = $derived(kind === 'root');
	const present = $derived(value !== undefined);
	// The root is there as soon as anything is written into it; a key below it must be set first.
	const showBody = $derived(isContainer && (present || isRoot));

	const label = $derived(flat.title && kind === 'property' ? flat.title : name);
	const locked = $derived(editor.locked || Boolean(flat.readOnly));

	// Offered types: what the schema lists, or every type when it lists none. The value's own type
	// stays listed even when the schema refuses it: that is the row's way out.
	const offeredTypes = $derived.by<JsonType[]>(() => {
		if (loose) return JSON_TYPES.filter((candidate) => candidate !== 'integer');
		const types = node.options || node.variants.length > 1 ? [] : node.types;
		return type && types.length > 0 && !types.includes(type) ? [...types, type] : types;
	});
	const changeableType = $derived(!locked && !node.options && offeredTypes.length > 1);

	let open = $state(
		untrack(() => {
			const forced = editor.expansion.open;
			return forced ?? (startOpen || depth < editor.expandDepth);
		})
	);
	let seenExpansion = untrack(() => editor.expansion.tick);
	let seenReveal = untrack(() => editor.revealTick);
	let seenRequest = untrack(() => editor.openRequest.tick);
	$effect.pre(() => {
		const { tick, open: forced } = editor.expansion;
		if (tick !== seenExpansion) {
			seenExpansion = tick;
			if (forced !== null) open = forced;
		}
	});
	$effect.pre(() => {
		const tick = editor.revealTick;
		if (tick === seenReveal) return;
		seenReveal = tick;
		if (untrack(() => editor.holdsIssue(path))) open = true;
	});
	$effect.pre(() => {
		const request = editor.openRequest;
		if (request.tick === seenRequest) return;
		seenRequest = request.tick;
		const mine = untrack(() => path);
		if (mine.every((segment, index) => request.path[index] === segment)) open = true;
	});

	const panel = disclosurePanel({ open: () => open });

	// Compared as text: most rows have nothing to say after most keystrokes, and a new empty list for
	// each would re-render every control of the tree.
	const messageText = $derived(editor.messagesFor(path).join('\n'));
	const rowMessages = $derived(messageText ? messageText.split('\n') : []);
	const nestedIssues = $derived(editor.nestedIssueCount(path));
	const invalid = $derived(rowMessages.length > 0);

	const count = $derived.by(() => {
		if (Array.isArray(value)) return t.jsonItemCount(value.length);
		if (value && typeof value === 'object') return t.jsonPropertyCount(Object.keys(value).length);
		return '';
	});
	const preview = $derived.by(() => {
		if (!isContainer || !present || open) return '';
		const text = JSON.stringify(value);
		return text && text.length > 120 ? `${text.slice(0, 120)}…` : (text ?? '');
	});

	const description = $derived(editor.descriptions === 'inline' ? flat.description : undefined);
	const descriptionTip = $derived(
		editor.descriptions === 'tooltip' && flat.description ? flat.description : undefined
	);

	const clearable = $derived(!required && !locked && kind === 'property' && present);
	const canRemove = $derived(!locked && (removable || clearable));
	const removeLabel = $derived(
		kind === 'property' ? t.jsonClearValue(label) : t.jsonRemoveValue(label)
	);

	const commit = (next: JsonValue | undefined) => {
		if (next !== undefined) {
			editor.set(path, next);
			return;
		}
		// An emptied control. A key the schema may leave out goes away, and so does a required one,
		// which is then reported missing. A row of a list stays, blank; a free key keeps its type.
		if (kind === 'item' || editor.free || flat.minLength === 0) {
			const blank = type === 'string' ? '' : type === 'null' ? null : null;
			editor.set(path, blank);
			return;
		}
		if (isRoot) editor.set(path, null);
		else editor.set(path, undefined);
	};

	let addRequested = $state(false);
	const canAddKey = $derived(
		type === 'object' && !isRoot && !locked && canAddProperty(flat, value, editor.free)
	);

	const setToBlank = () => {
		const blank = blankJsonValue(schema, editor.rootSchema, preferredVariant);
		editor.set(path, blank === undefined ? '' : blank);
		open = true;
		editor.touch(path);
	};

	const pickVariant = (next: string | null) => {
		if (next === null) return;
		const index = Number(next);
		preferredVariant = index;
		const branch = node.variants[index];
		if (!branch) return;
		const blank = blankJsonValue(branch.schema, editor.rootSchema);
		editor.set(path, blank === undefined ? null : blank);
		open = true;
	};

	const variantItems = $derived(
		node.variants.map((variant, index) => ({
			value: String(index),
			label: variant.label ?? t.jsonOption(index + 1)
		}))
	);

	const openTypeMenu = (event: MouseEvent) => {
		const anchor = event.currentTarget as HTMLElement;
		editor.openMenu({
			anchor,
			items: offeredTypes.map((candidate) => ({
				key: candidate,
				label: jsonTypeLabel(candidate, t),
				icon: jsonTypeIcon(candidate),
				checked: candidate === type,
				action: () => {
					if (candidate === type) return;
					editor.set(path, coerceJsonValue(value, candidate));
					open = true;
				}
			}))
		});
	};

	const icon = $derived(
		jsonValueIcon({
			type,
			format: typeof flat.format === 'string' ? flat.format : undefined,
			fixed: flat.const !== undefined,
			options: Boolean(node.options)
		})
	);
	const iconSize = $derived(size === 'small' ? 12 : 14);
	const typeName = $derived(type ? jsonTypeLabel(type, t) : '');

	// The root's row is its control, without a key to line up with.
	const bare = $derived(isRoot);
	const hasRow = $derived(!isRoot || !isContainer || node.variants.length > 1);
	// The rows of a root list keep a slot for their grip; those of a root object start at the edge.
	const childDepth = $derived(isRoot ? (type === 'array' ? 1 : 0) : depth + 1);
	const objectValue = $derived(
		value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonObject) : {}
	);
	const arrayValue = $derived(Array.isArray(value) ? value : []);

	// Controls carry the row's name themselves; hearing it from the key as well would say it twice.
	const controlNamesItself = $derived(!isContainer && flat.const === undefined && type !== 'null');

	const multiValue = $derived.by(() => {
		if (!itemOptions) return [];
		return arrayValue.flatMap((item) => {
			const index = itemOptions.findIndex(
				(option) => JSON.stringify(option.value) === JSON.stringify(item)
			);
			return index < 0 ? [] : [String(index)];
		});
	});
</script>

{#snippet body()}
	{#if type === 'array'}
		<JsonEditorArray {path} list={arrayValue} schema={flat} depth={childDepth} />
	{:else}
		<JsonEditorObject
			{path}
			object={objectValue}
			schema={flat}
			depth={childDepth}
			{addRequested}
			onAddHandled={() => (addRequested = false)}
			inlineAdd={!isRoot}
		/>
	{/if}
{/snippet}

{#if hasRow}
	<div
		class={classes.row({ density, bare: bare && !isContainer })}
		style:grid-template-columns={bare ? undefined : editor.rowColumns}
		data-slot="json-editor-row"
		data-json-row={rowId}
		data-json-path={jsonPathKey(path)}
		data-json-type={type}
		data-invalid={presence(invalid)}
		{@attach attach}
	>
		<div class={classes.key()}>
			{#if !bare}<JsonEditorGuides {depth} {handle} />{/if}
			<div class={classes.keyContent({ size, density })}>
				{#if changeableType}
					<button
						type="button"
						class={classes.typeIcon({ size, changeable: true })}
						aria-haspopup="menu"
						aria-label={t.jsonChangeType(label, typeName)}
						title={typeName}
						onclick={openTypeMenu}
					>
						{#if editor.typeIcons}
							{@render icon({ size: iconSize })}
						{:else}
							{@render caretRightIcon({ size: iconSize, class: 'rotate-90' })}
						{/if}
					</button>
				{:else if editor.typeIcons}
					<span class={classes.typeIcon({ size })} title={typeName} aria-hidden="true">
						{@render icon({ size: iconSize })}
					</span>
				{/if}
				{#if !bare}
					{#if kind === 'additional' && onRename}
						<JsonEditorKey
							value={name}
							ariaLabel={t.jsonPropertyName}
							readOnly={editor.locked}
							onCommit={onRename}
						/>
					{:else}
						<span
							class={classes.keyLabel({
								size,
								index: kind === 'item',
								deprecated: Boolean(flat.deprecated)
							})}
							title={label}
							aria-hidden={controlNamesItself ? 'true' : undefined}
						>
							{label}
						</span>
					{/if}
					{#if required}
						<span aria-hidden="true" class={classes.required({ size })}>*</span>
					{/if}
					{#if descriptionTip}
						<!-- A focusable span: the tooltip's text has to be reachable from the keyboard too. -->
						<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
						<span
							tabindex="0"
							role="img"
							class={classes.info()}
							aria-label={descriptionTip}
							{@attach tooltip({ content: descriptionTip, size: 'small' })}
						>
							{@render infoIcon({ size: iconSize })}
						</span>
					{/if}
				{/if}
			</div>
		</div>

		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class={classes.valueCell({ density })}
			data-json-value
			onfocusout={() => editor.touch(path)}
			onkeydown={(event) => onKeyCommand?.(event)}
		>
			<div class={classes.valueRow({ size })}>
				{#if node.variants.length > 1}
					<Select
						label={t.jsonVariant}
						size={editor.controlSize}
						density="compact"
						class={classes.variantSelect()}
						theme={jsonEditorFieldTheme}
						items={variantItems}
						readOnly={locked}
						alignItemWithTrigger={false}
						bind:value={() => String(node.variantIndex), pickVariant}
					/>
				{/if}
				{#if isContainer}
					{#if showBody}
						<div class={classes.summary({ size })}>
							{#if !isRoot}<span class="shrink-0">{count}</span>{/if}
							{#if preview}<span class={classes.preview()}>{preview}</span>{/if}
							{#if !open && nestedIssues > 0}
								<span class={classes.nestedIssues()}>{t.jsonIssueCount(nestedIssues)}</span>
							{/if}
							{#if canAddKey}
								<button
									type="button"
									class={classes.inlineAdd({ size })}
									aria-label={t.jsonAddProperty}
									title={t.jsonAddProperty}
									onclick={() => {
										open = true;
										addRequested = true;
									}}
								>
									{@render plusIcon({ size: iconSize })}
								</button>
							{/if}
							{#if !bare}
								<button
									type="button"
									data-json-toggle
									class={classes.toggle({ size, open })}
									aria-expanded={open}
									aria-label={open ? t.jsonCollapse(label) : t.jsonExpand(label)}
									onclick={() => (open = !open)}
								>
									{@render caretDownIcon({ size: iconSize })}
								</button>
							{/if}
						</div>
					{:else if !locked}
						<button type="button" class={classes.setButton({ size })} onclick={setToBlank}>
							{@render plusIcon({ size: iconSize })}
							{type === 'array' ? t.jsonAddList : t.jsonAddObject}
						</button>
					{:else}
						<span class={classes.empty({ size })}>{t.jsonUnset}</span>
					{/if}
				{:else if itemOptions}
					<Select
						multiple
						{label}
						size={editor.controlSize}
						density="compact"
						class="w-full"
						theme={jsonEditorFieldTheme}
						items={itemOptions.map((option, index) => ({
							value: String(index),
							label: option.label
						}))}
						readOnly={locked}
						{required}
						{description}
						bind:errors={() => rowMessages, () => {}}
						bind:value={
							() => multiValue,
							(next) =>
								commit((next ?? []).map((index) => itemOptions?.[Number(index)]?.value ?? null))
						}
					/>
				{:else}
					<JsonEditorValue
						{value}
						{node}
						{type}
						{label}
						{required}
						readOnly={Boolean(flat.readOnly)}
						errors={rowMessages}
						{description}
						onChange={commit}
					/>
				{/if}
			</div>
			{#if isContainer}
				{#if description}
					<p class={classes.description()}>{description}</p>
				{/if}
				{#each rowMessages as message (message)}
					<p class={classes.rowError()} role="alert">{message}</p>
				{/each}
			{/if}
		</div>

		<div class={classes.actions({ size, density })}>
			{#if canRemove}
				<button
					type="button"
					class={classes.removeButton({ size })}
					aria-label={removeLabel}
					title={removeLabel}
					onclick={() => (onRemove ? onRemove() : editor.set(path, undefined))}
				>
					{@render xIcon({ size: iconSize })}
				</button>
			{/if}
		</div>
	</div>
{/if}

{#if showBody}
	{#if isRoot}
		{@render body()}
	{:else if panel.rendered}
		<div {...panel.attributes} {@attach panel.attach}>
			{@render body()}
		</div>
	{/if}
{/if}
