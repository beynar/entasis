<script lang="ts" generics="Value extends string = string">
	import { commandDialogTheme } from './command.dialog.theme.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { untrack } from 'svelte';
	import type { CommandItem, CommandProps } from './command.props.js';
	import { useCommandTheme } from './command.theme.js';
	import { CommandState } from './command.state.svelte.js';
	import Dialog from '../Dialog/Dialog.svelte';
	import Slot from '../Slot/Slot.svelte';
	import MenuOption from '../MenuOption/MenuOption.svelte';
	import { magnifyingGlassIcon } from '../Icons/magnifyingGlass.js';

	let {
		items,
		dialog = false,
		open = $bindable(),
		defaultOpen = false,
		onOpenChange,
		shortcut = false,
		title = 'Command palette',
		closeOnSelect = true,
		value = $bindable(),
		defaultValue = '',
		onValueChange,
		placeholder = 'Type a command or search...',
		showInput = true,
		shouldFilter = true,
		filter,
		onSelect,
		onHighlightChange,
		empty = 'No results found.',
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
	const valueState = createBindableValue(
		() => value,
		(next) => {
			value = next;
		},
		() => defaultValue
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
		get onSelect() {
			return onSelect;
		},
		get onHighlightChange() {
			return onHighlightChange;
		}
	});

	const classes = $derived(useCommandTheme(theme));

	const slotPayload = { open: () => command.open(), close: () => command.close() };

	// Dialog mode: the content mounts on each open and the Dialog does no focus management of
	// its own, so grab focus for the search input once the mount settles ({@attach} on the input).
	// setTimeout, not requestAnimationFrame — rAF never fires in hidden/backgrounded tabs.
	const focusInput = (node: HTMLElement) => {
		return untrack(() => {
			if (!dialog) return;
			const timeout = setTimeout(() => (node as HTMLInputElement).focus(), 0);
			return () => clearTimeout(timeout);
		});
	};

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
		{size}
		{density}
		title={item ? undefined : it.label}
		prefix={item ? undefined : it.icon}
		suffix={item || !it.shortcut ? undefined : shortcut}
		children={item ? customRow : undefined}
		{highlighted}
		selected={highlighted}
		disabled={!!it.disabled}
		class={it.class}
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
						{@attach focusInput}
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
						{placeholder}
						value={valueState.value}
						oninput={(event) => command.setValue(event.currentTarget.value)}
						onkeydown={command.onKeydown}
					/>
				</div>
			</div>
		{/if}

		<div id={command.listId} role="listbox" aria-label="Commands" class={classes.list({ size })}>
			{#if command.isEmpty}
				<Slot render={empty} class={classes.empty({ size })} payload={slotPayload} />
			{:else}
				{#each command.visibleGroups as group, groupIndex (groupIndex)}
					{#if groupIndex > 0}
						<div role="separator" class={classes.separator({ size })}></div>
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
		{title}
		theme={commandDialogTheme}
		trigger={trigger ? dialogTrigger : undefined}
	>
		{@render commandBox()}
	</Dialog>
{:else}
	{@render commandBox()}
{/if}
