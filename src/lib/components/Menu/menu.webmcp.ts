// A menu's rows as options of `run_command`, for every component that renders a Menu. A row is run
// through the props a press would use, so it needs no menu open.

import type { WebMCPChoice } from '$lib/utils/webmcp/webmcp.choices.js';
import { followLink, siteAddress } from '$lib/utils/webmcp/webmcp.navigation.js';
import type { MenuItem, MenuRadioGroupItem } from './menu.props.js';

type RowContext = { surface?: string; exposedTo?: string[]; consequential?: boolean };

const textOf = (slot: unknown): string => (typeof slot === 'string' ? slot : '');

// A row may not be rendered, so nothing dispatches this: the handler only reads its flags.
const pressEvent = () =>
	new MouseEvent('click', { bubbles: true, cancelable: true }) as MouseEvent & {
		currentTarget: EventTarget & HTMLElement;
	};

function rowText(item: {
	title?: unknown;
	children?: unknown;
	label?: unknown;
	textValue?: unknown;
}) {
	return (
		textOf(item.title) || textOf(item.children) || textOf(item.label) || textOf(item.textValue)
	);
}

const radioChoices = (
	group: MenuRadioGroupItem,
	path: string[],
	context: RowContext
): WebMCPChoice[] =>
	group.disabled
		? []
		: group.items.flatMap((radio) => {
				const label = rowText(radio);
				if (radio.disabled || !label) return [];
				return [
					{
						...context,
						key: `${path.join('>')}>${radio.value}`,
						label: [...path, textOf(group.label), label].filter(Boolean).join(' > '),
						run: () => group.onValueChange?.(radio.value)
					}
				];
			});

/** The rows of a menu an agent could choose. `path` is the labels of the rows around them. */
export function menuChoices(
	items: readonly MenuItem[],
	context: RowContext,
	path: string[] = []
): WebMCPChoice[] {
	return items.flatMap((item): WebMCPChoice[] => {
		if (item.type === 'separator') return [];
		if (item.type === 'group') {
			return menuChoices(item.items, context, [...path, textOf(item.label)].filter(Boolean));
		}
		if (item.type === 'radio-group') return radioChoices(item, path, context);
		const label = rowText(item);
		if (item.disabled || !label) return [];
		const named = [...path, label].join(' > ');
		const key = item.key ?? named;
		if (item.type === 'submenu') return menuChoices(item.menu, context, [...path, label]);
		if (item.type === 'checkbox') {
			return [
				{
					...context,
					key,
					label: named,
					description: item.value ? 'Currently on.' : 'Currently off.',
					run: () => item.onValueChange?.(!item.value)
				}
			];
		}
		const { href, onclick } = item;
		const target = 'target' in item ? item.target : undefined;
		const to = siteAddress(href, target);
		if (!onclick && !to) return [];
		return [
			{
				...context,
				key,
				label: named,
				consequential: context.consequential ?? item.color === 'danger',
				run: () => {
					const event = pressEvent();
					onclick?.(event);
					if (to && !event.defaultPrevented) followLink(to);
				}
			}
		];
	});
}
