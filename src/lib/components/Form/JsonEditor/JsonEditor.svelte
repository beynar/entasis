<script lang="ts">
	import { BROWSER } from 'esm-env';
	import { setContext, tick, untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { boundDefault, createBindableValue } from '$lib/utils/state.svelte.js';
	import { useClipboard } from '$lib/utils/useClipboard.svelte.js';
	import { useLiveAnnouncer } from '$lib/utils/useLiveAnnouncer.svelte.js';
	import { useWebMCPExposure } from '$lib/utils/webmcp/webmcp.exposure.svelte.js';
	import { tooltip } from '../../Tooltip/tooltip.attachment.svelte.js';
	import { arrowsInSimpleIcon } from '../../Icons/arrowsInSimple.js';
	import { arrowsOutSimpleIcon } from '../../Icons/arrowsOutSimple.js';
	import { checkIcon } from '../../Icons/check.js';
	import { copySimpleIcon } from '../../Icons/copySimple.js';
	import { warningCircleIcon } from '../../Icons/warningCircle.js';
	import PopupMenu from '../../PopupMenu/PopupMenu.svelte';
	import type { MenuItem } from '../../Menu/menu.props.js';
	import SegmentedControl from '../../SegmentedControl/SegmentedControl.svelte';
	import Field from '../Field/Field.svelte';
	import FieldHiddenInputs from '../Field/FieldHiddenInputs.svelte';
	import {
		createFieldState,
		type FieldState,
		type FieldValidatorResult
	} from '../Field/field.state.svelte.js';
	import JsonEditorNode from './JsonEditorNode.svelte';
	import JsonEditorRaw from './JsonEditorRaw.svelte';
	import type { JsonEditorControl, JsonEditorMode, JsonEditorProps } from './jsonEditor.props.js';
	import { initialJsonValue, type JsonValue } from './jsonEditor.schema.js';
	import {
		JsonEditorState,
		setJsonEditor,
		type JsonEditorMenu
	} from './jsonEditor.state.svelte.js';
	import { useJsonEditorTheme } from './jsonEditor.theme.js';
	import type { JsonEditorToolSource } from './jsonEditor.webmcp.js';

	let {
		defaultValue = null,
		value = $bindable(),
		errors = $bindable([]),
		focused = $bindable(false),
		mode = $bindable(),
		// eslint-disable-next-line no-useless-assignment -- Written below, for `bind:api`.
		api = $bindable(),
		schema,
		required = false,
		disabled,
		readOnly,
		messages,
		name,
		onValidate,
		onValueChange,
		onModeChange,
		onIssuesChange,
		visible,
		validationMode,
		size = 'small',
		density = 'normal',
		controls = true,
		typeIcons = true,
		expandDepth = 2,
		descriptions = 'inline',
		keyWidth,
		i18n,
		theme,
		tool,
		...rest
	}: JsonEditorProps = $props();

	if (value === undefined) {
		value = untrack(() => boundDefault(defaultValue ?? initialJsonValue(schema) ?? null));
	}

	const id = $props.id();
	const t = $derived(useI18n(i18n));
	const classes = $derived(useJsonEditorTheme(theme));

	const modeState = createBindableValue<JsonEditorMode>(
		() => mode,
		(next) => {
			mode = next;
		},
		() => 'tree'
	);

	const field: FieldState<'json'> = createFieldState<'json'>({
		id,
		get value() {
			return value;
		},
		set value(next) {
			value = next;
		},
		get errors() {
			return errors;
		},
		set errors(next: string[] | boolean) {
			errors = next;
		},
		get focused() {
			return focused;
		},
		set focused(next: boolean) {
			focused = next;
		},
		onValueChange: (next) => {
			onValueChange?.(next ?? null);
		},
		get disabled() {
			return disabled;
		},
		set disabled(next: boolean | undefined) {
			disabled = next;
		},
		get readOnly() {
			return readOnly;
		},
		get messages() {
			return messages;
		},
		get required() {
			return required;
		},
		get name() {
			return name;
		},
		set name(next: string | undefined) {
			name = next;
		},
		get onValidate() {
			return checkValue;
		},
		get visible() {
			return visible;
		},
		get validationMode() {
			return validationMode;
		},
		type: 'json'
	});

	// The controls of the rows belong to this editor, not to a Form around it: only the whole value
	// is a field of that Form.
	setContext('form', undefined);

	const locked = $derived(field.disabled || field.readOnly);

	let rootElement = $state<HTMLElement | null>(null);
	let menu = $state<JsonEditorMenu | null>(null);
	let menuOpen = $state(false);
	const announcer = useLiveAnnouncer(id);

	const editor: JsonEditorState = new JsonEditorState({
		get value() {
			// A free editor without a value is an empty object waiting for its first key.
			return field.value ?? (schema === undefined ? {} : undefined);
		},
		get schema() {
			return schema;
		},
		get t() {
			return t;
		},
		get messages() {
			return field.messages;
		},
		get classes() {
			return classes;
		},
		get size() {
			return size;
		},
		get density() {
			return density;
		},
		get typeIcons() {
			return typeIcons;
		},
		get descriptions() {
			return descriptions;
		},
		get expandDepth() {
			return expandDepth;
		},
		get keyWidth() {
			return keyWidth;
		},
		get locked() {
			return locked;
		},
		get showEveryIssue() {
			return validationMode === 'change';
		},
		get root() {
			return rootElement;
		},
		commit: (next) => field.setValue((next ?? null) as JsonValue | null),
		announce: (message) => announcer.announce(message),
		openMenu: (next) => {
			menu = next;
			menuOpen = false;
			void tick().then(() => (menuOpen = true));
		}
	});
	setJsonEditor(editor);

	useWebMCPExposure<JsonEditorToolSource>(
		() => import('./jsonEditor.webmcp.js'),
		{
			get tool() {
				return tool;
			},
			get label() {
				return rest.label;
			},
			get schema() {
				return schema;
			},
			get value() {
				return editor.value;
			},
			get disabled() {
				return field.disabled;
			},
			get readOnly() {
				return field.readOnly;
			},
			get issues() {
				return editor.issues;
			},
			replace: (next) => editor.replace(next)
		},
		// In a Form, the value is a field of the form's own tool.
		() => field.form === undefined
	);

	// A submit, or `field.validate()`, checks the value against the schema, then the app's own rule.
	function checkValue(next: JsonValue): FieldValidatorResult {
		editor.reveal();
		const count: number = editor.issues.length;
		if (count > 0) return t.jsonIssueCount(count);
		return onValidate?.(next);
	}

	const validate = () => {
		editor.reveal();
		field.validate();
		return editor.issues.length === 0 && !field.hasError;
	};

	if (BROWSER) {
		// eslint-disable-next-line no-useless-assignment -- Read by the parent through `bind:api`.
		api = {
			get issues() {
				return editor.issues;
			},
			validate,
			expandAll: () => editor.setAllOpen(true),
			collapseAll: () => editor.setAllOpen(false),
			focus: (path) => editor.focusPath(path)
		};
	}

	let lastIssues = '';
	$effect(() => {
		const issues = editor.issues;
		const signature = JSON.stringify(issues);
		if (signature === lastIssues) return;
		const first = lastIssues === '' && issues.length === 0;
		lastIssues = signature;
		if (!first) untrack(() => onIssuesChange?.(issues));
	});

	const onHistoryKey = (event: KeyboardEvent) => {
		if (event.defaultPrevented || event.isComposing || event.altKey || locked) return;
		if (!event.metaKey && !event.ctrlKey) return;
		const key = event.key.toLowerCase();
		const undo = key === 'z' && !event.shiftKey;
		const redo = (key === 'z' && event.shiftKey) || (key === 'y' && event.ctrlKey);
		if (!undo && !redo) return;
		// The JSON text and a key still being named are their own undo: nothing has reached the value.
		if (modeState.value === 'json') return;
		if (event.target instanceof Element && event.target.closest('[data-json-key-draft]')) return;
		if (undo ? editor.undo() : editor.redo()) event.preventDefault();
	};

	const showControl = (control: JsonEditorControl) =>
		controls === true || (Array.isArray(controls) && controls.includes(control));
	const hasToolbar = $derived(controls !== false && (controls === true || controls.length > 0));

	const clipboard = useClipboard();
	const copyJson = () => {
		const current = field.value;
		clipboard.copy(
			current === null || current === undefined ? '' : JSON.stringify(current, null, 2)
		);
	};

	const modeItems = $derived([
		{ value: 'tree' as const, label: t.jsonViewTree },
		{ value: 'json' as const, label: t.jsonViewRaw }
	]);

	const iconSize = $derived(size === 'large' ? 16 : 14);
	const shownIssues = $derived(editor.shownIssues);

	const focusFirstIssue = () => {
		const first = shownIssues[0];
		if (first) void editor.focusPath(first.path);
	};

	const menuItems = $derived<MenuItem[]>(
		(menu?.items ?? []).map((item) => ({
			type: 'option',
			key: item.key,
			title: item.label,
			prefix: item.icon,
			suffix: item.checked ? checkIcon : undefined,
			color: item.danger ? 'danger' : undefined,
			disabled: item.disabled,
			onclick: item.action
		}))
	);

	const hiddenValue = $derived(
		field.value === null || field.value === undefined ? null : JSON.stringify(field.value)
	);

	// Native forms take their data from the hidden input: the controls of the rows name nothing the
	// form should see, so they point at a form that does not exist.
	const detachedForm = `${id}-detached`;
	const detachControls: Attachment<HTMLElement> = (tree) => {
		const mark = () => {
			for (const control of tree.querySelectorAll('input, select, textarea')) {
				if (control.getAttribute('form') !== detachedForm) {
					control.setAttribute('form', detachedForm);
				}
			}
		};
		mark();
		const observer = new MutationObserver(mark);
		observer.observe(tree, { childList: true, subtree: true });
		return () => observer.disconnect();
	};

	const fieldTheme = $derived({
		...(theme ?? {}),
		inputContainer: {
			...(theme?.inputContainer ?? {}),
			base: classes.inputContainer({ class: theme?.inputContainer?.base })
		}
	});
</script>

<Field as="fieldset" {field} {size} {validationMode} theme={fieldTheme} {...rest}>
	<FieldHiddenInputs {field} value={hiddenValue} />
	<!-- Focusable so that a press on an empty part of it, or an undone row going away, leaves the
	     shortcuts reachable. -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={rootElement}
		data-slot="json-editor"
		data-mode={modeState.value}
		data-size={size}
		tabindex="-1"
		onkeydown={onHistoryKey}
		class={classes.root({ disabled: field.disabled, invalid: field.hasError })}
	>
		{#if hasToolbar}
			<div class={classes.toolbar({ size })} data-slot="json-editor-toolbar">
				<div class={classes.toolbarGroup()}>
					{#if showControl('expand') && modeState.value === 'tree'}
						<button
							type="button"
							class={classes.toolbarButton({ size })}
							aria-label={t.jsonExpandAll}
							onclick={() => editor.setAllOpen(true)}
							{@attach tooltip({ content: t.jsonExpandAll, size: 'small' })}
						>
							{@render arrowsOutSimpleIcon({ size: iconSize })}
						</button>
						<button
							type="button"
							class={classes.toolbarButton({ size })}
							aria-label={t.jsonCollapseAll}
							onclick={() => editor.setAllOpen(false)}
							{@attach tooltip({ content: t.jsonCollapseAll, size: 'small' })}
						>
							{@render arrowsInSimpleIcon({ size: iconSize })}
						</button>
					{/if}
					{#if showControl('copy')}
						<button
							type="button"
							class={classes.toolbarButton({ size })}
							aria-label={clipboard.copied ? t.jsonCopied : t.jsonCopy}
							onclick={copyJson}
							{@attach tooltip({
								content: clipboard.copied ? t.jsonCopied : t.jsonCopy,
								size: 'small'
							})}
						>
							{#if clipboard.copied}
								{@render checkIcon({ size: iconSize })}
							{:else}
								{@render copySimpleIcon({ size: iconSize })}
							{/if}
						</button>
					{/if}
					{#if shownIssues.length > 0 && modeState.value === 'tree'}
						<button type="button" class={classes.issueCount({ size })} onclick={focusFirstIssue}>
							{@render warningCircleIcon({ size: iconSize })}
							{t.jsonIssueCount(shownIssues.length)}
						</button>
					{/if}
				</div>
				{#if showControl('mode')}
					<SegmentedControl
						size="small"
						label={t.jsonViewLabel}
						items={modeItems}
						value={modeState.value}
						onValueChange={(next) => {
							modeState.value = next;
							onModeChange?.(next);
						}}
					/>
				{/if}
			</div>
		{/if}

		{#if modeState.value === 'tree'}
			<div class={classes.tree({ size })} data-slot="json-editor-tree" {@attach detachControls}>
				<JsonEditorNode
					path={[]}
					value={editor.value as JsonValue | undefined}
					schema={editor.rootSchema}
					depth={0}
					rowId="{id}-root"
					name={typeof rest.label === 'string' ? rest.label : t.jsonViewRaw}
					kind="root"
				/>
			</div>
		{:else}
			<div {@attach detachControls}>
				<JsonEditorRaw />
			</div>
		{/if}
		<span class="sr-only" {...announcer.regionAttrs}>{announcer.message}</span>
	</div>
</Field>

{#if menu}
	<PopupMenu
		bind:open={menuOpen}
		ref={menu.anchor}
		trigger={false}
		tool={false}
		position="bottom-start"
		offset={4}
		fitTrigger={false}
		menu={{ items: menuItems, density: 'compact', focusOnMount: true }}
		onAfterClose={() => {
			const anchor = menu?.anchor;
			if (anchor?.isConnected) anchor.focus();
			menu = null;
		}}
	/>
{/if}
