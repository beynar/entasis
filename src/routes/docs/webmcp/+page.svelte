<script lang="ts">
	import { onMount } from 'svelte';
	import { Alert } from '$lib/components/Alert/index.js';
	import { Button } from '$lib/components/Button/index.js';
	import Code from '$lib/components/Code/Code.svelte';
	import { Form } from '$lib/components/Form/Form/index.js';
	import Separator from '$lib/components/Separator/Separator.svelte';
	import { webmcpSupported } from '$lib/utils/webmcp/index.js';

	type ListedTool = { name: string; description: string };

	// The live section reads what this page really registered: the root layout turns `webmcp` on here.
	let supported = $state(false);
	let tools = $state<ListedTool[] | null>(null);
	let submitted = $state<string | null>(null);

	onMount(() => {
		supported = webmcpSupported();
	});

	const listTools = async () => {
		const context = (document as unknown as { modelContext?: { getTools?: () => unknown } })
			.modelContext;
		tools = ((await context?.getTools?.()) ?? []) as ListedTool[];
	};

	const setupCode = `<script lang="ts">
	import { Theme } from 'entasis/theme';

	let { children } = $props();
</${'script'}>

<Theme webmcp>
	{@render children()}
</Theme>`;

	const exposedToCode = `<!-- Lets a partner site's agent use the tools too. Same origin only by default. -->
<Theme webmcp={{ exposedTo: ['https://partner.example'] }}>`;

	const formCode = `<Form
	title="Newsletter"
	description="Get one email a month."
	inputs={{
		email: { type: 'email', label: 'Email', required: true },
		topic: {
			type: 'select',
			label: 'Topic',
			items: [
				{ value: 'product', label: 'Product news' },
				{ value: 'engineering', label: 'Engineering' }
			]
		}
	}}
	onSubmit={subscribe}
	actions={[{ children: 'Subscribe', onAction: (form) => form.submit() }]}
/>`;

	const toolCode = `{
	"name": "newsletter",
	"title": "Newsletter",
	"description": "Newsletter. Get one email a month. Calling this tool fills in the form on the page and submits it.",
	"inputSchema": {
		"type": "object",
		"properties": {
			"email": { "type": "string", "format": "email", "description": "Email" },
			"topic": {
				"type": "string",
				"enum": ["product", "engineering"],
				"oneOf": [
					{ "const": "product", "title": "Product news" },
					{ "const": "engineering", "title": "Engineering" }
				],
				"description": "Topic"
			}
		},
		"required": ["email"],
		"additionalProperties": false
	},
	"annotations": { "consequentialHint": true, "untrustedContentHint": true }
}`;

	const resultCode = `// newsletter({ email: 'ada@example.com' })
{ "status": "submitted", "filled": ["email"] }

// newsletter({ email: 'not an email' })
{
	"status": "invalid",
	"filled": ["email"],
	"errors": { "email": ["Enter a valid email address"] },
	"message": "Nothing was submitted. Correct these fields and call the tool again."
}`;

	const homonymsCode = `// click_danger_button lists
["Delete (1 of 3)", "Delete (2 of 3)", "Delete (3 of 3)"]

// click_danger_button({ id: 'delete_2' }), unread
{ "status": "read_first", "message": "Several options read the same. Call read_danger_buttons and pick by what it says." }

// read_danger_buttons()
{
	"options": [
		{ "id": "delete", "label": "Delete", "context": "Ada Martin" },
		{ "id": "delete_2", "label": "Delete", "context": "Bob Durand" },
		{ "id": "delete_3", "label": "Delete", "context": "Cleo Petit" }
	]
}

// click_danger_button({ id: 'delete_2' })
{ "status": "pressed", "id": "delete_2" }`;

	const refineCode = `<!-- Keep a component from agents -->
<Button tool={false} onclick={openDebugPanel}>Debug</Button>

<!-- A harmless form: the browser does not need to confirm it -->
<Form tool={{ name: 'search_orders', consequential: false }} {inputs} onSubmit={search} />

<!-- Ask the browser to confirm, and say what the model should know -->
<Button tool={{ consequential: true, description: 'Sends the invoice to the client.' }}>
	Send
</Button>`;

	const entryCode = `const inputs = {
	// Stays with the user: not in the schema, and any value sent for it is ignored.
	notes: { type: 'textarea', label: 'Private notes', tool: false },
	// A description for the model instead of the label.
	sku: { type: 'text', label: 'SKU', tool: { description: 'The code printed under the barcode.' } }
};`;

	const inputTypeCode = `registerFormInputs({
	money: {
		component: MoneyInput,
		// A JSON Schema of the value. Without it, the field stays for the user.
		toolSchema: { type: 'number', minimum: 0 }
	}
});`;

	const customCode = `<script lang="ts">
	import { useWebMCPTool } from 'entasis/webmcp';

	let { cart } = $props();

	// The getter is reactive; returning null removes the tool.
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
</${'script'}>`;

	const registerCode = `import { registerWebMCPTool, webmcpSupported } from 'entasis/webmcp';

// Outside a component. Returns a handle with update() and remove().
const handle = registerWebMCPTool(tool, { exposedTo: ['https://partner.example'] });

// { modal: true } keeps only this tool available while it is registered.
// { modal: 'invoice-dialog' } joins the modal Dialog with that id.
registerWebMCPTool(tool, { modal: 'invoice-dialog' });`;

	const launchCode = `# Prints the path of the browser it installs
npx @puppeteer/browsers install chrome@canary

"<that path>" --enable-blink-features=WebMCP --user-data-dir=/tmp/webmcp-profile`;

	const consoleCode = `// In the DevTools console of your page
const tools = await document.modelContext.getTools();
tools.map((tool) => tool.name);

const form = tools.find((tool) => tool.name === 'newsletter');
await document.modelContext.executeTool(form, { email: 'ada@example.com' });`;

	const coverage: { component: string; tools: string; note: string }[] = [
		{
			component: 'Form',
			tools: 'One per form, named from title',
			note: 'Fills in, validates and submits, as a person would.'
		},
		{
			component: 'MultiStepForm',
			tools: 'The current step’s form',
			note: 'Gone while the step’s Next or Submit button is disabled or loading.'
		},
		{
			component: 'ask()',
			tools: 'answer_dialog, cancel_dialog',
			note: 'While open. A disabled button removes its tool.'
		},
		{
			component: 'Button',
			tools: 'click_button, click_danger_button, read_buttons, read_danger_buttons',
			note: 'One tool per page, listing the buttons a person could press. color="danger" goes to the second. The read tools appear when several read the same.'
		},
		{
			component: 'Command, PopupMenu, MenuBar',
			tools: 'run_command, run_consequential_command',
			note: 'Their rows. In the second tool: menu rows with color="danger", and all of a Command with tool={{ consequential: true }}.'
		},
		{
			component: 'ContextMenu',
			tools: 'run_command',
			note: 'While open, as its rows act on what was right-clicked. tool={true} offers them at all times.'
		},
		{
			component: 'Sidebar, NavigationMenu, Breadcrumbs',
			tools: 'navigate',
			note: 'Links on this site only. Sidebar rows that only run a handler go to run_command.'
		},
		{ component: 'Tabs', tools: 'select_tab', note: 'Not a disabled tab.' },
		{ component: 'Pagination', tools: 'go_to_page', note: 'Also follows getHref.' },
		{
			component: 'DataTable',
			tools: 'query_table, move_row',
			note: 'Search, filter, sort and read the page showing. move_row while rows can be reordered.'
		},
		{ component: 'Chart', tools: 'read_chart_data', note: 'The fields its marks plot.' },
		{
			component: 'DocumentViewer',
			tools: 'search_document, read_document',
			note: 'Searching moves the viewer to the match, as it would for a person.'
		},
		{
			component: 'JsonEditor',
			tools: 'read_json, edit_json',
			note: 'Outside a Form. Held to its schema, and masked values stay hidden. A person can undo an edit.'
		},
		{
			component: 'Kanban',
			tools: 'read_board, move_card',
			note: 'Each card’s title and description. Follows the board’s own move rules.'
		},
		{
			component: 'EventCalendar',
			tools: 'read_calendar, show_calendar, move_event',
			note: 'move_event follows the rules of a drag: read-only resources and background events stay put.'
		}
	];
</script>

{#snippet ic(text: string)}<code class="bg-neutral-muted px-xs py-micro rounded-sm text-sm"
		>{text}</code
	>{/snippet}

<svelte:head>
	<title>WebMCP · Entasis</title>
</svelte:head>

<article class="text-neutral mx-auto grid max-w-3xl gap-4 pb-20">
	<header class="grid gap-2">
		<h1 class="text-3xl font-semibold">WebMCP</h1>
		<p class="text-neutral/70 text-balance">
			One option on {@render ic('<Theme>')} lets an AI agent in the browser use your interface: fill in
			a form, press a button, follow a link, read a table. Names and descriptions come from the props
			your components already have.
		</p>
	</header>

	<Alert color="warning" title="Experimental">
		<p>
			<a
				class="underline"
				href="https://webmachinelearning.github.io/webmcp/"
				target="_blank"
				rel="noreferrer">WebMCP</a
			>
			is a W3C Community Group draft, in a
			<a
				class="underline"
				href="https://developer.chrome.com/docs/ai/webmcp/imperative-api"
				target="_blank"
				rel="noreferrer">Chrome origin trial</a
			>. Its API still changes, so the tools described here may too. In other browsers the option
			does nothing.
		</p>
	</Alert>

	<Separator class="my-2" children="Turn it on" />

	<p class="text-neutral/70">
		It is off by default. Set it once at the root of your app. Nothing changes for what people see,
		nothing runs on the server, and a browser without the API never loads the components’ tool code.
	</p>
	<Code language="svelte" code={setupCode} />
	<p class="text-neutral/70">
		An agent can then do what the person using the page can do, with their session. Read
		<a class="underline" href="#before-you-ship">Before you ship</a> first.
	</p>
	<Code language="svelte" code={exposedToCode} />

	<Separator class="my-2" children="What a form becomes" />

	<p class="text-neutral/70">
		There is no tool to write. The name comes from {@render ic('title')}, or {@render ic('form')} without
		one, with a suffix when two forms would share it. The schema comes from {@render ic('inputs')}.
		This form:
	</p>
	<Code language="svelte" code={formCode} />
	<p class="text-neutral/70">gives the model this tool:</p>
	<Code language="json" code={toolCode} />
	<p class="text-neutral/70">
		Calling it runs the same validation and the same {@render ic('onSubmit')} as a person submitting the
		form. It answers with a status, the field names and the error messages, never with a value. A form
		without {@render ic('onSubmit')} is only filled in and validated, and the person acts on it.
		{@render ic('actions')} are left out when the form has {@render ic('onSubmit')}, as the tool
		already submits it. Give one its own {@render ic('tool')} to keep it, such as a save-as-draft.
	</p>
	<Code language="js" code={resultCode} />

	<Separator class="my-2" children="Try it on this page" />

	<p class="text-neutral/70">
		WebMCP is on for this page, so this form and the site’s navigation are real tools in a browser
		that has the API.
	</p>
	<div class="border-neutral-muted grid gap-4 rounded-xl border p-4">
		<Form
			title="Newsletter"
			description="Get one email a month."
			inputs={{
				email: { type: 'email', label: 'Email', required: true },
				topic: {
					type: 'select',
					label: 'Topic',
					items: [
						{ value: 'product', label: 'Product news' },
						{ value: 'engineering', label: 'Engineering' }
					]
				}
			}}
			onSubmit={(value) => {
				submitted = JSON.stringify(value);
			}}
			actions={[{ children: 'Subscribe', onAction: (form) => form.submit() }]}
		/>
		{#if submitted}
			<p class="text-neutral/70 text-sm" data-testid="webmcp-demo-submitted">
				Nothing is sent anywhere. The form received {submitted}.
			</p>
		{/if}
		<Separator />
		{#if supported}
			<div class="flex flex-wrap items-center gap-3">
				<Button variant="outline" tool={false} onclick={listTools}>List this page’s tools</Button>
				{#if tools}
					<span class="text-neutral/70 text-sm">{tools.length} registered</span>
				{/if}
			</div>
			{#if tools}
				<ul class="grid gap-2 text-sm" data-testid="webmcp-demo-tools">
					{#each tools as tool (tool.name)}
						<li>
							<span class="font-mono">{tool.name}</span>
							<span class="text-neutral/70">{tool.description}</span>
						</li>
					{/each}
				</ul>
			{/if}
		{:else}
			<p class="text-neutral/70 text-sm">
				This browser has no WebMCP, so the form above is only a form.
				<a class="underline" href="#test-it">Test it</a> tells you how to get one that does.
			</p>
		{/if}
	</div>

	<Separator class="my-2" children="What else becomes a tool" />

	<p class="text-neutral/70">
		The components that act on the page, or show data a person can read. Buttons, menus and links do
		not get a tool each: a page has one {@render ic('click_button')}, whose {@render ic('id')} lists them,
		so the model is not handed hundreds of tools.
	</p>
	<div class="border-neutral-muted overflow-x-auto rounded-xl border">
		<table class="w-full min-w-lg text-left text-sm">
			<thead class="border-neutral-muted bg-surface-raised border-b">
				<tr>
					<th class="px-4 py-2 font-medium">Component</th>
					<th class="px-4 py-2 font-medium">Tools</th>
					<th class="px-4 py-2 font-medium">Notes</th>
				</tr>
			</thead>
			<tbody class="divide-neutral-muted/60 divide-y">
				{#each coverage as row (row.component)}
					<tr>
						<td class="px-4 py-2 align-top">{row.component}</td>
						<td class="px-4 py-2 align-top font-mono text-xs">{row.tools}</td>
						<td class="text-neutral/70 px-4 py-2 align-top">{row.note}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<Separator class="my-2" children="Buttons that read the same" />

	<p class="text-neutral/70">
		A person tells three “Delete” buttons apart by their rows. An agent gets them numbered, and has
		to read what they belong to before pressing one:
	</p>
	<Code language="js" code={homonymsCode} />
	<p class="text-neutral/70">
		The text comes from around the button: its row or card, else the heading above it. It stays out
		of the {@render ic('click_button')} list because it is often written by users, and the read tool marks
		it as untrusted. A press is refused until the agent has read, and again if the row has changed since.
	</p>
	<p class="text-neutral/70">
		When nothing tells two buttons apart, a danger button is left out, as an agent could only pick
		at random, and any other stays numbered. Development builds warn about these. A distinct
		{@render ic('tool.description')} on each one fixes it.
	</p>

	<Separator class="my-2" children="What an agent can't do" />

	<p class="text-neutral/70">The tools hold an agent to what the interface holds a person to.</p>
	<ul class="text-neutral/70 grid list-disc gap-2 pl-6">
		<li>
			<strong class="text-neutral">Modals.</strong> Only the tools of the topmost modal Dialog stay available.
			Page tools pause behind any modal, with or without a tool of its own.
		</li>
		<li>
			<strong class="text-neutral">Fields.</strong> Disabled, read-only and hidden fields are not in the
			schema, and a value sent for one is ignored. A value no control could produce, such as a disabled
			option or one past a limit, is refused with a catalog message.
		</li>
		<li>
			<strong class="text-neutral">Passwords.</strong> They can be filled in and are never sent back.
			An error about one is the catalog’s generic message, as yours could quote the value.
		</li>
		<li>
			<strong class="text-neutral">What stays with the user.</strong> File, voice and signature
			fields, a Combobox whose {@render ic('items')} is a function, and an app-defined input without a
			{@render ic('toolSchema')}. The tool’s description tells the model.
		</li>
		<li>
			<strong class="text-neutral">Buttons.</strong> Disabled, loading, hidden and nameless buttons are
			left out, as are links off the site and anything past the first 100. So are the buttons inside components
			that only change how a person looks at something, such as copying code, zoom or text formatting.
			A button is checked again when pressed, and a menu row that was removed or disabled can no longer
			run.
		</li>
		<li>
			<strong class="text-neutral">Links.</strong>
			{@render ic('navigate')} stays on your origin and skips links with a {@render ic('target')}.
		</li>
		<li>
			<strong class="text-neutral">Reading.</strong> A tool reads what the component shows. A table cell
			with a renderer reads as the text it draws, so a masked value stays masked. A virtualized row off
			screen reads as empty there.
		</li>
	</ul>

	<Separator class="my-2" children="Refine a tool" />

	<p class="text-neutral/70">
		Each of these components has a {@render ic('tool')} prop. You need it only to change a default:
		{@render ic('false')} keeps the component from agents, and an object takes
		{@render ic('name')}, {@render ic('title')}, {@render ic('description')},
		{@render ic('consequential')} and {@render ic('exposedTo')}.
	</p>
	<Code language="svelte" code={refineCode} />
	<p class="text-neutral/70">
		{@render ic('consequential')} tells the browser the action is significant or hard to undo, so it may
		ask the person to confirm. It is on for forms that submit, for {@render ic('color="danger"')} buttons
		and menu rows, and for {@render ic('move_row')}, {@render ic('move_card')} and
		{@render ic('move_event')}. Set {@render ic('consequential: false')} only on a form you would run
		without asking, such as a search.
	</p>
	<p class="text-neutral/70">A form entry takes {@render ic('tool')} as well:</p>
	<Code language="ts" code={entryCode} />
	<p class="text-neutral/70">
		An app-defined input type from {@render ic('registerFormInputs')} says what an agent may send with
		{@render ic('toolSchema')}:
	</p>
	<Code language="ts" code={inputTypeCode} />

	<Separator class="my-2" children="Your own tools" />

	<p class="text-neutral/70">
		For what no component covers, import from {@render ic('entasis/webmcp')}. These register
		whatever
		{@render ic('<Theme webmcp>')} says, and do nothing in a browser without the API.
	</p>
	<Code language="svelte" code={customCode} />
	<Code language="ts" code={registerCode} />

	<div id="before-you-ship" class="scroll-mt-24">
		<Separator class="my-2" children="Before you ship" />
	</div>

	<ul class="text-neutral/70 grid list-disc gap-2 pl-6">
		<li>
			<strong class="text-neutral">Forms submit.</strong> A tool submits the form with the person’s session,
			and a browser may or may not ask first. Your server still has to check everything it would check
			for a person.
		</li>
		<li>
			<strong class="text-neutral">Text reaches the model.</strong> Titles, labels, descriptions,
			button text and menu rows all do. If one quotes user content, as in “Delete Ada’s invoice”, a
			user can write an instruction to the model in it. Pass {@render ic('tool={false}')} on those buttons
			and rows, and a {@render ic('tool.description')} on those forms.
		</li>
		<li>
			<strong class="text-neutral">Data reaches the model.</strong> What a table, chart, board,
			calendar or document shows can be read. These tools carry {@render ic(
				'untrustedContentHint'
			)}, which tells the model not to trust it. Pass {@render ic('tool={false}')} on a component whose
			data should stay out.
		</li>
	</ul>

	<div id="test-it" class="scroll-mt-24">
		<Separator class="my-2" children="Test it" />
	</div>

	<p class="text-neutral/70">
		Tested with Chrome for Testing 159 (Canary). Start it with the feature on, then call your tools
		from the console, as an agent would.
	</p>
	<Code language="bash" code={launchCode} />
	<Code language="js" code={consoleCode} />
	<p class="text-neutral/70">
		Chrome does not check the input against {@render ic('inputSchema')} before running a tool. Entasis
		does it for its own tools; do it in {@render ic('execute')} for yours.
	</p>
</article>
