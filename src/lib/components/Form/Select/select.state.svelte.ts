import { bind } from '$lib/utils/state.svelte.js';
import { useListNavigation } from '$lib/utils/useListNavigation.svelte.js';
import { alignItemWithTrigger, SELECT_ALIGN_MARGIN } from './select.align.js';
import type { SelectItems, SelectOption, SelectOptionGroup } from './select.props.js';

/** Inline-start edge of an element's first text: what lines up between the value and an option. */
const textStart = (element: Element, rtl: boolean) => {
	const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
		acceptNode: (node) =>
			node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
	});
	const text = walker.nextNode();
	let rect = element.getBoundingClientRect();
	const range = text ? document.createRange() : null;
	// Ranges without layout (jsdom) fall back to the element's own box.
	if (range?.getBoundingClientRect) {
		range.selectNodeContents(text!);
		rect = range.getBoundingClientRect();
	}
	return rtl ? rect.right : rect.left;
};

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
	/** Open over the trigger with the selected option on the value, like a native select. */
	alignItemWithTrigger: boolean;
	/** The trigger's value text, the option list root, and its scrolling viewport. */
	valueEl: HTMLElement | null;
	listEl: HTMLElement | null;
	viewportEl: HTMLElement | null;
}

export class SelectState {
	declare id: string;
	declare items: SelectItems | undefined;
	declare value: string | null | undefined;
	declare disabled: boolean | undefined;
	declare triggerEl: HTMLElement | null;
	declare alignItemWithTrigger: boolean;
	declare valueEl: HTMLElement | null;
	declare listEl: HTMLElement | null;
	declare viewportEl: HTMLElement | null;
	isOpen = $state(false);
	// Where this open session placed the panel. Measured once: later repositioning (the panel
	// resizing, the list scrolling) must not re-scroll the list under the pointer. A new viewport
	// size measures again.
	#alignment: {
		position: { x: number; y: number; minWidth: number };
		viewport: { width: number; height: number };
	} | null = null;

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
		// An item-aligned panel sits on the trigger, so the page holds still while it is open, as
		// it does for a native select. Popover's body lock does not reach an app's own scroll
		// container (a scrolling <main>), so wheel and touch scrolling are blocked outside the
		// panel. The panel is portaled under the locked body: its own scrolling cannot chain out.
		$effect(() => {
			if (!this.isOpen || !this.alignItemWithTrigger) return;
			const block = (event: Event) => {
				const panel = document.getElementById(this.listboxId)?.closest('dialog');
				if (event.target instanceof Node && panel?.contains(event.target)) return;
				event.preventDefault();
			};
			const listen = { capture: true, passive: false };
			window.addEventListener('wheel', block, listen);
			window.addEventListener('touchmove', block, listen);
			return () => {
				window.removeEventListener('wheel', block, listen);
				window.removeEventListener('touchmove', block, listen);
			};
		});
	}

	// Index-based ids — sanitizing values into ids can collide ('a.b' and 'a_b' both → 'a_b').
	optionId = (value: string) =>
		`${this.id}-option-${this.flatOptions.findIndex((o) => o.value === value)}`;

	/**
	 * Popover `positionPanel`: places the open panel over the trigger with the selected option (or
	 * the first one) on the value, and sizes and scrolls the list to keep it there. `null` falls
	 * back to the dropdown below the trigger.
	 */
	positionPanel = ({ panel, reference }: { panel: HTMLElement; reference: unknown }) => {
		const { valueEl, listEl, viewportEl } = this;
		if (!this.alignItemWithTrigger || !valueEl || !listEl || !viewportEl) return null;
		if (!(reference instanceof HTMLElement)) return null;
		const anchor =
			this.selectedOption && !this.selectedOption.disabled
				? this.selectedOption
				: this.flatOptions.find((option) => !option.disabled);
		const item = anchor && document.getElementById(this.optionId(anchor.value));
		if (!item) return null;

		const width = window.innerWidth;
		const height = window.innerHeight;
		const kept = this.#alignment;
		if (kept && kept.viewport.width === width && kept.viewport.height === height)
			return kept.position;

		// Measure the list at its natural height and scroll, the panel at least as wide as the
		// trigger (what `fitTrigger` applies on the next render).
		const trigger = reference.getBoundingClientRect();
		const surface = panel.firstElementChild as HTMLElement | null;
		if (surface) surface.style.minWidth = `${trigger.width}px`;
		listEl.style.maxHeight = 'none';
		viewportEl.scrollTop = 0;
		const rtl = getComputedStyle(reference).direction === 'rtl';
		const panelRect = panel.getBoundingClientRect();
		const listRect = listEl.getBoundingClientRect();
		const itemRect = item.getBoundingClientRect();

		const placed = alignItemWithTrigger({
			viewport: { width, height },
			trigger: { top: trigger.top, height: trigger.height },
			valueTextStart: textStart(valueEl, rtl),
			panel: {
				left: panelRect.left,
				right: panelRect.right,
				top: panelRect.top,
				width: panelRect.width,
				height: panelRect.height
			},
			list: { top: listRect.top, height: listRect.height },
			item: { top: itemRect.top, height: itemRect.height, textStart: textStart(item, rtl) },
			rtl
		});
		listEl.style.maxHeight = `${placed.listHeight}px`;
		viewportEl.scrollTop = placed.scrollTop;

		// Overhang the trigger on both sides. The text alignment fixes the start edge, so the panel
		// widens at the end to match the start's overhang (at least 4px) and stays in the viewport.
		const end = rtl ? placed.x + panelRect.width : placed.x;
		const startOverhang = rtl ? end - trigger.right : trigger.left - placed.x;
		const overhang = Math.max(4, startOverhang);
		const minWidth = Math.max(
			panelRect.width,
			rtl ? end - (trigger.left - overhang) : trigger.right + overhang - placed.x
		);
		const x = Math.min(
			Math.max(rtl ? end - minWidth : placed.x, SELECT_ALIGN_MARGIN),
			width - SELECT_ALIGN_MARGIN - minWidth
		);
		// Popover applies `minWidth` through a style binding, which skips the write when the value
		// matches the previous session's: put back what the measurement overwrote.
		if (surface) surface.style.minWidth = `${minWidth}px`;
		const position = { x: Math.max(SELECT_ALIGN_MARGIN, x), y: placed.y, minWidth };
		this.#alignment = { position, viewport: { width, height } };
		return position;
	};

	open = () => {
		if (this.disabled) return;
		this.#alignment = null;
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
			// rAF stalls in hidden tabs). An item-aligned panel has already scrolled its list.
			setTimeout(() => {
				if (this.#alignment) return;
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
