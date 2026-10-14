import { matchItem } from '$lib/utils/match.js';
import type { MenuFilterMatchItem, MenuFilterOptions, MenuItem } from './menu.props.js';

/** The rows a group holds; a group is transparent to depth, keys and searches. */
const childItems = (item: MenuItem): MenuItem[] => (item.type === 'group' ? item.items : []);

export const getMenuMaxDepth = (items: MenuItem[]): number => {
	let maxDepth = 0;

	for (const menuItem of items) {
		if (menuItem.type === 'group') {
			maxDepth = Math.max(maxDepth, getMenuMaxDepth(childItems(menuItem)));
			continue;
		}
		if (menuItem.type !== 'submenu') continue;
		maxDepth = Math.max(maxDepth, 1 + getMenuMaxDepth(menuItem.menu));
	}

	return maxDepth;
};

export const hasSubmenuItems = (items: MenuItem[]): boolean =>
	items.some(
		(menuItem) =>
			menuItem.type === 'submenu' ||
			(menuItem.type === 'group' && hasSubmenuItems(childItems(menuItem)))
	);

const textOf = (slot: unknown): string | undefined =>
	typeof slot === 'string' || typeof slot === 'number' ? String(slot) : undefined;

/** The text a row shows when it is plain text: its title, else its children. */
const labelOf = (item: MenuItem): string | undefined => {
	switch (item.type) {
		case 'separator':
			return textOf(item.children);
		case 'group':
		case 'radio-group':
			return textOf(item.label);
		case 'button':
			return textOf(item.children) ?? textOf(item.label);
		default:
			return textOf(item.title) ?? textOf(item.children);
	}
};

/**
 * One key per row, by the row's identity: an explicit `key`, else its plain text, `href` or
 * `textValue`, else its position among rows that have none. A repeated key gets a counter, so
 * the keys stay unique. Rows rebuilt on every render (an inline `items` array, a derived list)
 * therefore keep their DOM node, and with it focus, the tab stop and hover state, while rows
 * before them come and go.
 */
export const menuItemKeys = (items: readonly MenuItem[]): string[] => {
	const seen = new Map<string, number>();
	return items.map((item, index) => {
		const explicit = item.key;
		const named =
			explicit !== undefined
				? `k:${explicit}`
				: `${item.type}:${
						labelOf(item) ??
						('textValue' in item ? item.textValue : undefined) ??
						('href' in item ? item.href : undefined) ??
						`@${index}`
					}`;
		const count = seen.get(named) ?? 0;
		seen.set(named, count + 1);
		return count === 0 ? named : `${named}~${count}`;
	});
};

/**
 * The text a row is matched and announced on: `textValue`, else the row's own plain text, else the
 * text content of the rendered element (read lazily by the caller when this is empty).
 */
export const menuItemText = (item: MenuItem): string => {
	if (item.type === 'separator' || item.type === 'group' || item.type === 'radio-group') {
		return labelOf(item) ?? '';
	}
	return (
		('textValue' in item ? item.textValue : undefined) ??
		labelOf(item) ??
		(item.type === 'checkbox' || item.type === 'option' || item.type === 'submenu'
			? textOf(item.description)
			: undefined) ??
		''
	);
};

/** The value a row reports to `onHighlightChange`; `undefined` for rows with no value. */
export const menuItemValue = (item: MenuItem): string | undefined => {
	if (item.type === 'separator' || item.type === 'group') return undefined;
	if (item.type === 'radio-group') return undefined;
	if ('value' in item && typeof item.value === 'string') return item.value;
	return menuItemText(item) || undefined;
};

/** The default match of a filterable menu: case- and accent-insensitive, over the row's text and value. */
export const defaultMenuMatch = (row: MenuFilterMatchItem, search: string) =>
	matchItem({ label: row.text, value: row.value }, search.trim());

/**
 * The rows left after a search. A group stays when any of its rows does (the group's own label
 * matching keeps every row of it); a radio group is narrowed to its matching radios; separators
 * are dropped while searching, as a divider between hidden rows means nothing. A submenu row
 * stays when its own text matches: what is inside a submenu is searched in the submenu.
 */
export const filterMenuItems = (
	items: readonly MenuItem[],
	search: string,
	options: MenuFilterOptions | undefined
): MenuItem[] => {
	if (!search.trim()) return [...items];
	const match = options?.match ?? defaultMenuMatch;
	const matches = (item: MenuItem, text: string) =>
		match({ value: menuItemValue(item), text, item }, search);
	const result: MenuItem[] = [];
	for (const item of items) {
		switch (item.type) {
			case 'separator':
				break;
			case 'group': {
				const label = labelOf(item) ?? '';
				const rows =
					label && matches(item, label) ? item.items : filterMenuItems(item.items, search, options);
				if (rows.length > 0) result.push(rows === item.items ? item : { ...item, items: rows });
				break;
			}
			case 'radio-group': {
				const label = labelOf(item) ?? '';
				const rows =
					label && matches(item, label)
						? item.items
						: item.items.filter((radio) =>
								matches(
									{ ...radio, type: 'option' },
									textOf(radio.title) ?? textOf(radio.children) ?? radio.textValue ?? radio.value
								)
							);
				if (rows.length > 0) result.push(rows === item.items ? item : { ...item, items: rows });
				break;
			}
			default:
				if (matches(item, menuItemText(item))) result.push(item);
		}
	}
	return result;
};

/** Whether a group-or-row list holds a row a user can press (not only separators and labels). */
export const hasMenuRows = (items: readonly MenuItem[]): boolean =>
	items.some((item) => item.type !== 'separator');
