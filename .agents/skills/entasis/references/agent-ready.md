# Make it agent-ready

`<Theme webmcp>` exposes an entasis interface to an AI agent running in the browser, through
WebMCP: forms, buttons, menus, links, tabs, tables and the other components that act or show data
become tools, named and described from the props they already have. There is no tool to write.

An interface is agent-ready when an agent can find what it needs by name, can do what a person
can and nothing more, and every action that needs a person asks for one. Most of that is the same
work as a good interface for people: real labels, distinct names, `color="danger"` on what
destroys.

WebMCP is experimental (a W3C Community Group draft in a Chrome origin trial) and its API still
changes. The option is off by default, does nothing on the server or in a browser without the API,
and a page without it never loads the components' tool code. The full reference is
`node_modules/entasis/docs/components/webmcp.md`; the site guide is
https://entasis.beynar.workers.dev/docs/webmcp.

## Turn it on

Set it once, on the root `<Theme>`. Ask the person first if the app is theirs to ship: an agent
then acts with the session of the person using the page.

```svelte
<script>
	import { Theme } from 'entasis/theme';

	let { children } = $props();
</script>

<Theme webmcp>{@render children()}</Theme>
```

Tools are exposed to the page's own origin. `webmcp={{ exposedTo: ['https://partner.example'] }}`
lets another origin's agent use them too.

## What becomes a tool

| Component                            | Tools                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| Form                                 | one per form, named from `title` (else `form`); fills in, validates, submits    |
| MultiStepForm                        | the current step's form                                                         |
| `ask()`                              | `answer_dialog`, `cancel_dialog` while it is open                               |
| Button                               | `click_button`; `click_danger_button` for `color="danger"` or consequential     |
| Command, PopupMenu, MenuBar          | `run_command`, `run_consequential_command`                                      |
| ContextMenu                          | `run_command`, only while it is open                                            |
| Sidebar, NavigationMenu, Breadcrumbs | `navigate`, to links on this site                                               |
| Tabs, Pagination                     | `select_tab`, `go_to_page`                                                      |
| DataTable                            | `query_table`, and `move_row` while rows can be reordered                       |
| Chart, DocumentViewer, JsonEditor    | `read_chart_data`; `search_document`, `read_document`; `read_json`, `edit_json` |
| Kanban, EventCalendar                | `read_board`, `move_card`; `read_calendar`, `show_calendar`, `move_event`       |

Buttons and menu rows do not get a tool each: a page has one `click_button` whose `id` lists the
buttons a person could press, so the model is not handed hundreds of tools.

<!-- component-contract:webmcp:start -->

Components that take a `tool` prop (generated from their props files):

- Sidebar: `entasis/sidebar`
- Button: `entasis/button`
- `entasis/ask`
- Form: `entasis/form`
- JSON editor: `entasis/json-editor`
- Multi-step form: `entasis/multi-step-form`
- Chart: `entasis/chart`
- Event calendar: `entasis/event-calendar`
- Kanban: `entasis/kanban`
- Data table: `entasis/data-table`
- Breadcrumbs: `entasis/breadcrumbs`
- Command: `entasis/command`
- Navigation menu: `entasis/navigation-menu`
- Pagination: `entasis/pagination`
- Tabs: `entasis/tabs`
- Context menu: `entasis/context-menu`
- Menu bar: `entasis/menu-bar`
- Popup menu: `entasis/popup-menu`
- Dialog: `entasis/dialog`
- Document viewer: `entasis/document-viewer`

<!-- component-contract:webmcp:end -->

## The checklist

1. **Every control an agent should use is an entasis component.** Tools come from components: a
   plain `<button>`, `<input>` or `<a>` is invisible to them. Use Button (submit and wizard
   buttons included), a Form entry or a field component, and Sidebar, NavigationMenu or
   Breadcrumbs links.
2. **Every control has a name, and names differ.** The tool name and description come from what
   people read: a Form's `title` and `description` (else its field labels), a field's `label`, a
   Button's text or `label`, a menu row's label.
   - An icon-only Button needs `label`, or it has no name and is left out.
   - Buttons that read the same are numbered ("Delete (2 of 3)"), and the agent must call
     `read_buttons` / `read_danger_buttons` to learn what each belongs to (from its row, card or
     heading) before a press is accepted. Prefer a distinct text, or a distinct
     `tool={{ description: 'Deletes the invoice of this row.' }}`.
   - A danger button nothing tells apart is left out, as an agent could only pick at random.
     Development builds warn about it.
3. **Mark what needs a person.** `color="danger"` on a Button or menu row moves it to
   `click_danger_button` / `run_consequential_command`, which carry `consequentialHint`, so the
   browser may ask the person first. `tool={{ consequential: true }}` does the same for an action
   that is serious without being red (send, pay, publish). Forms that submit are consequential by
   default; set `tool={{ consequential: false }}` only on one you would run without asking, such
   as a search.
4. **Keep out what must stay out.** `tool={false}` on a component keeps it from agents, and
   `tool: false` on a Form entry keeps that field out of the schema. Do it for:
   - buttons and rows whose text quotes user content ("Delete Ada's invoice"): a user could write
     an instruction to the model in it. Give such a Form a `tool.description` instead;
   - components whose data must not reach the model: what a table, chart, board, calendar or
     document shows can be read (marked `untrustedContentHint`);
   - an internal Button that only changes how a person looks at something (copy, zoom, scroll,
     minimize, formatting), when you build one into your own component.
5. **Put behaviour in the component's callbacks.** A tool calls the component (a Form's
   `onSubmit`, Tabs' `onValueChange`, a Button's `onclick`), never a listener you put on a
   wrapper element or a keyboard handler. Logic in those wrappers does not run for an agent.
6. **Let the refusals stand.** Disabled, read-only and hidden fields are not in a form's schema;
   a value no control could produce (a disabled option, a value past a limit) is refused with a
   catalog message; a disabled or loading Button cannot be pressed. Express a rule as one of
   those props, and the agent is held to it too.
7. **Your server still checks everything.** A tool submits with the person's session and a
   browser may not ask first.

## What an agent cannot reach

- **Behind a modal.** Only the tools of the topmost modal Dialog stay available; page tools pause
  behind any modal.
- **Fields that stay with the person.** File, voice and signature fields, a Combobox whose
  `items` is a function, and an app-defined input type registered without a `toolSchema`. The tool
  description tells the model. Password fields can be filled and are never read back.
- **Values.** A Form tool answers with a status, the names of the fields it filled and the error
  messages, never a value.
- **What is not shown.** A read tool reads what the component draws: a cell with a renderer
  reads as its text, so a masked value stays masked; a virtualized row off screen reads as empty.
- **Other sites.** `navigate` stays on the page's origin and skips links with a `target`; links
  off the site are not buttons it can press.

## Custom tools

For what no component covers, `entasis/webmcp` registers your own tool for the life of a
component. The getter is reactive; returning `null` removes the tool.

```svelte
<script lang="ts">
	import { useWebMCPTool } from 'entasis/webmcp';

	let { cart }: { cart: { items: { name: string; quantity: number }[] } } = $props();

	useWebMCPTool(() =>
		cart.items.length === 0
			? null
			: {
					name: 'read_cart',
					description: 'Reads what is in the cart.',
					annotations: { readOnlyHint: true },
					execute: () => cart.items.map(({ name, quantity }) => ({ name, quantity }))
				}
	);
</script>
```

`registerWebMCPTool(tool, options)` does the same outside a component and returns a handle with
`update` and `remove`. Chrome does not check the input against `inputSchema` before running a
tool: check it in `execute`. A Form input type from `registerFormInputs` takes a `toolSchema` (a
JSON Schema of its value) so agents can fill it in.

## Prove it with a test

The tools register on `document.modelContext`. In jsdom, install a fake one that records them,
render the interface under `<Theme webmcp>`, then call a tool as an agent would. Set up Vitest
first as [testing.md](testing.md) says.

A harness that mounts any component under the option:

```svelte nocheck
<!-- src/lib/AgentHarness.test.svelte -->
<script lang="ts">
	import type { Component } from 'svelte';
	import { Theme } from 'entasis/theme';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let { component: Inner, ...props }: { component: Component<any>; [key: string]: unknown } =
		$props();
</script>

<Theme webmcp><Inner {...props} /></Theme>
```

The test, for a `ProfileForm.svelte` that renders `<Form title="Profile" ...>` and calls its
`onSave` prop from `onSubmit`:

```ts nocheck
import { cleanup, render, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import AgentHarness from './AgentHarness.test.svelte';
import ProfileForm from './ProfileForm.svelte';

type Tool = {
	name: string;
	inputSchema: { properties: Record<string, { enum?: string[] }> };
	execute: (input: Record<string, unknown>, options: object) => Promise<Record<string, unknown>>;
};
const tools = new Map<string, Tool>();

beforeEach(() => {
	tools.clear();
	Object.defineProperty(document, 'modelContext', {
		configurable: true,
		value: {
			registerTool(tool: Tool, { signal }: { signal: AbortSignal }) {
				tools.set(tool.name, tool);
				signal.addEventListener('abort', () => tools.delete(tool.name));
				return Promise.resolve();
			}
		}
	});
});
afterEach(() => {
	cleanup();
	delete (document as { modelContext?: unknown }).modelContext;
});

const tool = async (name: string) => {
	await waitFor(() => expect(tools.has(name)).toBe(true));
	return tools.get(name)!;
};

test('an agent saves a valid profile and is refused an invalid one', async () => {
	const onSave = vi.fn();
	render(AgentHarness, { component: ProfileForm, onSave });
	const profile = await tool('profile');

	expect(await profile.execute({ name: 'Ada', email: 'not an email' }, {})).toMatchObject({
		status: 'invalid'
	});
	expect(onSave).not.toHaveBeenCalled();

	expect(await profile.execute({ name: 'Ada', email: 'ada@example.com' }, {})).toMatchObject({
		status: 'submitted'
	});
	expect(onSave).toHaveBeenCalledWith({ name: 'Ada', email: 'ada@example.com' });
});
```

Cover, for each interface: the name of every tool you expect (and that `tool={false}` removed
the ones you kept out); one success and one refusal per form; that destructive buttons appear in
`click_danger_button` (`tool.inputSchema.properties.id.enum`) and not in `click_button`.

## Try it in a real browser

jsdom proves the tools; a real browser proves the browser sees them. Chrome Canary with the
feature on:

```sh
npx @puppeteer/browsers install chrome@canary
"<printed path>" --enable-blink-features=WebMCP --user-data-dir=/tmp/webmcp-profile
```

Then, in the DevTools console of your page:
`(await document.modelContext.getTools()).map((tool) => tool.name)`. When you cannot run a
browser, say so in your report.
