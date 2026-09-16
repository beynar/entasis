import { bind } from '$lib/utils/state.svelte.js';
import { useListNavigation } from '$lib/utils/useListNavigation.svelte.js';
import type { SelectItems, SelectOption, SelectOptionGroup } from './select.props.js';

const isGroup = (entry: SelectOption | SelectOptionGroup): entry is SelectOptionGroup =>
	Array.isArray((entry as SelectOptionGroup).items);

interface SelectStateOptions {
	id: string;
	/** Items list — reactive getter bridged from the component props. */
	items: SelectItems | undefined;
	/** Selected value — reactive getter/setter bridged to the field state. */
	value: string | null | undefined;
	disabled: boolean | undefined;
	/** The trigger button — reactive getter bridged to `field.node`, refocused after selection. */
	triggerEl: HTMLElement | null;
}

export class SelectState {
	declare id: string;
	declare items: SelectItems | undefined;
	declare value: string | null | undefined;
	declare disabled: boolean | undefined;
	declare triggerEl: HTMLElement | null;
	isOpen = $state(false);

	listboxId = $derived.by(() => `${this.id}-listbox`);

	/** All options, flattened across groups — render order. */
	flatOptions: SelectOption[] = $derived.by(() =>
		(this.items ?? []).flatMap((entry) => (isGroup(entry) ? entry.items : [entry]))
	);

	/** Options as rendered: consecutive bare options bundled into one unlabeled group. */
	renderGroups = $derived.by(() => {
		const groups: { label?: string; items: SelectOption[] }[] = [];
		let bare: { label?: string; items: SelectOption[] } | null = null;
		for (const entry of this.items ?? []) {
			if (isGroup(entry)) {
				bare = null;
				groups.push({ label: entry.label, items: entry.items });
			} else {
				if (!bare) {
					bare = { items: [] };
					groups.push(bare);
				}
				bare.items.push(entry);
			}
		}
		return groups;
	});

	selectedOption = $derived(this.flatOptions.find((option) => option.value === this.value) ?? null);

	/** Keyboard navigation: value-driven virtual focus — DOM focus stays on the trigger. */
	nav = useListNavigation({
		values: () => this.flatOptions.filter((option) => !option.disabled).map((o) => o.value),
		optionId: (value) => this.optionId(value),
		onSelect: (value) => this.selectValue(value),
		typeahead: (value) => this.flatOptions.find((option) => option.value === value)?.label ?? value
	});

	constructor(options: SelectStateOptions) {
		bind(this, options);
	}

	// Index-based ids — sanitizing values into ids can collide ('a.b' and 'a_b' both → 'a_b').
	optionId = (value: string) =>
		`${this.id}-option-${this.flatOptions.findIndex((o) => o.value === value)}`;

	open = () => {
		if (this.disabled) return;
		this.isOpen = true;
		// Safari/Firefox-macOS don't focus buttons on click — grab focus explicitly so the
		// blur-to-close and trigger keydown paths work for mouse users everywhere.
		this.triggerEl?.focus();
		// Anchor the highlight on the selected option (native <select> behavior), falling back
		// to the first option so a previous session's highlight doesn't leak into this one.
		const selected = this.selectedOption;
		if (selected && !selected.disabled) {
			this.nav.setHighlighted(selected.value);
			// The dropdown mounts on the next flush — defer the scroll (setTimeout, not rAF:
			// rAF stalls in hidden tabs).
			setTimeout(() => {
				document
					.getElementById(this.optionId(selected.value))
					?.scrollIntoView({ block: 'nearest' });
			}, 0);
		} else {
			this.nav.first();
		}
	};

	close = () => {
		this.isOpen = false;
	};

	toggle = () => {
		if (this.isOpen) this.close();
		else this.open();
	};

	selectValue = (value: string) => {
		const option = this.flatOptions.find((o) => o.value === value);
		if (!option || option.disabled) return;
		this.value = option.value;
		this.close();
		this.triggerEl?.focus();
	};

	/** Keydown handler for the trigger — closed: open on ArrowUp/Down/Enter/Space; open:
	 *  Escape/Tab close, Enter/Space select, arrows/Home/End delegate to the navigation hook. */
	onTriggerKeydown = (event: KeyboardEvent) => {
		if (this.disabled) return;
		if (!this.isOpen) {
			if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
				event.preventDefault();
				this.open();
			}
			return;
		}
		switch (event.key) {
			case 'Escape':
				event.preventDefault();
				this.close();
				return;
			case 'Enter':
			case ' ':
				event.preventDefault();
				// Suppress key-repeat: a held Enter would select, close, then reopen through the
				// closed-state branch on the next repeat tick.
				if (event.repeat) return;
				if (this.nav.highlighted !== undefined) this.selectValue(this.nav.highlighted);
				return;
			case 'Tab':
				// No preventDefault — let focus move on naturally.
				this.close();
				return;
			default:
				this.nav.onKeydown(event);
		}
	};
}
