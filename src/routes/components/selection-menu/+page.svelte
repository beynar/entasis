<script lang="ts">
	import { chatCircleIcon } from '$lib/components/Icons/chatCircle.js';
	import { highlighterIcon } from '$lib/components/Icons/highlighter.js';
	import { textBIcon } from '$lib/components/Icons/textB.js';
	import { textItalicIcon } from '$lib/components/Icons/textItalic.js';
	import SelectionMenu from '$lib/components/SelectionMenu/SelectionMenu.svelte';
	import type { SelectionMenuSelection } from '$lib/components/SelectionMenu/index.js';
	import type { ToggleMenuItem } from '$lib/components/ToggleMenu/index.js';
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
		}
	]);

	function createFormattingItems(): ToggleMenuItem[] {
		return [
			{
				type: 'group',
				label: 'Inline formatting',
				items: [
					{ value: 'bold', prefix: textBIcon, label: 'Bold' },
					{ value: 'italic', prefix: textItalicIcon, label: 'Italic' }
				]
			},
			{ type: 'toggle', prefix: highlighterIcon, label: 'Highlight selection' },
			{ type: 'toggle', prefix: chatCircleIcon, label: 'Comment on selection' }
		];
	}

	let parentItems = $state<ToggleMenuItem[]>(createFormattingItems());
	let selectorItems = $state<ToggleMenuItem[]>(createFormattingItems());
	let currentSelection = $state<SelectionMenuSelection | null>(null);
</script>

<DocPage
	title="Selection Menu"
	subtitle="Floating controls anchored to a text selection inside a known container."
	component="SelectionMenu"
	features={[
		'Parent target by default',
		'Selector or element target override',
		'Virtual Range positioning through Popover',
		'Selection preserved during toolbar interaction',
		'ToggleMenu props passed through directly'
	]}
>
	<ComponentCard
		{controls}
		description="Place the menu beside selectable content and it watches the shared parent automatically."
		code={`<div>
\t<article contenteditable="true">
\t\tSelect any passage in this editor.
\t</article>

\t<SelectionMenu bind:items label="Selection tools" size="${controls.value.size}" variant="${controls.value.variant}" color="${controls.value.color}" />
</div>`}
	>
		<div class="mx-auto grid w-full max-w-2xl gap-4">
			<div
				contenteditable="true"
				role="textbox"
				aria-multiline="true"
				aria-label="Editable release note"
				class="border-neutral-muted focus:ring-primary min-h-48 rounded-md border p-6 text-left outline-none focus:ring-1"
			>
				<h3 class="mb-3 text-lg font-semibold">Release note</h3>
				<p class="text-neutral/70 leading-7">
					Selection-aware controls should follow the passage being edited without coupling the
					toolbar to a particular editor engine. The editor remains responsible for formatting state
					and commands.
				</p>
			</div>

			<SelectionMenu
				bind:items={parentItems}
				label="Selection tools"
				size={controls.value.size}
				variant={controls.value.variant}
				color={controls.value.color}
				onSelect={(selection) => (currentSelection = selection)}
			/>
			<p class="text-neutral/70 min-h-5 text-center text-xs" aria-live="polite">
				{currentSelection ? `${currentSelection.text.length} characters selected` : ''}
			</p>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Selector Target"
			description="Use a unique selector when the menu cannot sit directly beside its selection container."
			class="!min-h-fit"
			code={`<article id="selection-source">...</article>

<SelectionMenu
\ttarget="#selection-source"
\tbind:items
\tlabel="Quote tools"
/>`}
		>
			<div class="mx-auto grid w-full max-w-xl gap-4">
				<blockquote
					id="selection-menu-quote"
					class="border-primary text-neutral/70 border-l-2 py-2 pl-5 text-left leading-7"
				>
					A selection menu knows where a range is. The editor still knows what that range means.
				</blockquote>

				<SelectionMenu
					target="#selection-menu-quote"
					bind:items={selectorItems}
					label="Quote tools"
				/>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
