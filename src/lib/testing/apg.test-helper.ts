// Checks a rendered composite widget against its WAI-ARIA Authoring Practices (APG) keyboard
// pattern in a real engine (`*.browser.test.ts`, Chromium and WebKit): roles, required states,
// names and id references first, then the pattern's keys pressed for real through `userEvent`
// (Arrow keys by orientation, horizontal ones swapped right to left, Home/End, typeahead, Escape,
// Enter/Space). After every key, focus must not fall to the body or land inside `aria-hidden` or
// `inert` content. Every problem is collected and thrown as one error.
//
// Internal test utility: `*.test-helper.*` files are left out of the published package.
import { userEvent } from 'vitest/browser';

export type ApgPattern =
	'menu' | 'menubar' | 'tabs' | 'tree' | 'listbox' | 'toolbar' | 'radiogroup';

/** A check that `options.skip` can turn off, for a deviation a test documents. */
export type ApgRule =
	| 'references'
	| 'names'
	| 'states'
	| 'tab-stop'
	| 'arrows'
	| 'home-end'
	| 'typeahead'
	| 'expand'
	| 'submenu'
	| 'activation'
	| 'escape';

export interface CheckPatternOptions {
	/** Reading direction; defaults to the computed direction of the widget. */
	dir?: 'ltr' | 'rtl';
	/** Whether printable characters must move focus; defaults per pattern. */
	typeahead?: boolean;
	/** Whether arrows must wrap past the ends (`true`), must stop (`false`), or either (unset). */
	wraps?: boolean;
	/** Rules not to check, each for a reason the test states. */
	skip?: ApgRule[];
	/** Check only these rules (focus loss is always checked), for a test that pins one gap. */
	only?: ApgRule[];
	/** The element that opens a popup pattern (menu, listbox) and gets focus back on Escape. */
	trigger?: Element;
}

interface PatternSpec {
	container: string[];
	items: string[] | 'focusable';
	orientation: 'horizontal' | 'vertical' | 'both';
	typeahead: boolean;
	homeEnd: boolean;
	wraps?: boolean;
	/** Popups close on Escape and give focus back to their trigger. */
	popup: boolean;
	/** The container must have an accessible name (ARIA: name required). */
	containerName: boolean;
	/** A roving composite has exactly one tab stop. */
	oneTabStop: boolean;
}

const SPECS: Record<ApgPattern, PatternSpec> = {
	menu: {
		container: ['menu'],
		items: ['menuitem', 'menuitemcheckbox', 'menuitemradio'],
		orientation: 'vertical',
		typeahead: true,
		homeEnd: true,
		popup: true,
		containerName: false,
		// Menu items are reached with arrows only; Tab leaves (closes) the menu.
		oneTabStop: false
	},
	menubar: {
		container: ['menubar'],
		items: ['menuitem', 'menuitemcheckbox', 'menuitemradio'],
		orientation: 'horizontal',
		typeahead: true,
		homeEnd: true,
		popup: false,
		containerName: false,
		oneTabStop: true
	},
	tabs: {
		container: ['tablist'],
		items: ['tab'],
		orientation: 'horizontal',
		typeahead: false,
		homeEnd: true,
		popup: false,
		containerName: false,
		oneTabStop: true
	},
	tree: {
		container: ['tree'],
		items: ['treeitem'],
		orientation: 'vertical',
		typeahead: true,
		homeEnd: true,
		popup: false,
		containerName: true,
		oneTabStop: true
	},
	listbox: {
		container: ['listbox'],
		items: ['option'],
		orientation: 'vertical',
		typeahead: true,
		homeEnd: true,
		popup: false,
		containerName: true,
		oneTabStop: true
	},
	toolbar: {
		container: ['toolbar'],
		items: 'focusable',
		orientation: 'horizontal',
		typeahead: false,
		homeEnd: true,
		popup: false,
		containerName: false,
		oneTabStop: true
	},
	radiogroup: {
		container: ['radiogroup'],
		items: ['radio'],
		orientation: 'both',
		typeahead: false,
		homeEnd: false,
		wraps: true,
		popup: false,
		containerName: true,
		oneTabStop: true
	}
};

const FOCUSABLE =
	'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable]:not([contenteditable="false"])';
const REFERENCE_ATTRIBUTES = [
	'aria-controls',
	'aria-labelledby',
	'aria-describedby',
	'aria-activedescendant',
	'aria-owns'
];
const NAMED_BY_CONTENT = new Set([
	'button',
	'link',
	'menuitem',
	'menuitemcheckbox',
	'menuitemradio',
	'option',
	'radio',
	'tab',
	'treeitem',
	'checkbox',
	'switch'
]);

// Thrown to stop pressing keys once later keys would mean nothing (focus left the widget).
const STOP = Symbol('apg-stop');

// ---------------------------------------------------------------------------------------------
// Reading the DOM the way assistive technology does, across open shadow roots.

/** The parent in the flat tree: the parent element, or a shadow root's host. */
const parentOf = (el: Element): Element | null =>
	el.parentElement ?? ((el.parentNode as ShadowRoot | null)?.host || null);

function closestDeep(el: Element, selector: string): Element | null {
	for (let node: Element | null = el; node; node = parentOf(node)) {
		if (node.matches(selector)) return node;
	}
	return null;
}

/** Every element under `scope` (itself excluded), descending into open shadow roots. */
function allDeep(scope: Element | ShadowRoot): Element[] {
	const found: Element[] = [];
	for (const el of scope.querySelectorAll('*')) {
		found.push(el);
		if (el.shadowRoot) found.push(...allDeep(el.shadowRoot));
	}
	return found;
}

/** The focused element, looking through open shadow roots. */
function activeElement(): Element | null {
	let active = document.activeElement;
	while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
	return active;
}

function roleOf(el: Element): string {
	const explicit = el.getAttribute('role')?.trim().split(/\s+/)[0];
	if (explicit) return explicit;
	const tag = el.tagName.toLowerCase();
	if (tag === 'button') return 'button';
	if (tag === 'a' && el.hasAttribute('href')) return 'link';
	if (tag === 'input') {
		const type = (el as HTMLInputElement).type;
		if (type === 'radio' || type === 'checkbox') return type;
		if (['button', 'submit', 'reset'].includes(type)) return 'button';
		return 'textbox';
	}
	if (tag === 'textarea') return 'textbox';
	return '';
}

function byId(el: Element, id: string): Element | null {
	const root = el.getRootNode();
	return root instanceof Document || root instanceof ShadowRoot ? root.getElementById(id) : null;
}

const idsOf = (el: Element, attribute: string) =>
	(el.getAttribute(attribute) ?? '').split(/\s+/).filter(Boolean);

const textOf = (el: Element) => (el.textContent ?? '').replace(/\s+/g, ' ').trim();

/** An approximation of the accessible name: aria-labelledby, aria-label, labels, content, title. */
function accessibleName(el: Element): string {
	const labelledBy = idsOf(el, 'aria-labelledby')
		.map((id) => byId(el, id))
		.filter((label): label is Element => !!label)
		.map(textOf)
		.join(' ')
		.trim();
	if (labelledBy) return labelledBy;
	const label = el.getAttribute('aria-label')?.trim();
	if (label) return label;
	if ('labels' in el) {
		const labels = [...((el as HTMLInputElement).labels ?? [])].map(textOf).join(' ').trim();
		if (labels) return labels;
	}
	if (NAMED_BY_CONTENT.has(roleOf(el))) {
		const content = textOf(el);
		if (content) return content;
	}
	return el.getAttribute('title')?.trim() ?? '';
}

/** Hidden from people: not rendered, `hidden`, `inert`, or `display: none` somewhere above. */
function isGone(el: Element): boolean {
	if (!el.isConnected || closestDeep(el, '[hidden], [inert]')) return true;
	const check = (el as HTMLElement).checkVisibility;
	if (typeof check === 'function') return !check.call(el);
	for (let node: Element | null = el; node; node = parentOf(node)) {
		if (getComputedStyle(node).display === 'none') return true;
	}
	return false;
}

/** Focus must never land here: a screen reader cannot follow it. */
const isUnreachable = (el: Element) => !!closestDeep(el, '[aria-hidden="true"], [inert]');

const isDisabled = (el: Element) =>
	el.getAttribute('aria-disabled') === 'true' || el.matches(':disabled');

function withRole(scope: Element, roles: string[]): Element[] {
	return allDeep(scope).filter((el) => roles.includes(roleOf(el)) && !isGone(el));
}

function isTabStop(el: Element): boolean {
	if (!el.matches(FOCUSABLE) || isGone(el) || el.matches(':disabled')) return false;
	if ((el as HTMLElement).tabIndex < 0) return false;
	if (el instanceof HTMLInputElement) {
		if (el.type === 'hidden') return false;
		// Native radios sharing a name are one stop: the checked one, else the first.
		if (el.type === 'radio' && el.name) {
			const group = [...el.ownerDocument.querySelectorAll<HTMLInputElement>('input[type=radio]')]
				.filter((radio) => radio.name === el.name && radio.form === el.form && !isGone(radio))
				.filter((radio) => !radio.disabled);
			return el === (group.find((radio) => radio.checked) ?? group[0]);
		}
	}
	return true;
}

const tabStops = (scope: Element) => [scope, ...allDeep(scope)].filter(isTabStop);

/** A short selector naming an element in a problem, like `button#tab-2[role=tab] "Two"`. */
function describe(el: Element | null | undefined): string {
	if (!el) return 'nothing';
	if (el === document.body) return 'body';
	const role = el.getAttribute('role');
	const selector = `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${role ? `[role=${role}]` : ''}`;
	const name = NAMED_BY_CONTENT.has(roleOf(el)) || !el.children.length ? accessibleName(el) : '';
	return name ? `${selector} "${name.slice(0, 24)}"` : selector;
}

/** Two frames, then a macrotask: what a component schedules after a key (focus moves, renders). */
async function settle() {
	await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
	await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
	await new Promise<void>((resolve) => setTimeout(resolve));
}

/** Polls `condition` for up to `timeout` ms; true when it held. */
async function waitFor(condition: () => boolean, timeout = 1000) {
	const end = performance.now() + timeout;
	while (performance.now() < end) {
		if (condition()) return true;
		await settle();
	}
	return condition();
}

/** `userEvent.keyboard` syntax for one key: a printable character as is, a named key in braces. */
const keySequence = (key: string) => (key.length === 1 ? key : `{${key}}`);

// ---------------------------------------------------------------------------------------------
// The check.

class Checker {
	readonly problems = new Set<string>();
	readonly watched = new Set<Element>();
	readonly skip: Set<ApgRule>;
	readonly only: Set<ApgRule> | undefined;

	constructor(skip: ApgRule[] = [], only?: ApgRule[]) {
		this.skip = new Set(skip);
		this.only = only && new Set(only);
	}

	/** Whether a rule is checked. */
	active(rule: ApgRule) {
		return !this.skip.has(rule) && (!this.only || this.only.has(rule));
	}

	problem(rule: ApgRule, el: Element | null | undefined, message: string) {
		if (this.active(rule)) this.problems.add(`[${rule}] ${describe(el)}: ${message}`);
	}

	checkReferences() {
		if (!this.active('references')) return;
		for (const scope of this.watched) {
			if (!scope.isConnected) continue;
			for (const el of [scope, ...allDeep(scope)]) {
				if (isGone(el)) continue;
				for (const attribute of REFERENCE_ATTRIBUTES) {
					// A closed popup's trigger may name a popup that is not rendered (axe allows it).
					if (attribute === 'aria-controls' && el.getAttribute('aria-expanded') === 'false')
						continue;
					for (const id of idsOf(el, attribute)) {
						if (!byId(el, id))
							this.problem(
								'references',
								el,
								`${attribute} points at "${id}", which is not in the page.`
							);
					}
				}
			}
		}
	}

	/** Presses one key for real, waits, then checks focus was neither lost nor hidden. */
	async press(key: string) {
		const before = activeElement();
		await userEvent.keyboard(keySequence(key));
		await settle();
		// No grace period: a popup that closes with an exit transition hands focus back as the close
		// begins, so focus on <body> two frames after a key is lost, not on its way somewhere.
		const after = activeElement();
		if (!after || after === document.body || after === document.documentElement) {
			this.problems.add(`[focus] ${describe(before)}: after ${key}, focus fell to the body.`);
			throw STOP;
		}
		if (isUnreachable(after)) {
			this.problems.add(
				`[focus] ${describe(after)}: after ${key}, focus is inside aria-hidden or inert content.`
			);
		}
		const descendant = after.getAttribute('aria-activedescendant');
		const target = descendant ? byId(after, descendant) : null;
		if (target && isUnreachable(target)) {
			this.problems.add(
				`[focus] ${describe(target)}: after ${key}, the active descendant is aria-hidden or inert.`
			);
		}
		this.checkReferences();
	}

	async focus(el: Element) {
		(el as HTMLElement).focus();
		await settle();
		const active = activeElement();
		if (!active || active === document.body) {
			this.problems.add(`[focus] ${describe(el)}: cannot take focus.`);
			throw STOP;
		}
	}
}

interface Composite {
	container: Element;
	items: () => Element[];
	noun: string;
}

/**
 * What tells one item from another across re-renders. Element identity first; a virtualized or
 * re-rendered row (a tree row whose element or id changes with focus) is the same item when its
 * role, level, position and name are.
 */
const signature = (el: Element) =>
	[
		roleOf(el),
		el.getAttribute('aria-level'),
		el.getAttribute('aria-posinset'),
		el.getAttribute('data-item-path'),
		accessibleName(el)
	].join('|');
const sameItem = (a: Element | null | undefined, b: Element | null | undefined) =>
	!!a && !!b && (a === b || signature(a) === signature(b));

function itemsOf(container: Element, spec: PatternSpec): () => Element[] {
	if (spec.items === 'focusable') {
		return () =>
			allDeep(container).filter(
				(el) =>
					el.matches(FOCUSABLE) &&
					!isGone(el) &&
					!isUnreachable(el) &&
					!(el instanceof HTMLInputElement && el.type === 'hidden') &&
					// Skip nested parts of an item (a focusable inside a focusable).
					!allDeep(container).some(
						(other) => other !== el && other.contains(el) && other.matches(FOCUSABLE)
					)
			);
	}
	const roles = spec.items;
	return () => withRole(container, roles);
}

/** The item that has focus: the focused one, one holding focus, or the active descendant. */
function currentItem(composite: Composite): Element | undefined {
	const active = activeElement();
	if (!active) return undefined;
	const items = composite.items();
	const descendant = active.getAttribute('aria-activedescendant');
	if (descendant) return items.find((item) => item.id === descendant);
	return (
		items.find((item) => item === active) ?? items.filter((item) => item.contains(active)).at(-1)
	);
}

/** Items from `start` stepping one way, up to and including the first enabled one. */
function scan(items: Element[], start: number, step: number) {
	const passed: Element[] = [];
	for (let index = start; index >= 0 && index < items.length; index += step) {
		passed.push(items[index]);
		if (!isDisabled(items[index])) return { passed, reached: true };
	}
	return { passed, reached: false };
}

function arrowsFor(orientation: 'horizontal' | 'vertical', rtl: boolean) {
	if (orientation === 'vertical') return { next: 'ArrowDown', previous: 'ArrowUp' };
	return rtl
		? { next: 'ArrowLeft', previous: 'ArrowRight' }
		: { next: 'ArrowRight', previous: 'ArrowLeft' };
}

/**
 * The axis the arrows move along: `aria-orientation`, else the role's default. A radio group moves
 * on both axes unless it declares one (a horizontal segmented control answers Left and Right).
 */
function orientationOf(container: Element, spec: PatternSpec): 'horizontal' | 'vertical' | 'both' {
	const aria = container.getAttribute('aria-orientation');
	return aria === 'horizontal' || aria === 'vertical' ? aria : spec.orientation;
}

/** A text field that keeps focus while a popup list is driven through aria-activedescendant. */
const isEditable = (el: Element | null) =>
	el instanceof HTMLTextAreaElement ||
	(el instanceof HTMLInputElement &&
		!/^(button|checkbox|radio|submit|reset|range|color|file|image|hidden)$/.test(el.type)) ||
	(el as HTMLElement | null)?.isContentEditable === true;

async function expectMove(
	checker: Checker,
	composite: Composite,
	rule: ApgRule,
	key: string,
	allowed: Element[],
	expected: string
) {
	const from = currentItem(composite);
	await checker.press(key);
	const to = currentItem(composite);
	if (to && allowed.some((item) => sameItem(item, to))) return to;
	const outcome = !to
		? `focus went to ${describe(activeElement())}, outside the ${composite.noun}s`
		: sameItem(to, from)
			? 'focus stayed'
			: `focus went to ${describe(to)}`;
	checker.problem(
		rule,
		from ?? composite.container,
		`${key} should move focus to ${expected} (${describe(allowed[0])}), but ${outcome}.`
	);
	if (!to) throw STOP;
	return to;
}

async function expectStep(
	checker: Checker,
	composite: Composite,
	key: string,
	forward: boolean,
	wraps: boolean | undefined
) {
	const items = composite.items();
	const from = currentItem(composite);
	const index = from ? items.findIndex((item) => sameItem(item, from)) : -1;
	const step = forward ? 1 : -1;
	let allowed: Element[];
	let expected = `the ${forward ? 'next' : 'previous'} ${composite.noun}`;
	if (index < 0) {
		allowed = scan(items, 0, 1).passed;
		expected = `the first ${composite.noun}`;
	} else {
		const ahead = scan(items, index + step, step);
		if (ahead.reached) allowed = ahead.passed;
		else {
			const around = scan(items, forward ? 0 : items.length - 1, step).passed;
			const stays = [items[index], ...ahead.passed];
			allowed = wraps === true ? around : wraps === false ? stays : [...stays, ...around];
			expected +=
				wraps === true ? ', wrapping around' : wraps === false ? ', staying at the end' : '';
		}
	}
	return expectMove(checker, composite, 'arrows', key, allowed, expected);
}

/** Arrows forward and back, Home/End, then past both ends. */
async function checkNavigation(
	checker: Checker,
	composite: Composite,
	moves: {
		next: string[];
		previous: string[];
		homeEnd: boolean;
		wraps?: boolean;
		onMove?: (key: string, item: Element) => void;
	}
) {
	if (composite.items().length < 2) return;
	const step = async (key: string, forward: boolean) => {
		if (!checker.active('arrows')) return;
		const to = await expectStep(checker, composite, key, forward, moves.wraps);
		moves.onMove?.(key, to);
	};
	const jump = async (key: 'Home' | 'End') => {
		if (!checker.active('home-end')) return;
		const all = composite.items();
		const allowed = key === 'Home' ? scan(all, 0, 1).passed : scan(all, all.length - 1, -1).passed;
		const to = await expectMove(
			checker,
			composite,
			'home-end',
			key,
			allowed,
			`the ${key === 'Home' ? 'first' : 'last'} ${composite.noun}`
		);
		moves.onMove?.(key, to);
	};
	if (moves.homeEnd) await jump('Home');
	for (const key of moves.next) await step(key, true);
	for (const key of moves.previous) await step(key, false);
	if (moves.homeEnd && checker.active('home-end')) await jump('End');
	else {
		// Walk to the last item one step at a time.
		for (let guard = composite.items().length; guard > 0; guard -= 1) {
			const all = composite.items();
			const current = currentItem(composite);
			const index = all.findIndex((item) => sameItem(item, current));
			if (!scan(all, index + 1, 1).reached) break;
			await step(moves.next[0], true);
		}
	}
	// Past the end, then back.
	await step(moves.next[0], true);
	await step(moves.previous[0], false);
}

/** Types the first letter of an item's name that no other item starts with. */
async function checkTypeahead(checker: Checker, composite: Composite) {
	if (!checker.active('typeahead')) return;
	const current = currentItem(composite);
	const enabled = composite.items().filter((item) => !isDisabled(item));
	const initial = (el: Element) => accessibleName(el).charAt(0).toLowerCase();
	const target = enabled.find((item) => {
		const letter = initial(item);
		return (
			/[a-z]/.test(letter) &&
			!sameItem(item, current) &&
			enabled.filter((other) => initial(other) === letter).length === 1
		);
	});
	if (!target) return;
	await expectMove(
		checker,
		composite,
		'typeahead',
		initial(target),
		[target],
		'the item it starts'
	);
}

/** Checks one tab stop per roving composite. */
function checkTabStop(checker: Checker, container: Element, noun: string) {
	const stops = tabStops(container);
	if (stops.length > 1) {
		checker.problem(
			'tab-stop',
			container,
			`has ${stops.length} tab stops (${stops.map(describe).join(', ')}); a composite has one, and arrows move within it.`
		);
	} else if (!stops.length) {
		// An active-descendant composite may be driven from an outer element (a combobox).
		const owner = allDeep(document.body).find((el) =>
			idsOf(el, 'aria-controls').includes(container.id)
		);
		if (!owner || !isTabStop(owner))
			checker.problem(
				'tab-stop',
				container,
				`has no tab stop; one ${noun} takes Tab, or the container with aria-activedescendant.`
			);
	}
}

function checkStatic(
	checker: Checker,
	pattern: ApgPattern,
	spec: PatternSpec,
	composite: Composite
) {
	const { container } = composite;
	const items = composite.items();
	if (!items.length) checker.problem('states', container, `has no ${composite.noun}s.`);
	if (spec.containerName && !accessibleName(container))
		checker.problem('names', container, 'has no accessible name (aria-label or aria-labelledby).');

	for (const item of items) {
		if (spec.items !== 'focusable' && !accessibleName(item))
			checker.problem('names', item, 'has no accessible name.');
	}

	if (pattern === 'tabs') {
		const selected = items.filter((tab) => tab.getAttribute('aria-selected') === 'true');
		if (selected.length !== 1)
			checker.problem(
				'states',
				container,
				`has ${selected.length} tabs with aria-selected="true", not 1.`
			);
		for (const tab of items) {
			if (!['true', 'false'].includes(tab.getAttribute('aria-selected') ?? ''))
				checker.problem('states', tab, 'has no aria-selected="true|false".');
			const panels = idsOf(tab, 'aria-controls').map((id) => byId(tab, id));
			// A tab whose panel is not rendered may omit aria-controls; one that names it, names a tabpanel.
			for (const panel of panels) {
				if (panel && roleOf(panel) !== 'tabpanel')
					checker.problem('states', tab, `aria-controls names ${describe(panel)}, not a tabpanel.`);
			}
			if (tab.getAttribute('aria-selected') === 'true' && !panels.some(Boolean))
				checker.problem('states', tab, 'is selected but aria-controls names no rendered tabpanel.');
		}
	}

	if (pattern === 'radiogroup') {
		for (const radio of items) {
			const checked =
				radio instanceof HTMLInputElement && !radio.hasAttribute('aria-checked')
					? String(radio.checked)
					: radio.getAttribute('aria-checked');
			if (!['true', 'false'].includes(checked ?? ''))
				checker.problem('states', radio, 'has no aria-checked="true|false".');
		}
	}

	if (pattern === 'listbox') {
		const multi = container.getAttribute('aria-multiselectable') === 'true';
		const selected = items.filter((option) => option.getAttribute('aria-selected') === 'true');
		if (!multi && selected.length > 1)
			checker.problem(
				'states',
				container,
				`is single-select but ${selected.length} options are selected.`
			);
	}

	if (pattern === 'tree') {
		for (const [index, item] of items.entries()) {
			const level = Number(item.getAttribute('aria-level') ?? 0);
			const nextLevel = Number(items[index + 1]?.getAttribute('aria-level') ?? 0);
			const hasChildren =
				!!item.querySelector('[role="group"]') || (level > 0 && nextLevel > level);
			if (hasChildren && !item.hasAttribute('aria-expanded'))
				checker.problem('states', item, 'has children but no aria-expanded.');
		}
	}

	if (pattern === 'menu' || pattern === 'menubar') {
		for (const item of items) {
			const role = roleOf(item);
			if (
				(role === 'menuitemcheckbox' || role === 'menuitemradio') &&
				!item.hasAttribute('aria-checked')
			)
				checker.problem('states', item, `is a ${role} without aria-checked.`);
			if (item.hasAttribute('aria-haspopup') && !item.hasAttribute('aria-expanded'))
				checker.problem('states', item, 'opens a submenu but has no aria-expanded.');
		}
	}
}

/** The popup with one of `roles` an element's `aria-controls` names. */
function popupOf(el: Element, roles: string[]) {
	return idsOf(el, 'aria-controls')
		.map((id) => byId(el, id))
		.find((popup): popup is Element => !!popup && roles.includes(roleOf(popup)) && !isGone(popup));
}

/** All shown containers of `roles` in the page, including portalled ones. */
const shown = (roles: string[]) => withRole(document.body, roles);

function findContainer(root: Element, roles: string[]): Element | undefined {
	if (roles.includes(roleOf(root)) && !isGone(root)) return root;
	const inside = withRole(root, roles)[0];
	if (inside) return inside;
	for (const el of [root, ...allDeep(root)]) {
		const popup = popupOf(el, roles);
		if (popup) return popup;
	}
	return undefined;
}

function findTrigger(root: Element, container: Element | undefined, options: CheckPatternOptions) {
	if (options.trigger) return options.trigger;
	if (container?.id) {
		const controller = allDeep(document.body).find(
			(el) => !container.contains(el) && idsOf(el, 'aria-controls').includes(container.id)
		);
		if (controller) return controller;
	}
	return [root, ...allDeep(root)].find((el) => el.hasAttribute('aria-haspopup') && !isGone(el));
}

/**
 * Checks a rendered widget against its APG keyboard pattern and throws one error listing every
 * problem, or returns when there are none. `root` is the widget or an element around it; for a
 * popup pattern it may be the trigger (a closed popup is opened with Enter first). It leaves focus
 * inside the widget (or on a popup's trigger, after Escape) and may change its value: run it on a
 * harness, not on shared state.
 */
export async function checkPattern(
	root: Element,
	pattern: ApgPattern,
	options: CheckPatternOptions = {}
): Promise<void> {
	const spec = SPECS[pattern];
	const checker = new Checker(options.skip, options.only);
	try {
		await run(checker, root, pattern, spec, options);
	} catch (error) {
		if (error !== STOP) throw error;
	}
	if (!checker.problems.size) return;
	const problems = [...checker.problems];
	throw new Error(
		`checkPattern(${pattern}${options.dir ? `, ${options.dir}` : ''}) found ${problems.length} problem${problems.length === 1 ? '' : 's'}:\n${problems.map((problem) => `- ${problem}`).join('\n')}`
	);
}

async function run(
	checker: Checker,
	root: Element,
	pattern: ApgPattern,
	spec: PatternSpec,
	options: CheckPatternOptions
) {
	let container = findContainer(root, spec.container);
	const trigger =
		spec.popup || pattern === 'listbox' ? findTrigger(root, container, options) : undefined;
	if (!container && trigger) {
		// A closed popup: open it from its trigger, as a keyboard user would (ArrowDown on a
		// combobox, Enter on a menu button).
		await checker.focus(trigger);
		await checker.press(roleOf(trigger) === 'combobox' ? 'ArrowDown' : 'Enter');
		await waitFor(
			() => !!findContainer(root, spec.container) || !!popupOf(trigger!, spec.container)
		);
		container =
			findContainer(root, spec.container) ??
			popupOf(trigger, spec.container) ??
			shown(spec.container)[0];
	}
	if (!container) {
		checker.problems.add(`[states] ${describe(root)}: no ${spec.container.join('/')} found.`);
		return;
	}
	checker.watched.add(root);
	checker.watched.add(container);
	checker.checkReferences();

	const composite: Composite = {
		container,
		items: itemsOf(container, spec),
		noun: spec.items === 'focusable' ? 'control' : spec.items[0]
	};
	const rtl = (options.dir ?? getComputedStyle(container).direction) === 'rtl';
	// A listbox opened from a trigger is a popup: Escape closes it and focus stays on the trigger.
	const popup =
		spec.popup || (!!trigger && !container.contains(trigger) && !root.contains(container));
	// In an editable combobox, printable keys type and Home/End move the caret, not the list.
	const editable = isEditable(activeElement());
	if (editable) {
		checker.skip.add('typeahead');
		checker.skip.add('home-end');
	}
	checkStatic(checker, pattern, spec, composite);
	if (spec.oneTabStop && checker.active('tab-stop'))
		checkTabStop(checker, container, composite.noun);

	// Enter the widget: keep focus already inside (a menu opened from the keyboard), else its tab stop.
	if (!currentItem(composite)) {
		const stop =
			tabStops(container)[0] ?? composite.items().find((item) => !isDisabled(item)) ?? container;
		await checker.focus(stop);
	}

	const orientation = orientationOf(container, spec);
	const arrows =
		orientation === 'both'
			? {
					next: ['ArrowDown', rtl ? 'ArrowLeft' : 'ArrowRight'],
					previous: ['ArrowUp', rtl ? 'ArrowRight' : 'ArrowLeft']
				}
			: (() => {
					const pair = arrowsFor(orientation, rtl);
					return { next: [pair.next], previous: [pair.previous] };
				})();
	const wraps = options.wraps ?? spec.wraps;

	// What a move also changes: a radio checks the radio it moves to.
	const onMove =
		pattern === 'radiogroup'
			? (key: string, item: Element) => {
					const fresh = composite.items().find((radio) => sameItem(radio, item)) ?? item;
					const checked =
						fresh instanceof HTMLInputElement && !fresh.hasAttribute('aria-checked')
							? fresh.checked
							: fresh.getAttribute('aria-checked') === 'true';
					if (!checked)
						checker.problem('activation', fresh, `${key} moved focus here but did not check it.`);
				}
			: undefined;

	await checkNavigation(checker, composite, {
		next: arrows.next,
		previous: arrows.previous,
		homeEnd: spec.homeEnd,
		wraps,
		onMove
	});

	if (options.typeahead ?? spec.typeahead) await checkTypeahead(checker, composite);

	if (pattern === 'tree' && checker.active('expand'))
		await checkTreeExpansion(checker, composite, rtl);
	if (pattern === 'menu' && checker.active('submenu')) await checkSubmenu(checker, composite, rtl);
	if (pattern === 'menubar' && checker.active('submenu'))
		await checkMenubarPopup(checker, composite);
	if (pattern === 'tabs' && checker.active('activation'))
		await checkTabActivation(checker, composite);

	if (popup && checker.active('escape')) {
		await checker.press('Escape');
		const closed = await waitFor(() => isGone(container!) || !container!.isConnected);
		if (!closed) checker.problem('escape', container, 'Escape should close the popup.');
		if (trigger && closed && !sameItem(activeElement() ?? undefined, trigger))
			checker.problem(
				'escape',
				trigger,
				`Escape should give focus back to the trigger, but focus is on ${describe(activeElement())}.`
			);
		// Enter on the trigger reopens, Enter on an item activates it and closes the menu.
		if (trigger && closed && pattern === 'menu' && checker.active('activation')) {
			await checker.press('Enter');
			const reopened = await waitFor(
				() => !!popupOf(trigger!, spec.container) || shown(spec.container).length > 0
			);
			if (!reopened) {
				checker.problem('activation', trigger, 'Enter on the menu button should open the menu.');
				return;
			}
			const menu = popupOf(trigger, spec.container) ?? shown(spec.container)[0];
			const reopenedComposite = { ...composite, container: menu, items: itemsOf(menu, spec) };
			if (!(await waitFor(() => !!currentItem(reopenedComposite))))
				checker.problem('activation', menu, 'Enter on the menu button should focus a menu item.');
			else {
				const item = currentItem(reopenedComposite)!;
				if (!item.hasAttribute('aria-haspopup') && !isDisabled(item)) {
					await checker.press('Enter');
					const activated = await waitFor(() => isGone(menu) || !menu.isConnected);
					if (!activated)
						checker.problem(
							'activation',
							item,
							'Enter on a menu item should activate it and close the menu.'
						);
					else if (!sameItem(activeElement() ?? undefined, trigger))
						checker.problem(
							'activation',
							trigger,
							`after activating an item, focus should return to the trigger, not ${describe(activeElement())}.`
						);
				}
			}
		}
	}
}

/** Tree: the expand key opens a closed parent then enters its first child; collapse goes back. */
async function checkTreeExpansion(checker: Checker, composite: Composite, rtl: boolean) {
	const expand = rtl ? 'ArrowLeft' : 'ArrowRight';
	const collapse = rtl ? 'ArrowRight' : 'ArrowLeft';
	const find = (target: Element) => composite.items().find((item) => sameItem(item, target));
	// Walk from the first item to a parent.
	await checker.press('Home');
	let parent: Element | undefined;
	for (let guard = composite.items().length; guard > 0; guard -= 1) {
		const current = currentItem(composite);
		if (current?.hasAttribute('aria-expanded')) {
			parent = current;
			break;
		}
		await checker.press('ArrowDown');
	}
	if (!parent) return;
	const parentKey = parent;
	if (parent.getAttribute('aria-expanded') === 'true') {
		await checker.press(collapse);
		if (find(parentKey)?.getAttribute('aria-expanded') !== 'false')
			checker.problem('expand', parent, `${collapse} on an open parent should collapse it.`);
	}
	await checker.press(expand);
	const opened = find(parentKey);
	if (opened?.getAttribute('aria-expanded') !== 'true') {
		checker.problem('expand', parent, `${expand} on a closed parent should expand it.`);
		return;
	}
	if (!sameItem(currentItem(composite), opened))
		checker.problem('expand', opened, `${expand} on a closed parent should keep focus on it.`);
	await checker.press(expand);
	const child = currentItem(composite);
	const items = composite.items();
	const parentIndex = items.findIndex((item) => sameItem(item, find(parentKey)));
	if (!sameItem(child, items[parentIndex + 1]))
		checker.problem(
			'expand',
			opened,
			`${expand} on an open parent should move to its first child.`
		);
	await checker.press(collapse);
	if (!sameItem(currentItem(composite), find(parentKey)))
		checker.problem('expand', child, `${collapse} on a child should move focus to its parent.`);
	await checker.press(collapse);
	if (find(parentKey)?.getAttribute('aria-expanded') !== 'false')
		checker.problem('expand', parent, `${collapse} on an open parent should collapse it.`);
}

/** Menu: the open key enters a submenu (swapped in RTL), the close key returns to its item. */
async function checkSubmenu(checker: Checker, composite: Composite, rtl: boolean) {
	const open = rtl ? 'ArrowLeft' : 'ArrowRight';
	const close = rtl ? 'ArrowRight' : 'ArrowLeft';
	const parent = composite
		.items()
		.find((item) => item.hasAttribute('aria-haspopup') && !isDisabled(item));
	if (!parent) return;
	// Arrow to the parent item.
	for (let guard = composite.items().length; guard > 0; guard -= 1) {
		if (sameItem(currentItem(composite), parent)) break;
		await checker.press('ArrowDown');
	}
	if (!sameItem(currentItem(composite), parent)) return;
	const before = shown(['menu']).length;
	await checker.press(open);
	const opened = await waitFor(() => shown(['menu']).length > before);
	if (!opened) {
		checker.problem('submenu', parent, `${open} should open its submenu.`);
		return;
	}
	const submenu = popupOf(parent, ['menu']) ?? shown(['menu']).at(-1)!;
	checker.watched.add(submenu);
	const active = activeElement();
	if (!active || !submenu.contains(active))
		checker.problem(
			'submenu',
			submenu,
			`${open} should move focus into the submenu, not ${describe(active)}.`
		);
	// An open submenu's row may leave aria-expanded off (Menu does on Apple platforms, where
	// VoiceOver reads the state again when focus enters the submenu); "false" is wrong.
	const fresh = composite.items().find((item) => sameItem(item, parent)) ?? parent;
	if (fresh.getAttribute('aria-expanded') === 'false')
		checker.problem('submenu', fresh, 'has an open submenu but aria-expanded="false".');
	await checker.press(close);
	const closed = await waitFor(() => isGone(submenu) || !submenu.isConnected);
	if (!closed) checker.problem('submenu', submenu, `${close} should close the submenu.`);
	if (!sameItem(currentItem(composite), parent))
		checker.problem('submenu', parent, `${close} should give focus back to the submenu's item.`);
}

/** Menubar: Enter on an item with a popup opens its menu and focuses it; Escape returns. */
async function checkMenubarPopup(checker: Checker, composite: Composite) {
	const item = currentItem(composite);
	if (!item?.hasAttribute('aria-haspopup')) return;
	const before = shown(['menu']).length;
	await checker.press('Enter');
	if (!(await waitFor(() => shown(['menu']).length > before))) {
		checker.problem('submenu', item, 'Enter should open its menu.');
		return;
	}
	const menu = popupOf(item, ['menu']) ?? shown(['menu']).at(-1)!;
	checker.watched.add(menu);
	await waitFor(() => !!activeElement() && menu.contains(activeElement()));
	if (!menu.contains(activeElement()))
		checker.problem(
			'submenu',
			menu,
			`Enter should move focus into the menu, not ${describe(activeElement())}.`
		);
	await checker.press('Escape');
	if (!(await waitFor(() => isGone(menu) || !menu.isConnected)))
		checker.problem('escape', menu, 'Escape should close the menu.');
	if (!sameItem(currentItem(composite), item))
		checker.problem('escape', item, 'Escape should give focus back to the menubar item.');
}

/** Tabs: Enter (and Space) select the focused tab, whether or not arrows already did. */
async function checkTabActivation(checker: Checker, composite: Composite) {
	const items = composite.items();
	const current = currentItem(composite);
	const index = items.findIndex((item) => sameItem(item, current));
	const target = items.find((item, i) => i !== index && !isDisabled(item));
	if (!target) return;
	await checker.focus(target);
	for (const key of ['Enter', ' ']) {
		await checker.press(key);
		const fresh = composite.items().find((item) => sameItem(item, target));
		if (fresh?.getAttribute('aria-selected') !== 'true')
			checker.problem(
				'activation',
				target,
				`${key === ' ' ? 'Space' : key} should select the focused tab.`
			);
	}
}
