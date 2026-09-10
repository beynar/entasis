<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import type { Sizes } from '$lib/types/theme.js';
	import Button from '../Button/Button.svelte';
	import { xIcon } from '../Icons/x.js';
	import type { MenuItem } from '../Menu/index.js';
	import SelectionMenu from '../SelectionMenu/SelectionMenu.svelte';
	import ToggleMenu from '../ToggleMenu/ToggleMenu.svelte';
	import type {
		ToggleMenuCustomPayload,
		ToggleMenuGroupButtons,
		ToggleMenuGroupItem,
		ToggleMenuItem,
		ToggleMenuRadioGroupButtons,
		ToggleMenuRadioGroupItem
	} from '../ToggleMenu/index.js';
	import type { ToggleMenuThemeProps } from '../ToggleMenu/toggleMenu.theme.js';
	import { tooltip } from '../Tooltip/tooltip.svelte.js';
	import {
		getRichTextInputBlockControls,
		getRichTextInputInlineControls,
		getRichTextInputListControls,
		type RichTextInputToolbarButtonConfig
	} from './formatting-toolbar-controls.js';
	import type { RichTextInputFormat } from './richTextInput.props.js';
	import RichTextInputLinkForm from './RichTextInputLinkForm.svelte';
	import type { RichTextInputThemeProps } from './richTextInput.theme.js';
	import { useRichTextInputTheme } from './richTextInput.theme.js';
	import type {
		AIComposerSelectionBlockType,
		AIComposerSelectionFormat,
		AIComposerSelectionFormats,
		AIComposerSelectionListType
	} from './composer/selection-formatting.js';

	type Props = {
		size: Sizes;
		theme?: RichTextInputThemeProps;
		formats: AIComposerSelectionFormats;
		blockType: AIComposerSelectionBlockType;
		listType: AIComposerSelectionListType | null;
		linkUrl: string;
		availableFormats: RichTextInputFormat[];
		showDismiss?: boolean;
		onFormat: (format: AIComposerSelectionFormat) => void;
		onList: (listType: AIComposerSelectionListType) => void;
		onBlock: (blockType: AIComposerSelectionBlockType) => void;
		onLink: (url: string | null) => void;
		onLinkEditingChange?: (isEditing: boolean) => void;
		onDismiss?: () => void;
		selectionTarget?: HTMLElement | null;
		selectionEnabled?: boolean;
		selectionPopoverClass?: string;
		onSelectionClose?: () => void;
		onSelectionFocusReturn?: () => void;
		class?: string;
	};

	let {
		size,
		theme,
		formats,
		blockType,
		listType,
		linkUrl,
		availableFormats,
		showDismiss = false,
		onFormat,
		onList,
		onBlock,
		onLink,
		onLinkEditingChange,
		onDismiss,
		selectionTarget,
		selectionEnabled = false,
		selectionPopoverClass,
		onSelectionClose,
		onSelectionFocusReturn,
		class: className
	}: Props = $props();

	let isEditingLink = $state(false);
	let selectionMenu = $state<{ focusFirst: () => void } | null>(null);
	let menuItems = $state<ToggleMenuItem[]>([]);

	const classes = $derived(useRichTextInputTheme(theme));
	const hasActiveLink = $derived(linkUrl.trim().length > 0);
	const blockControls = $derived.by(() =>
		hasAny(['heading1', 'heading2', 'heading3', 'quote'])
			? getRichTextInputBlockControls({ hasFormat, blockType, onBlock })
			: []
	);
	const inlineControls = $derived.by(() =>
		getRichTextInputInlineControls({
			hasFormat,
			formats,
			hasActiveLink,
			onFormat,
			onLink: beginLinkEdit
		})
	);
	const listControls = $derived.by(() =>
		getRichTextInputListControls({ hasFormat, listType, onList })
	);
	const menuTheme = $derived({
		override: true,
		root: { base: classes.formattingToolbar({ size, className }) },
		rail: { base: classes.formattingToolbarRail({ size }) }
	} satisfies ToggleMenuThemeProps);
	const preserveSelection: Attachment<HTMLElement> = (node) => {
		const onPointerDown = (event: PointerEvent) => {
			if (event.button === 0) event.preventDefault();
		};
		node.addEventListener('pointerdown', onPointerDown);
		return () => node.removeEventListener('pointerdown', onPointerDown);
	};
	const restoreSelectionFocusOnEscape: Attachment<HTMLElement> = (node) => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') queueMicrotask(() => onSelectionFocusReturn?.());
		};
		node.addEventListener('keydown', onKeyDown);
		return () => node.removeEventListener('keydown', onKeyDown);
	};

	$effect(() => {
		menuItems = buildMenuItems();
	});

	function hasFormat(format: RichTextInputFormat) {
		return availableFormats.includes(format);
	}

	function hasAny(candidateFormats: RichTextInputFormat[]) {
		return candidateFormats.some((format) => hasFormat(format));
	}

	function beginLinkEdit() {
		isEditingLink = true;
		onLinkEditingChange?.(true);
	}

	function closeLinkEdit() {
		isEditingLink = false;
		onLinkEditingChange?.(false);
	}

	function applyLink(url: string) {
		closeLinkEdit();
		onLink(url);
	}

	function removeLink() {
		closeLinkEdit();
		onLink(null);
	}

	function dismiss() {
		closeLinkEdit();
		onDismiss?.();
		onSelectionFocusReturn?.();
	}

	export function focusFirst() {
		selectionMenu?.focusFirst();
	}

	function buildMenuItems() {
		const items: ToggleMenuItem[] = [];
		pushRadioGroup(items, 'Block style', blockControls, blockType);
		pushGroup(items, 'Inline formatting', inlineControls);
		pushGroup(items, 'Lists', listControls);

		if (showDismiss) {
			items.push({
				type: 'custom',
				children: dismissControl,
				overflowItems: getDismissOverflowItems
			});
		}

		return items;
	}

	function pushGroup(
		items: ToggleMenuItem[],
		ariaLabel: string,
		controls: RichTextInputToolbarButtonConfig[]
	) {
		if (controls.length === 0) return;
		const buttons: ToggleMenuGroupButtons = {};
		const value: Record<string, boolean> = {};

		for (const control of controls) {
			buttons[control.id] = {
				prefix: control.icon,
				ariaLabel: control.shortcut ? `${control.label} (${control.shortcut})` : control.label,
				onValueChange: control.onSelect
			};
			value[control.id] = control.active;
		}

		items.push({
			type: 'group',
			ariaLabel,
			items: buttons,
			value,
			joined: false
		} satisfies ToggleMenuGroupItem);
	}

	function pushRadioGroup(
		items: ToggleMenuItem[],
		ariaLabel: string,
		controls: RichTextInputToolbarButtonConfig[],
		value: string
	) {
		if (controls.length === 0) return;
		const buttons: ToggleMenuRadioGroupButtons = {};

		for (const control of controls) {
			buttons[control.id] = {
				prefix: control.icon,
				ariaLabel: control.label
			};
		}

		items.push({
			type: 'radio-group',
			ariaLabel,
			items: buttons,
			value: controls.some((control) => control.id === value) ? value : undefined,
			onValueChange: (nextValue) =>
				controls.find((control) => control.id === nextValue)?.onSelect(),
			joined: false
		} satisfies ToggleMenuRadioGroupItem);
	}

	function getDismissOverflowItems(): MenuItem[] {
		return [
			{
				type: 'option',
				title: 'Dismiss formatting toolbar',
				prefix: xIcon,
				onclick: dismiss
			}
		];
	}
</script>

{#snippet dismissControl({ reference, size, color, variant, disabled }: ToggleMenuCustomPayload)}
	<Button
		type="button"
		label="Dismiss formatting toolbar"
		prefix={xIcon}
		color={color ?? 'neutral'}
		variant={variant ?? 'ghost'}
		{size}
		{disabled}
		squared
		onclick={dismiss}
		{@attach reference}
		{@attach tooltip({ content: 'Dismiss formatting toolbar', delay: 350 })}
	/>
{/snippet}

{#snippet linkEditor()}
	<div class={classes.formattingToolbar({ size, class: className })}>
		<RichTextInputLinkForm
			{size}
			{theme}
			{linkUrl}
			onApply={applyLink}
			onRemove={removeLink}
			onCancel={closeLinkEdit}
		/>
	</div>
{/snippet}

{#if selectionTarget !== undefined}
	<SelectionMenu
		bind:this={selectionMenu}
		target={selectionTarget}
		enabled={selectionEnabled}
		bind:value={menuItems}
		ariaLabel="Rich text formatting"
		{size}
		color="neutral"
		variant="ghost"
		theme={menuTheme}
		position="top"
		offset={8}
		directedTransition={false}
		popoverClass={selectionPopoverClass}
		onAfterClose={() => onSelectionClose?.()}
		children={isEditingLink ? linkEditor : undefined}
		{@attach restoreSelectionFocusOnEscape}
	/>
{:else if isEditingLink}
	{@render linkEditor()}
{:else}
	<ToggleMenu
		bind:value={menuItems}
		ariaLabel="Rich text formatting"
		{size}
		color="neutral"
		variant="ghost"
		theme={menuTheme}
		{@attach preserveSelection}
	/>
{/if}
