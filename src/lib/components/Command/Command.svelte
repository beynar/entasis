<script lang="ts" generics="Value extends string = string">
	import { commandDialogTheme } from './command.dialog.theme.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import type { CommandItem, CommandProps } from './command.props.js';
	import { useCommandTheme } from './command.theme.js';
	import { CommandState } from './command.state.svelte.js';
	import Dialog from '../Dialog/Dialog.svelte';
	import Slot from '../Slot/Slot.svelte';
	import MenuOption from '../MenuOption/MenuOption.svelte';
	import { magnifyingGlassIcon } from '../Icons/magnifyingGlass.js';
	import { useDefaultColor } from '../Theme/theme.state.svelte.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		items,
		dialog = false,
		open = $bindable(),
		defaultOpen = false,
		onOpenChange,
		shortcut = false,
		title,
		closeOnSelect = true,
		value = $bindable(),
		defaultValue = null,
		onValueChange,
		search = $bindable(),
		defaultSearch = '',
		onSearchChange,
		placeholder,
		showInput = true,
		shouldFilter = true,
		filter,
		onSelect,
		onHighlightChange,
		empty,
		item,
		trigger,
		footer,
		size = 'normal',
		density = 'normal',
		class: className,
		theme,
		...attachments
	}: CommandProps<Value> = $props();
	const openState = createBindableValue(
		() => open,
		(next) => {
			open = next;
		},
		() => defaultOpen
	);
	const valueState = createBindableValue<Value | null>(
		() => value,
		(next) => {
			value = next;
		},
		() => defaultValue
	);
	const searchState = createBindableValue(
		() => search,
		(next) => {
			search = next;
		},
		() => defaultSearch
	);

	const id = $props.id();

	const command = new CommandState<Value>({
		id,
		get items() {
			return items;
		},
		get dialog() {
			return dialog;
		},
		get isOpen() {
			return openState.value;
		},
		set isOpen(value) {
			openState.value = value;
		},
		get value() {
			return valueState.value;
		},
		set value(nextValue) {
			valueState.value = nextValue;
		},
		get search() {
			return searchState.value;
		},
		set search(nextSearch) {
			searchState.value = nextSearch;
		},
		get shortcut() {
			return shortcut;
		},
		get closeOnSelect() {
			return closeOnSelect;
		},
		get shouldFilter() {
			return shouldFilter;
		},
		get filter() {
			return filter;
		},
		get onOpenChange() {
			return onOpenChange;
		},
		get onValueChange() {
			return onValueChange;
		},
		get onSearchChange() {
			return onSearchChange;
		},
		get onSelect() {
			return onSelect;
		},
		get onHighlightChange() {
			return onHighlightChange;
		}
	});

	const classes = $derived(useCommandTheme(theme));
	const resolvedColor = $derived(useDefaultColor());
	const t = $derived(useI18n());
	const resolvedTitle = $derived(title ?? t.commandPalette);
	const resolvedPlaceholder = $derived(placeholder ?? t.commandPlaceholder);
	const resolvedEmpty = $derived(empty ?? t.noResults);

	const slotPayload = { open: () => command.open(), close: () => command.close() };

	// Dialog mode: the content mounts on each open and the Dialog does no focus management of
	// its own, so grab focus for the search input once the mount settles ({@attach} on the input).
	// setTimeout, not requestAnimationFrame — rAF never fires in hidden/backgrounded tabs.
	/**
	 * The full command state machine, for externally driven palettes (`bind:this`):
	 * `commandState.move(delta)`, `commandState.selectHighlighted()`, `commandState.highlighted`,
	 * `commandState.open()`, ...
	 */
	export const commandState: CommandState<Value> = command;
</script>

{#snippet optionRow(it: CommandItem<Value>)}
	{@const highlighted = command.highlighted === it.value}
	{#snippet shortcut()}
		<span class={classes.shortcut({ size, highlighted })}>{it.shortcut}</span>
	{/snippet}
	{#snippet customRow()}
		{@render item?.(it)}
	{/snippet}
	<MenuOption
		as={it.href ? 'a' : 'div'}
		role="option"
		href={it.href}
		color={resolvedColor}
		{size}
		{density}
		title={item ? undefined : it.label}
		prefix={item ? undefined : it.icon}
		suffix={item || !it.shortcut ? undefined : shortcut}
		children={item ? customRow : undefined}
		{highlighted}
		selected={highlighted}
		disabled={!!it.disabled}
		class={classes.item({ size, highlighted, class: it.class })}
		onclick={() => command.select(it)}
		attrs={{
			id: command.optionId(it.value),
			'data-value': it.value,
			tabindex: -1,
			onpointermove: () => {
				if (!it.disabled) command.setHighlighted(it.value);
			}
		}}
	/>
{/snippet}

{#snippet commandBox()}
	<div class={classes.root({ size, className })} {...attachments}>
		{#if showInput}
			<div class={classes.inputWrapper({ size })}>
				<div class={classes.inputGroup({ size })}>
					{@render magnifyingGlassIcon({ class: classes.inputIcon({ size }) })}
					<input
						data-autofocus={dialog ? '' : undefined}
						class={classes.input({ size })}
						type="text"
						role="combobox"
						aria-autocomplete="list"
						aria-expanded="true"
						aria-controls={command.listId}
						aria-activedescendant={command.highlighted !== undefined
							? command.optionId(command.highlighted)
							: undefined}
						autocomplete="off"
						autocorrect="off"
						autocapitalize="off"
						spellcheck="false"
						placeholder={resolvedPlaceholder}
						value={searchState.value}
						oninput={(event) => command.setSearch(event.currentTarget.value)}
						onkeydown={command.onKeydown}
					/>
				</div>
			</div>
		{/if}

		<!-- The empty/no-results message lives OUTSIDE the listbox: a listbox may only own
		     `option`/`group` nodes (aria-required-children), and a status message is not either of
		     those. `role="status"` also announces it politely when filtering empties the list.
		     It takes the list's `flex-1` so the box keeps the exact same layout as a filled list. -->
		{#if command.isEmpty}
			<Slot
				render={resolvedEmpty}
				class="flex-1 {classes.empty({ size })}"
				attrs={{ role: 'status' }}
				payload={slotPayload}
			/>
		{/if}

		<!-- Kept mounted while empty (hidden) so `aria-controls`/`aria-activedescendant` ids on the
		     combobox input always resolve; `hidden` keeps it out of the flex layout. -->
		<div
			id={command.listId}
			role="listbox"
			aria-label={t.commands}
			class={classes.list({ size })}
			hidden={command.isEmpty}
		>
			{#if !command.isEmpty}
				{#each command.visibleGroups as group, groupIndex (groupIndex)}
					{#if groupIndex > 0}
						<!-- Decorative divider between groups: `role="presentation"` keeps it out of the
						     listbox's required-children set (the groups already convey the structure). -->
						<div role="presentation" class={classes.separator({ size })}></div>
					{/if}
					<div
						role="group"
						aria-label={group.heading}
						class={classes.group({ size, class: group.class })}
					>
						{#if group.heading}
							<div aria-hidden="true" class={classes.groupHeading({ size })}>
								{group.heading}
							</div>
						{/if}
						{#each group.items as it (it.value)}
							{@render optionRow(it)}
						{/each}
					</div>
				{/each}
			{/if}
		</div>

		<Slot render={footer} class={classes.footer({ size })} payload={slotPayload} />
	</div>
{/snippet}

{#snippet dialogTrigger()}
	<Slot
		as="span"
		render={trigger}
		payload={slotPayload}
		class={classes.trigger()}
		{@attach command.trigger}
	/>
{/snippet}

{#if dialog}
	<Dialog
		bind:open={() => openState.value, command.setOpen}
		type="modal"
		title={resolvedTitle}
		theme={commandDialogTheme}
		trigger={trigger ? dialogTrigger : undefined}
	>
		{@render commandBox()}
	</Dialog>
{:else}
	{@render commandBox()}
{/if}
