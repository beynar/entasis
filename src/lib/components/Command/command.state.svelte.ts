import { createBindableStateClass } from '$lib/utils/state.svelte.js';
import { useListNavigation } from '$lib/utils/useListNavigation.svelte.js';
import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import type { CommandGroup, CommandItem, CommandProps } from './command.props.js';

type CommandOptions<Value extends string = string> = Pick<
	CommandProps<Value>,
	| 'items'
	| 'dialog'
	| 'shortcut'
	| 'closeOnSelect'
	| 'shouldFilter'
	| 'filter'
	| 'onSelect'
	| 'onHighlightChange'
	| 'onOpenChange'
	| 'onValueChange'
	| 'onSearchChange'
> & {
	id: string;
	isOpen: boolean;
	/** Live search query. */
	search: string;
	/** Value of the selected command, or null when nothing has been selected. */
	value: Value | null;
};

// `bind()` copies the option accessors onto the instance; this typed base is what declares
// them on `this`. A generic class cannot call a mixin factory in its `extends` clause, and
// merging an interface into the class declaration would be unsafe declaration merging.
const BoundCommandOptions = createBindableStateClass<object>() as unknown as new <
	Options extends object
>(
	options: Options
) => Options;

export class CommandState<Value extends string = string> extends BoundCommandOptions<
	CommandOptions<Value>
> {
	private triggerElement = $state<HTMLElement | null>(null);

	listId = $derived(`${this.id}-list`);

	/** Groups whose items match the current search query (or all groups when filtering is off). */
	filteredGroups: CommandGroup<Value>[] = $derived.by(() => {
		const query = this.search.trim();
		if (!this.shouldFilter || query === '') return this.items;
		const match = this.filter ?? this.defaultMatch;
		return this.items
			.map((group) => ({ ...group, items: group.items.filter((item) => match(item, query)) }))
			.filter((group) => group.items.length > 0);
	});

	/** Groups that actually render — those with at least one (possibly disabled) item. Filtering
	 *  here keeps separators contiguous (no orphan separator before the first visible group when an
	 *  earlier group is empty, e.g. under `shouldFilter={false}`). */
	visibleGroups = $derived(this.filteredGroups.filter((group) => group.items.length > 0));

	/** Flat list of selectable (non-disabled) items — drives keyboard navigation. */
	navItems = $derived(
		this.visibleGroups.flatMap((group) => group.items).filter((item) => !item.disabled)
	);

	isEmpty = $derived(this.visibleGroups.length === 0);

	/** Keyboard navigation: value-driven virtual focus (see useListNavigation). */
	nav = useListNavigation<Value>({
		values: () => this.navItems.map((item) => item.value),
		optionId: (value) => this.optionId(value),
		onHighlightChange: (value) => this.onHighlightChange?.(value),
		onSelect: (value) => this.selectValue(value)
	});

	/** Value of the currently highlighted (keyboard-active) option. */
	get highlighted() {
		return this.nav.highlighted;
	}

	constructor(options: CommandOptions<Value>) {
		super(options);

		// ⌘/Ctrl + shortcut toggles the palette. Dialog mode only.
		$effect(() => {
			if (!this.dialog || !this.shortcut) return;
			const key = this.shortcut.toLowerCase();
			const onKeydown = (event: KeyboardEvent) => {
				if (event.key.toLowerCase() === key && (event.metaKey || event.ctrlKey)) {
					event.preventDefault();
					untrack(() => this.toggle());
				}
			};
			window.addEventListener('keydown', onKeydown);
			return () => window.removeEventListener('keydown', onKeydown);
		});

		$effect(() => {
			const triggerElement = this.triggerElement;
			const isOpen = this.isOpen;
			untrack(() => triggerElement?.setAttribute('aria-expanded', String(isOpen)));
		});
	}

	trigger: Attachment<HTMLElement> = (node) => {
		return untrack(() => {
			const triggerElement = node.querySelector<HTMLElement>('button, a[href], [tabindex]') ?? node;
			triggerElement.setAttribute('aria-haspopup', 'dialog');
			this.triggerElement = triggerElement;
			return () => {
				triggerElement.removeAttribute('aria-haspopup');
				triggerElement.removeAttribute('aria-expanded');
				this.triggerElement = null;
			};
		});
	};

	optionId = (value: string) => `${this.id}-opt-${value.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

	defaultMatch = (item: CommandItem<Value>, query: string) => {
		const haystack = `${item.label} ${item.keywords?.join(' ') ?? ''} ${item.value}`.toLowerCase();
		return haystack.includes(query.toLowerCase());
	};

	/** Set the highlight without scrolling — used by pointermove on rows. */
	setHighlighted = (value: Value | undefined) => {
		this.nav.setHighlighted(value);
	};

	/** Move the highlight by `delta` selectable items, wrapping around both ends. */
	move = (delta: number) => {
		this.nav.move(delta);
	};

	select = (item: CommandItem<Value>) => {
		if (item.disabled) return;
		// Selection state and activation are distinct: `value` only moves when the
		// selected command actually changes, while `onSelect` reports every activation.
		this.setValue(item.value);
		item.onSelect?.(item.value);
		this.onSelect?.(item.value);
		if (this.dialog && this.closeOnSelect) this.close();
	};

	/** Select an item by value. Link items are clicked so navigation happens natively
	 *  (SvelteKit intercepts the click); their own `onclick` runs `select()`. */
	selectValue = (value: Value) => {
		const item = this.navItems.find((it) => it.value === value);
		if (!item) return;
		if (item.href) document.getElementById(this.optionId(item.value))?.click();
		else this.select(item);
	};

	/** Select the highlighted item. Returns `false` when nothing is highlighted. */
	selectHighlighted = () => {
		if (this.nav.highlighted === undefined) return false;
		this.selectValue(this.nav.highlighted);
		return true;
	};

	setValue = (value: Value | null) => {
		if (value === this.value) return;
		this.value = value;
		this.onValueChange?.(value);
	};

	setSearch = (search: string) => {
		if (search === this.search) return;
		this.search = search;
		this.onSearchChange?.(search);
	};

	open = () => {
		this.setOpen(true);
	};

	close = () => {
		this.setOpen(false);
	};

	toggle = () => {
		this.setOpen(!this.isOpen);
	};

	setOpen = (open: boolean) => {
		if (open === this.isOpen) return;
		this.isOpen = open;
		this.onOpenChange?.(open);
	};

	onKeydown = (event: KeyboardEvent) => {
		this.nav.onKeydown(event);
	};
}
