<script lang="ts">
	import { checkIcon } from '$lib/components/Icons/check.js';
	import ToggleMenu from '$lib/components/ToggleMenu/ToggleMenu.svelte';
	import type { ToggleMenuItem } from '$lib/components/ToggleMenu/index.js';
	import { chatCircleIcon } from '$lib/components/Icons/chatCircle.js';
	import { eyeIcon } from '$lib/components/Icons/eye.js';
	import { highlighterIcon } from '$lib/components/Icons/highlighter.js';
	import { linkIcon } from '$lib/components/Icons/link.js';
	import { listBulletsIcon } from '$lib/components/Icons/listBullets.js';
	import { paletteIcon } from '$lib/components/Icons/palette.js';
	import { quotesIcon } from '$lib/components/Icons/quotes.js';
	import { textAlignCenterIcon } from '$lib/components/Icons/textAlignCenter.js';
	import { textAlignLeftIcon } from '$lib/components/Icons/textAlignLeft.js';
	import { textAlignRightIcon } from '$lib/components/Icons/textAlignRight.js';
	import { textBIcon } from '$lib/components/Icons/textB.js';
	import { textItalicIcon } from '$lib/components/Icons/textItalic.js';
	import { textUnderlineIcon } from '$lib/components/Icons/textUnderline.js';
	import type { MenuItem } from '$lib/components/Menu/index.js';
	import type { Colors } from '$lib/types/theme.js';
	import { colors, sizes } from '$lib/utils/tokens.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const toggleVariants = ['ghost', 'outline'] as const;
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'variant',
			type: 'segmented',
			label: 'Variant',
			value: 'ghost',
			options: toggleVariants
		},
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'neutral',
			options: colors
		},
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false }
	]);

	let textColor = $state<Colors>('neutral');

	function selectTextColor(color: Colors): void {
		textColor = color;
	}

	function getTextColorOptions(): MenuItem[] {
		return [
			{
				type: 'option',
				title: 'Default',
				prefix: foregroundSwatch,
				suffix: textColor === 'neutral' ? checkIcon : undefined,
				onclick: () => selectTextColor('neutral')
			},
			{
				type: 'option',
				title: 'Primary',
				prefix: primarySwatch,
				suffix: textColor === 'primary' ? checkIcon : undefined,
				onclick: () => selectTextColor('primary')
			},
			{
				type: 'option',
				title: 'Danger',
				prefix: dangerSwatch,
				suffix: textColor === 'danger' ? checkIcon : undefined,
				onclick: () => selectTextColor('danger')
			},
			{
				type: 'option',
				title: 'Warning',
				prefix: warningSwatch,
				suffix: textColor === 'warning' ? checkIcon : undefined,
				onclick: () => selectTextColor('warning')
			}
		];
	}

	function createEditorItems(): ToggleMenuItem[] {
		return [
			{
				type: 'toggle',
				prefix: eyeIcon,
				label: 'Preview',
				value: true
			},
			{
				type: 'group',
				label: 'Text formatting',
				value: ['bold'],
				items: [
					{ value: 'bold', prefix: textBIcon, label: 'Bold' },
					{ value: 'italic', prefix: textItalicIcon, label: 'Italic' },
					{ value: 'underline', prefix: textUnderlineIcon, label: 'Underline' }
				]
			},
			{
				type: 'radio-group',
				label: 'Text alignment',
				value: 'left',
				items: [
					{ value: 'left', prefix: textAlignLeftIcon, label: 'Align left' },
					{ value: 'center', prefix: textAlignCenterIcon, label: 'Align center' },
					{ value: 'right', prefix: textAlignRightIcon, label: 'Align right' }
				]
			},
			{ type: 'toggle', prefix: listBulletsIcon, label: 'Bulleted list' },
			{ type: 'toggle', prefix: quotesIcon, label: 'Block quote' },
			{ type: 'toggle', prefix: linkIcon, label: 'Link' },
			{ type: 'toggle', prefix: highlighterIcon, label: 'Highlight' },
			{ type: 'toggle', prefix: chatCircleIcon, label: 'Comments' },
			{
				type: 'menu',
				label: 'Text color',
				prefix: paletteIcon,
				menu: getTextColorOptions
			}
		];
	}

	let editorItems = $state<ToggleMenuItem[]>(createEditorItems());
	let overflowItems = $state<ToggleMenuItem[]>(createEditorItems());
	let textItems = $state<ToggleMenuItem[]>([
		{ type: 'toggle', prefix: eyeIcon, children: 'Preview', value: true },
		{
			type: 'group',
			label: 'Text formatting',
			value: ['bold'],
			items: [
				{ value: 'bold', prefix: textBIcon, children: 'Bold' },
				{ value: 'italic', prefix: textItalicIcon, children: 'Italic' }
			]
		},
		{ type: 'toggle', prefix: chatCircleIcon, children: 'Comments' }
	]);
</script>

{#snippet foregroundSwatch()}
	<span class="bg-neutral ring-neutral-muted size-3 rounded-full ring-1"></span>
{/snippet}

{#snippet primarySwatch()}
	<span class="bg-primary ring-neutral-muted size-3 rounded-full ring-1"></span>
{/snippet}

{#snippet dangerSwatch()}
	<span class="bg-danger ring-neutral-muted size-3 rounded-full ring-1"></span>
{/snippet}

{#snippet warningSwatch()}
	<span class="bg-warning ring-neutral-muted size-3 rounded-full ring-1"></span>
{/snippet}

<DocPage
	title="Toggle Menu"
	subtitle="An accessible toolbar of toggles, radio groups, menu buttons, and custom controls."
	component="ToggleMenu"
	features={[
		{ label: 'One roving keyboard tab stop', test: 'a11y:toggle-menu.roving-tabindex' },
		'Toolbar-specific radio group semantics',
		'Logical groups stay intact during overflow',
		'Persistent checkbox and radio More menu',
		'First-class menu buttons with automatic overflow submenus',
		'Automatic tooltips for icon-only toggles and menus',
		'Custom snippet controls with explicit overflow items',
		'Shared size, color, variant, and disabled props'
	]}
>
	<ComponentCard
		{controls}
		description="Toggles, exclusive choices, independent groups, and menu buttons share one keyboard and overflow model."
		code={`let items = $state([
\t{ type: 'toggle', prefix: eyeIcon, label: 'Preview', value: true },
\t{
\t\ttype: 'group',
\t\tlabel: 'Text formatting',
\t\tvalue: ['bold'],
\t\titems: [
\t\t\t{ value: 'bold', prefix: textBIcon, label: 'Bold' },
\t\t\t{ value: 'italic', prefix: textItalicIcon, label: 'Italic' },
\t\t\t{ value: 'underline', prefix: textUnderlineIcon, label: 'Underline' }
\t\t]
\t},
\t{
\t\ttype: 'radio-group',
\t\tlabel: 'Text alignment',
\t\tvalue: 'left',
\t\titems: [
\t\t\t{ value: 'left', prefix: textAlignLeftIcon, label: 'Align left' },
\t\t\t{ value: 'center', prefix: textAlignCenterIcon, label: 'Align center' },
\t\t\t{ value: 'right', prefix: textAlignRightIcon, label: 'Align right' }
\t\t]
\t},
\t{
\t\ttype: 'menu',
\t\tlabel: 'Text color',
\t\tprefix: paletteIcon,
\t\tmenu: getTextColorOptions
\t}
]);

<ToggleMenu bind:items label="Editor tools" size="${controls.value.size}" variant="${controls.value.variant}" color="${controls.value.color}" disabled={${controls.value.disabled}} />`}
	>
		<ToggleMenu
			bind:items={editorItems}
			label="Editor tools"
			size={controls.value.size}
			variant={controls.value.variant}
			color={controls.value.color}
			disabled={controls.value.disabled}
		/>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Responsive Overflow"
			description="When space runs out, complete logical groups move into More. Checked rows remain interactive and the menu stays open."
			class="!min-h-fit"
			code={`<div class="w-56">
\t<ToggleMenu bind:items label="Compact editor tools" />
</div>`}
		>
			<div class="w-56 max-w-full">
				<ToggleMenu bind:items={overflowItems} label="Compact editor tools" />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Text And Icons"
			description="Visible labels need no tooltip; size and state behavior are otherwise identical."
			class="!min-h-fit"
		>
			<div class="max-w-full">
				<ToggleMenu bind:items={textItems} label="Labeled editor tools" />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Disabled"
			description="Disabling the toolbar preserves every pressed state."
		>
			<ToggleMenu items={createEditorItems()} label="Unavailable editor tools" disabled />
		</ComponentCard>
	{/snippet}
</DocPage>
