import '@testing-library/jest-dom/vitest';
import { cleanup, render, waitFor } from '@testing-library/svelte';
import { tick, type Component } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import Breadcrumbs from '$lib/components/Breadcrumbs/Breadcrumbs.svelte';
import { Chart } from '$lib/components/Chart/index.js';
import Code from '$lib/components/Code/Code.svelte';
import Command from '$lib/components/Command/Command.svelte';
import { DataTable } from '$lib/components/DataTable/index.js';
import { EventCalendar } from '$lib/components/EventCalendar/index.js';
import { EventCalendarState } from '$lib/components/EventCalendar/eventCalendar.state.svelte.js';
import Form from '$lib/components/Form/Form/Form.svelte';
import JsonEditor from '$lib/components/Form/JsonEditor/JsonEditor.svelte';
import MultiStepForm from '$lib/components/Form/MultiStepForm/MultiStepForm.svelte';
import Kanban from '$lib/components/Kanban/Kanban.svelte';
import MenuBar from '$lib/components/MenuBar/MenuBar.svelte';
import NavigationMenu from '$lib/components/NavigationMenu/NavigationMenu.svelte';
import Pagination from '$lib/components/Pagination/Pagination.svelte';
import PopupMenu from '$lib/components/PopupMenu/PopupMenu.svelte';
import Sidebar from '$lib/components/Sidebar/Sidebar.svelte';
import Tabs from '$lib/components/Tabs/Tabs.svelte';
import ContextMenuHarness from './ContextMenuHarness.test.svelte';
import HomonymsHarness from './HomonymsHarness.test.svelte';
import MenuInDialogHarness from './MenuInDialogHarness.test.svelte';
import TwoButtonsHarness from './TwoButtonsHarness.test.svelte';
import TwoMenusHarness from './TwoMenusHarness.test.svelte';
import WebMCPHarness from './WebMCPHarness.test.svelte';
import WithMarkerHarness from './WithMarkerHarness.test.svelte';

type Tool = {
	name: string;
	annotations?: {
		consequentialHint?: boolean;
		readOnlyHint?: boolean;
		untrustedContentHint?: boolean;
	};
	inputSchema: { properties: Record<string, { enum?: string[]; oneOf?: { title: string }[] }> };
	execute: (input: Record<string, unknown>, options: object) => Promise<Record<string, unknown>>;
};

let tools: Map<string, Tool>;
let followed: string[];
let exposures: Map<string, string[] | undefined>;

beforeEach(() => {
	tools = new Map();
	followed = [];
	exposures = new Map();
	vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
		this: HTMLAnchorElement
	) {
		followed.push(this.getAttribute('href') ?? '');
	});
	Object.defineProperty(document, 'modelContext', {
		configurable: true,
		value: {
			registerTool: (
				tool: Tool,
				{ signal, exposedTo }: { signal: AbortSignal; exposedTo?: string[] }
			) => {
				tools.set(tool.name, tool);
				exposures.set(tool.name, exposedTo);
				signal.addEventListener('abort', () => {
					if (tools.get(tool.name) === tool) tools.delete(tool.name);
				});
				return Promise.resolve();
			}
		}
	});
	Element.prototype.scrollIntoView ??= vi.fn();
	// jsdom has no Web Animations.
	Element.prototype.getAnimations ??= () => [];
});
afterEach(async () => {
	cleanup();
	// The shared tools refresh a moment after a component leaves.
	await new Promise((resolve) => setTimeout(resolve, 80));
	vi.restoreAllMocks();
	delete (document as unknown as { modelContext?: unknown }).modelContext;
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mount = (component: unknown, props: Record<string, any> = {}) =>
	render(WebMCPHarness, { component: component as Component, ...props });

const tool = async (name: string): Promise<Tool> => {
	await waitFor(() => expect(tools.has(name)).toBe(true));
	return tools.get(name) as Tool;
};

const daysAfter = (event: { start: string; end: string }, start: string) => {
	const length = Date.parse(event.end) - Date.parse(event.start);
	return new Date(Date.parse(start) + length).toISOString().slice(0, 10);
};

const optionsOf = (found: Tool, param = 'id') => found.inputSchema.properties[param].enum;

describe('Tabs', () => {
	const items = [
		{ value: 'a', label: 'First' },
		{ value: 'b', label: 'Second' },
		{ value: 'c', label: 'Off', disabled: true }
	];

	test('offers the enabled tabs and reports a change as a click does', async () => {
		const onValueChange = vi.fn();
		mount(Tabs, { items, onValueChange });
		const select = await tool('select_tab');
		expect(optionsOf(select, 'value')).toEqual(['a', 'b']);
		expect(await select.execute({ value: 'b' }, {})).toEqual({ status: 'done', value: 'b' });
		expect(onValueChange).toHaveBeenCalledWith(
			expect.objectContaining({ value: 'b', reason: 'user' })
		);
	});

	test('a disabled tab cannot be picked, and tool={false} removes the tool', async () => {
		const first = mount(Tabs, { items });
		expect(await (await tool('select_tab')).execute({ value: 'c' }, {})).toEqual({
			status: 'unavailable'
		});
		first.unmount();
		mount(Tabs, { items, tool: false });
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(tools.has('select_tab')).toBe(false);
	});
});

describe('Pagination', () => {
	test('with getHref, the page changes as well as the link being followed', async () => {
		const onValueChange = vi.fn();
		mount(Pagination, { totalPages: 5, onValueChange, getHref: (page: number) => `?page=${page}` });
		await (await tool('go_to_page')).execute({ page: 3 }, {});
		expect(onValueChange).toHaveBeenCalled();
		expect(followed).toEqual([expect.stringContaining('page=3')]);
	});

	test('goes to a page within its bounds', async () => {
		const onValueChange = vi.fn();
		mount(Pagination, { totalPages: 5, onValueChange });
		const go = await tool('go_to_page');
		expect(await go.execute({ page: 3 }, {})).toEqual({ status: 'done', page: 3 });
		expect(onValueChange).toHaveBeenCalled();
		expect(await go.execute({ page: 9 }, {})).toEqual({ status: 'invalid' });
	});
});

describe('navigation', () => {
	test('a path that reads as another host once it stands alone is not offered', async () => {
		mount(Breadcrumbs, {
			items: [
				{ label: 'Home', href: '/' },
				{ label: 'Trick', href: `${location.origin}//evil.example/collect` }
			]
		});
		await waitFor(async () => expect(optionsOf(await tool('navigate'), 'to')).toEqual(['/']));
	});

	test('Sidebar, NavigationMenu and Breadcrumbs share one navigate tool, on this site only', async () => {
		mount(Breadcrumbs, {
			items: [
				{ label: 'Home', href: '/' },
				{ label: 'Away', href: 'https://example.com/' },
				{ label: 'Here', href: '/here', active: true }
			]
		});
		const navigate = await tool('navigate');
		await waitFor(() => expect(optionsOf(navigate, 'to')).toEqual(['/']));
		await navigate.execute({ to: '/' }, {});
		expect(followed).toEqual(['/']);
	});

	test('NavigationMenu offers the links of its panels', async () => {
		mount(NavigationMenu, {
			items: [
				{ type: 'link', label: 'Pricing', href: '/pricing' },
				{
					type: 'panel',
					value: 'docs',
					label: 'Docs',
					content: [{ label: 'Guide', href: '/guide' }]
				}
			]
		});
		await waitFor(async () =>
			expect(optionsOf(await tool('navigate'), 'to')).toEqual(['/pricing', '/guide'])
		);
	});

	test('Sidebar offers its links and its handler rows', async () => {
		const onclick = vi.fn();
		mount(Sidebar, {
			items: [
				{
					label: 'Main',
					items: [
						{ label: 'Inbox', href: '/inbox', items: [{ label: 'Archive', href: '/archive' }] },
						{ label: 'Sync', onclick }
					]
				}
			]
		});
		await waitFor(async () =>
			expect(optionsOf(await tool('navigate'), 'to')).toEqual(['/inbox', '/archive'])
		);
		await (await tool('run_command')).execute({ id: 'sync' }, {});
		expect(onclick).toHaveBeenCalled();
	});
});

describe('commands', () => {
	test('Command offers its enabled items and selects as a click does', async () => {
		const onSelect = vi.fn();
		mount(Command, {
			items: [
				{
					heading: 'Files',
					items: [
						{ value: 'new', label: 'New file' },
						{ value: 'off', label: 'Off', disabled: true }
					]
				}
			],
			onSelect
		});
		const run = await tool('run_command');
		expect(optionsOf(run)).toEqual(['new']);
		await run.execute({ id: 'new' }, {});
		expect(onSelect).toHaveBeenCalledWith('new');
	});

	test('a menu offers its rows, submenus and toggles, and danger rows apart', async () => {
		const save = vi.fn();
		const remove = vi.fn();
		const toggle = vi.fn();
		const items = [
			{ type: 'option', title: 'Save', onclick: save },
			{ type: 'option', title: 'Off', disabled: true, onclick: save },
			{ type: 'option', title: 'Delete', color: 'danger', onclick: remove },
			{ type: 'checkbox', title: 'Wrap', value: false, onValueChange: toggle },
			{ type: 'submenu', title: 'More', menu: [{ type: 'option', title: 'Deep', onclick: save }] }
		];
		mount(PopupMenu, { menu: { items }, trigger: { content: 'Actions' } });
		const run = await tool('run_command');
		expect(optionsOf(run)).toEqual(['save', 'wrap', 'more_deep']);
		await run.execute({ id: 'wrap' }, {});
		expect(toggle).toHaveBeenCalledWith(true);
		const danger = await tool('run_consequential_command');
		expect(danger.annotations?.consequentialHint).toBe(true);
		await danger.execute({ id: 'delete' }, {});
		expect(remove).toHaveBeenCalled();
	});

	test('two menus with one label keep their ids, and each its own action', async () => {
		const first = vi.fn();
		const second = vi.fn();
		const menu = (onclick: () => void, content: string) => ({
			menu: { items: [{ type: 'option', title: 'Save', onclick }] },
			trigger: { content }
		});
		mount(TwoMenusHarness, { first: menu(first, 'A'), second: menu(second, 'B') });
		const run = await tool('run_command');
		await waitFor(() => expect(optionsOf(run)).toEqual(['save', 'save_2']));
		await run.execute({ id: 'save' }, {});
		await new Promise((resolve) => setTimeout(resolve, 80));
		await (await tool('run_command')).execute({ id: 'save' }, {});
		expect(first).toHaveBeenCalledTimes(2);
		expect(second).not.toHaveBeenCalled();
	});

	test('a row disabled since the list was built does not run', async () => {
		const onclick = vi.fn();
		const items = (disabled: boolean) => [
			{ type: 'option', title: 'Save', onclick, disabled },
			{ type: 'option', title: 'Other', onclick: () => {} }
		];
		const trigger = { content: 'Actions' };
		const { rerender } = mount(PopupMenu, { menu: { items: items(false) }, trigger });
		const run = await tool('run_command');
		await rerender({
			component: PopupMenu as Component,
			menu: { items: items(true) },
			trigger
		});
		await tick();
		expect((await run.execute({ id: 'save' }, {})).status).toBe('unavailable');
		expect(onclick).not.toHaveBeenCalled();
	});

	test('a menu in a modal is on offer there, and the page steps aside', async () => {
		mount(MenuInDialogHarness);
		await waitFor(async () => expect(optionsOf(await tool('run_command'))).toEqual(['in_dialog']));
	});

	test('options of different exposures do not share a tool', async () => {
		mount(TwoButtonsHarness);
		await tool('click_button');
		await waitFor(() => expect(tools.has('click_button_2')).toBe(true));
		expect(optionsOf(tools.get('click_button') as Tool)).toHaveLength(1);
		expect(optionsOf(tools.get('click_button_2') as Tool)).toHaveLength(1);
		expect(exposures.get('click_button')).toEqual(['https://partner.example']);
		expect(exposures.get('click_button_2')).toBeUndefined();
	});

	test('a handler that throws does not reach the model', async () => {
		mount(PopupMenu, {
			menu: {
				items: [
					{
						type: 'option',
						title: 'Boom',
						onclick: () => {
							throw new Error('secret 4242');
						}
					}
				]
			},
			trigger: { content: 'Actions' }
		});
		const result = await (await tool('run_command')).execute({ id: 'boom' }, {});
		expect(result.status).toBe('failed');
		expect(JSON.stringify(result)).not.toContain('4242');
	});

	test('MenuBar names a row after its menu', async () => {
		mount(MenuBar, {
			menus: [{ label: 'File', items: [{ type: 'option', title: 'Open', onclick: () => {} }] }]
		});
		expect(optionsOf(await tool('run_command'))).toEqual(['file_open']);
	});

	test('a ContextMenu acts on what was right-clicked, so it offers nothing while closed', async () => {
		const items = [{ type: 'option', title: 'Rename', onclick: () => {} }];
		const closed = mount(ContextMenuHarness, { items });
		await new Promise((resolve) => setTimeout(resolve, 80));
		expect(tools.has('run_command')).toBe(false);
		closed.unmount();

		// Options refine it; only `true` offers rows with no target.
		const refined = mount(ContextMenuHarness, { items, tool: { consequential: true } });
		await new Promise((resolve) => setTimeout(resolve, 80));
		expect(tools.size).toBe(0);
		refined.unmount();

		mount(ContextMenuHarness, { items, tool: true });
		expect(optionsOf(await tool('run_command'))).toEqual(['rename']);
	});
});

describe('MultiStepForm', () => {
	test('only the current step is a tool, which moves to the next', async () => {
		const items = [
			{ title: 'Who', inputs: { name: { type: 'text', label: 'Name', required: true } } },
			{ title: 'Where', inputs: { city: { type: 'text', label: 'City', required: true } } }
		];
		const onSubmitForm = vi.fn();
		mount(MultiStepForm, { items, onSubmitForm });
		const who = await tool('who');
		expect(tools.has('where')).toBe(false);
		expect(await who.execute({ name: 'Ada' }, {})).toMatchObject({ status: 'submitted' });
		const where = await tool('where');
		await waitFor(() => expect(tools.has('who')).toBe(false));
		await where.execute({ city: 'Paris' }, {});
		await waitFor(() => expect(onSubmitForm).toHaveBeenCalled());
	});

	test('a disabled Next leaves the step without a tool', async () => {
		mount(MultiStepForm, {
			items: [
				{ title: 'Who', inputs: { name: { type: 'text', label: 'Name' } } },
				{ title: 'Then', inputs: {} }
			],
			nextButtonProps: { disabled: true }
		});
		await new Promise((resolve) => setTimeout(resolve, 80));
		expect(tools.has('who')).toBe(false);
	});
});

describe('JsonEditor', () => {
	const schema = {
		type: 'object',
		required: ['name'],
		properties: {
			name: { type: 'string', maxLength: 8 },
			token: { type: 'string', writeOnly: true },
			keys: { type: 'array', items: { type: 'string', format: 'password' } }
		}
	};
	const value = { name: 'Ada', token: 'secret', keys: ['k1'] };

	test('reads what it shows, with a masked value hidden', async () => {
		mount(JsonEditor, { label: 'Config', schema, value });
		const read = await tool('read_json');
		expect(read.annotations?.readOnlyHint).toBe(true);
		const answer = await read.execute({}, {});
		expect(answer).toEqual({
			status: 'done',
			value: { name: 'Ada', token: '[hidden]', keys: ['[hidden]'] }
		});
	});

	test('an edit reports a change as a person does, and keeps what stayed hidden', async () => {
		const onValueChange = vi.fn();
		mount(JsonEditor, { label: 'Config', schema, value, onValueChange });
		const edit = await tool('edit_json');
		expect(edit.annotations?.consequentialHint).toBe(true);
		const answer = await edit.execute(
			{ value: { name: 'Bob', token: '[hidden]', keys: ['[hidden]', 'new'] } },
			{}
		);
		expect(answer).toEqual({ status: 'done' });
		expect(onValueChange).toHaveBeenLastCalledWith({
			name: 'Bob',
			token: 'secret',
			keys: ['k1', 'new']
		});
	});

	test('a person can take an edit back', async () => {
		const onValueChange = vi.fn();
		const { container } = mount(JsonEditor, { schema, value: { name: 'Ada' }, onValueChange });
		await (await tool('edit_json')).execute({ value: { name: 'Bob' } }, {});
		await tick();
		const root = container.querySelector('[data-slot="json-editor"]') as HTMLElement;
		root.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
		await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith({ name: 'Ada' }));
	});

	test('a value that breaks the schema is refused and changes nothing', async () => {
		const onValueChange = vi.fn();
		mount(JsonEditor, { schema, value, onValueChange });
		const answer = await (await tool('edit_json')).execute({ value: { name: 'far too long' } }, {});
		expect(answer.status).toBe('invalid');
		expect(answer.issues).toEqual([expect.objectContaining({ path: ['name'], code: 'maxLength' })]);
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('a read-only editor is read and not edited, a disabled one too', async () => {
		mount(JsonEditor, { schema, value, readOnly: true });
		await tool('read_json');
		expect(tools.has('edit_json')).toBe(false);
		cleanup();
		await new Promise((resolve) => setTimeout(resolve, 80));
		mount(JsonEditor, { schema, value, disabled: true });
		await tool('read_json');
		expect(tools.has('edit_json')).toBe(false);
	});

	test('tool={false} removes it', async () => {
		mount(JsonEditor, { schema, value, tool: false });
		await new Promise((resolve) => setTimeout(resolve, 80));
		expect(tools.size).toBe(0);
	});

	test('in a Form, the value is a field of its tool, held to the schema', async () => {
		const onSubmit = vi.fn();
		mount(Form, {
			title: 'Deploy',
			inputs: { config: { type: 'json', label: 'Config', schema } },
			onSubmit
		});
		const form = await tool('deploy');
		expect(tools.has('read_json')).toBe(false);
		expect(tools.has('edit_json')).toBe(false);
		expect(form.inputSchema.properties.config).toMatchObject({ type: 'object' });
		const refused = await form.execute({ config: { name: 'far too long' } }, {});
		expect(onSubmit).not.toHaveBeenCalled();
		expect(refused.status).not.toBe('submitted');
		await form.execute({ config: { name: 'Bob' } }, {});
		await waitFor(() => expect(onSubmit).toHaveBeenCalled());
		expect(onSubmit.mock.calls[0][0]).toEqual({ config: { name: 'Bob' } });
	});
});

describe('DataTable', () => {
	const rows = [
		{ id: '1', name: 'Ada', secret: 'x', role: 'admin' },
		{ id: '2', name: 'Bob', secret: 'y', role: 'user' }
	];
	const columns = [
		{ id: 'name', accessor: 'name', header: 'Name', sortable: true },
		{
			id: 'role',
			accessor: 'role',
			header: 'Role',
			filter: { type: 'select', options: [{ value: 'admin', label: 'Admin' }] }
		}
	];
	const props = { items: rows, columns, getRowId: (row: { id: string }) => row.id, search: true };

	test('reads by column, so a field no column shows stays out', async () => {
		mount(DataTable, props);
		const query = await tool('query_table');
		expect(query.annotations?.untrustedContentHint).toBe(true);
		const result = await query.execute({}, {});
		expect(result.rows).toEqual([
			{ id: '1', name: 'Ada', role: 'admin' },
			{ id: '2', name: 'Bob', role: 'user' }
		]);
		expect(JSON.stringify(result)).not.toContain('secret');
	});

	test('searches and sorts as its controls do, and refuses what it does not offer', async () => {
		mount(DataTable, props);
		const query = await tool('query_table');
		const sorted = await query.execute({ sort: 'name', descending: true }, {});
		expect((sorted.rows as { name: string }[])[0].name).toBe('Bob');
		const found = await query.execute({ search: 'Ada' }, {});
		expect((found.rows as unknown[]).length).toBe(1);
		expect((await query.execute({ sort: 'role' }, {})).status).toBe('invalid');
		expect((await query.execute({ filters: { name: 'a' } }, {})).status).toBe('invalid');
		expect((await query.execute({ filters: { role: 'root' } }, {})).status).toBe('invalid');
	});

	test("a cell renderer decides what is read, and ids are the table's own", async () => {
		const masked = [
			{ id: 'name', accessor: 'name', header: 'Name' },
			{ id: 'token', accessor: 'secret', header: 'Token', cell: '••••' }
		];
		mount(DataTable, {
			...props,
			columns: masked,
			getRowId: (_: unknown, index: number) => String(index),
			pagination: { pageSize: 1 }
		});
		const query = await tool('query_table');
		const second = await query.execute({ page: 2 }, {});
		expect(second.rows).toEqual([{ id: '1', name: 'Bob', token: '••••' }]);
		expect(JSON.stringify(second)).not.toContain('"y"');
	});

	test('the buttons of its own chrome are not click_button options', async () => {
		mount(DataTable, { ...props, pagination: { pageSize: 1 } });
		await tool('query_table');
		await new Promise((resolve) => setTimeout(resolve, 80));
		expect(tools.has('go_to_page')).toBe(false);
	});
});

describe('Buttons a component holds', () => {
	const titlesOf = (found: Tool) => found.inputSchema.properties.id.oneOf?.map((o) => o.title);
	const inputs = { email: { type: 'email', label: 'Email' } };
	const action = (children: string, more: object = {}) => ({
		children,
		onAction: () => {},
		...more
	});
	const offeredBeside = async (component: unknown, props: Record<string, unknown>) => {
		mount(WithMarkerHarness, { inner: component, ...props });
		const found = await tool('click_button');
		await waitFor(() => expect(titlesOf(found)).toContain('Marker'));
		await new Promise((resolve) => setTimeout(resolve, 80));
		return titlesOf(tools.get('click_button') as Tool);
	};

	test('a form with onSubmit leaves its actions to its own tool', async () => {
		const props = { inputs, onSubmit: () => {}, actions: [action('Subscribe')] };
		expect(await offeredBeside(Form, props)).toEqual(['Marker']);
	});

	test('a form without onSubmit offers its actions', async () => {
		const props = { inputs, actions: [action('Save draft')] };
		expect(await offeredBeside(Form, props)).toContain('Save draft');
	});

	test('a form kept from agents keeps its actions from them', async () => {
		const props = { inputs, tool: false, actions: [action('Save draft')] };
		expect(await offeredBeside(Form, props)).toEqual(['Marker']);
	});

	test('an action can ask to stay offered', async () => {
		const props = {
			inputs,
			onSubmit: () => {},
			actions: [action('Save draft', { tool: { description: 'Keeps it for later.' } })]
		};
		expect((await offeredBeside(Form, props))?.join()).toContain('Save draft');
	});

	test('the copy button of a code block is not offered', async () => {
		const props = { code: 'const a = 1;', language: 'ts' };
		expect(await offeredBeside(Code, props)).toEqual(['Marker']);
	});
});

describe('Buttons that read the same', () => {
	const titlesOf = (found: Tool) => found.inputSchema.properties.id.oneOf?.map((o) => o.title);
	const danger = () => tool('click_danger_button');
	const readDanger = async () =>
		(await (await tool('read_danger_buttons')).execute({}, {})) as {
			options: { id: string; label: string; context: string | null }[];
		};

	test('are numbered, without what tells them apart in the list', async () => {
		mount(HomonymsHarness, {});
		const found = await danger();
		expect(titlesOf(found)).toEqual(['Delete (1 of 3)', 'Delete (2 of 3)', 'Delete (3 of 3)']);
		expect(JSON.stringify(found.inputSchema)).not.toContain('Bob');
		const read = await tool('read_danger_buttons');
		expect(read.annotations).toMatchObject({ readOnlyHint: true, untrustedContentHint: true });
	});

	test('tells them apart from what surrounds them, without field values', async () => {
		mount(HomonymsHarness, {});
		const { options } = await readDanger();
		expect(options.map(({ context }) => context)).toEqual([
			'Ada Martin',
			'Bob Durand',
			'Cleo Petit'
		]);
		expect(JSON.stringify(options)).not.toContain('hidden-value');
	});

	test('must be read before one is pressed, then press the right one', async () => {
		const onDelete = vi.fn();
		mount(HomonymsHarness, { onDelete });
		const found = await danger();
		const { id } = (await readDanger()).options[1];
		expect(await found.execute({ id }, {})).toMatchObject({ status: 'pressed' });
		expect(onDelete).toHaveBeenCalledExactlyOnceWith('Bob Durand');
	});

	test('are refused unread', async () => {
		const onDelete = vi.fn();
		mount(HomonymsHarness, { onDelete });
		const found = await danger();
		const id = found.inputSchema.properties.id.enum?.[1];
		expect(await found.execute({ id }, {})).toMatchObject({ status: 'read_first' });
		expect(onDelete).not.toHaveBeenCalled();
	});

	test('are refused when the row changed since it was read', async () => {
		const onDelete = vi.fn();
		const { container } = mount(HomonymsHarness, { onDelete });
		const found = await danger();
		const { id } = (await readDanger()).options[1];
		const cell = [...container.querySelectorAll('td')].find(
			(td) => td.textContent === 'Bob Durand'
		);
		(cell as HTMLElement).textContent = 'Someone else';
		expect(await found.execute({ id }, {})).toMatchObject({ status: 'read_first' });
		expect(onDelete).not.toHaveBeenCalled();
	});

	test('use the heading above when nothing else holds them', async () => {
		mount(HomonymsHarness, {});
		const { options } = (await (await tool('read_buttons')).execute({}, {})) as {
			options: { label: string; context: string }[];
		};
		expect(options.map(({ context }) => context)).toEqual(['Invoices', 'Quotes']);
	});

	test('a danger button nothing tells apart is left out, any other stays', async () => {
		mount(HomonymsHarness, { flat: true });
		const found = await tool('click_button');
		await waitFor(() => expect(titlesOf(found)).toContain('Marker'));
		const titles = titlesOf(tools.get('click_button') as Tool);
		expect(titles).toEqual(['Open (1 of 2)', 'Open (2 of 2)', 'Marker']);
		await new Promise((resolve) => setTimeout(resolve, 80));
		expect(tools.has('click_danger_button')).toBe(false);
		expect(tools.has('read_buttons')).toBe(false);
	});

	test('a distinct description makes them distinct', async () => {
		mount(HomonymsHarness, { described: true });
		const found = await tool('click_button');
		await waitFor(() => expect(titlesOf(found)).toContain('Marker'));
		expect(titlesOf(tools.get('click_button') as Tool)).toEqual([
			'Open: The invoice.',
			'Open: The quote.',
			'Marker'
		]);
	});
});

describe('Chart', () => {
	test('reads only the fields its marks plot', async () => {
		mount(Chart, {
			label: 'Sales',
			data: [{ month: 'Jan', sales: 3, secret: 'x' }],
			x: { scale: { type: 'band' } },
			y: { scale: { type: 'linear' } },
			marks: [{ type: 'bar', x: 'month', y: 'sales' }]
		});
		const read = await tool('read_chart_data');
		expect(read.annotations).toMatchObject({ readOnlyHint: true, untrustedContentHint: true });
		expect(await read.execute({}, {})).toEqual({
			fields: ['month', 'sales'],
			total: 1,
			rows: [{ month: 'Jan', sales: 3 }]
		});
	});
});

describe('Chart fields', () => {
	test("a mark's type is not a field, even with a row field of that name", async () => {
		mount(Chart, {
			label: 'Line',
			data: [{ x: 1, y: 2, series: 'private token' }],
			x: { scale: { type: 'linear' } },
			y: { scale: { type: 'linear' } },
			marks: [{ type: 'series', x: 'x', y: 'y' }]
		});
		expect(await (await tool('read_chart_data')).execute({}, {})).toMatchObject({
			fields: ['x', 'y']
		});
	});
});

describe('Kanban', () => {
	const columns = () => [
		{ id: 'todo', title: 'To do', cards: [{ id: 'c1', title: 'One' }] },
		{ id: 'done', title: 'Done', limit: 1, cards: [{ id: 'c2', title: 'Two' }] },
		{ id: 'next', title: 'Next', cards: [] }
	];

	test('reads the board and moves a card as a drop does', async () => {
		const onCardMove = vi.fn();
		mount(Kanban, { columns: columns(), onCardMove });
		const board = await (await tool('read_board')).execute({}, {});
		expect(board.columns).toHaveLength(3);
		const move = await tool('move_card');
		expect(move.annotations?.consequentialHint).toBe(true);
		expect(await move.execute({ cardId: 'c1', columnId: 'next' }, {})).toMatchObject({
			status: 'done'
		});
		expect(onCardMove.mock.calls[0][0].to).toEqual({ columnId: 'next', index: 0 });
	});

	test('is held to what a drag is held to', async () => {
		mount(Kanban, {
			columns: columns(),
			canDrag: ({ card }: { card: { id: string } }) => card.id !== 'c2',
			accepts: ({ to }: { to: { id: string } }) => to.id !== 'next'
		});
		const move = await tool('move_card');
		expect((await move.execute({ cardId: 'c1', columnId: 'done' }, {})).status).toBe('refused');
		expect((await move.execute({ cardId: 'c1', columnId: 'next' }, {})).status).toBe('refused');
		expect((await move.execute({ cardId: 'c2', columnId: 'todo' }, {})).status).toBe('refused');
	});
});

describe('EventCalendar', () => {
	const start = new Date(2026, 10, 4, 9);
	const items = [
		{ id: 'e1', title: 'Standup', start, end: new Date(2026, 10, 4, 10), custom: 'private' }
	];
	const props = { items, date: start, view: 'week', timeZone: 'UTC' };

	test('reads events without their custom fields', async () => {
		mount(EventCalendar, props);
		const read = await tool('read_calendar');
		const { events } = (await read.execute({}, {})) as { events: { key: string; title: string }[] };
		expect(events.map((event) => event.title)).toEqual(['Standup']);
		expect(JSON.stringify(events)).not.toContain('private');
	});

	test('a read-only event cannot be moved', async () => {
		mount(EventCalendar, { ...props, items: [{ ...items[0], readOnly: true }] });
		const { events } = (await (await tool('read_calendar')).execute({}, {})) as {
			events: { key: string }[];
		};
		const result = await (
			await tool('move_event')
		).execute({ key: events[0].key, start: start.toISOString(), end: start.toISOString() }, {});
		expect(result.status).toBe('refused');
	});
});

describe('EventCalendar moves', () => {
	const start = new Date(2026, 10, 4, 9);
	const end = new Date(2026, 10, 4, 10);
	const props = { date: start, view: 'week', timeZone: 'UTC' };
	const move = async (item: object, nextStart: Date, nextEnd: Date) => {
		mount(EventCalendar, { ...props, items: [{ id: 'e', title: 'E', start, end, ...item }] });
		const { events } = (await (await tool('read_calendar')).execute({}, {})) as {
			events: { key: string }[];
		};
		return (await tool('move_event')).execute(
			{ key: events[0].key, start: nextStart.toISOString(), end: nextEnd.toISOString() },
			{}
		);
	};

	test('moving keeps the same path as a drag', async () => {
		const later = new Date(2026, 10, 4, 11);
		expect((await move({}, later, new Date(2026, 10, 4, 12))).status).toBe('done');
	});

	test('changing the length is a resize, with its own switch', async () => {
		const result = await move({ resizable: false }, start, new Date(2026, 10, 4, 12));
		expect(result.status).toBe('refused');
	});
});

describe('EventCalendar rules', () => {
	const props = { date: new Date(Date.UTC(2026, 10, 4, 12)), view: 'week', timeZone: 'UTC' };

	test('a read-only resource holds its events, as with a drag', async () => {
		const start = new Date(Date.UTC(2026, 10, 4, 9));
		const end = new Date(Date.UTC(2026, 10, 4, 10));
		mount(EventCalendar, {
			...props,
			resources: [{ id: 'r', title: 'Room', readOnly: true }],
			items: [{ id: 'e', title: 'E', start, end, resourceIds: ['r'] }]
		});
		const { events } = (await (await tool('read_calendar')).execute({}, {})) as {
			events: { key: string }[];
		};
		const result = await (
			await tool('move_event')
		).execute({ key: events[0].key, start: start.toISOString(), end: end.toISOString() }, {});
		expect(result.status).toBe('refused');
	});

	test('an all-day event moves by dates', async () => {
		mount(EventCalendar, {
			...props,
			items: [{ id: 'd', title: 'Day', allDay: true, start: '2026-11-04', end: '2026-11-05' }]
		});
		const read = await tool('read_calendar');
		const { events } = (await read.execute({}, {})) as {
			events: { key: string; start: string; end: string }[];
		};
		expect(events[0].start).toBe('2026-11-04');
		const result = await (
			await tool('move_event')
		).execute(
			{ key: events[0].key, start: '2026-11-05', end: daysAfter(events[0], '2026-11-05') },
			{}
		);
		expect(result.status).toBe('done');
	});

	test('a day to show is a day of the calendar, not of UTC', async () => {
		const goTo = vi.spyOn(EventCalendarState.prototype, 'goTo');
		mount(EventCalendar, { ...props, items: [], timeZone: 'America/New_York' });
		await (await tool('show_calendar')).execute({ date: '2026-11-04' }, {});
		expect(goTo).toHaveBeenCalledWith('2026-11-04');
	});
});

describe('without the option', () => {
	test('no component registers anything', async () => {
		mount(Tabs, { webmcp: false, items: [{ value: 'a' }, { value: 'b' }] });
		await new Promise((resolve) => setTimeout(resolve, 80));
		expect(tools.size).toBe(0);
	});
});
