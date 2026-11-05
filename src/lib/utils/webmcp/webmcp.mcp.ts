export const webmcpDescription = `
# WebMCP

Import from \`entasis/webmcp\`. Experimental: WebMCP is a W3C Community Group draft in a Chrome origin trial, and its API still changes.

WebMCP lets an AI agent running in the browser call tools a page declares. \`<Theme webmcp>\` turns it on for the whole interface. It is off by default and does nothing on the server or in a browser without the API.

## What becomes a tool

Nothing to set: names and descriptions come from the props a component already has. Each has a \`tool\` prop, for options or \`false\` to keep it from agents.

- Form: a tool per form. The input schema comes from \`inputs\`; the name from \`title\`, else \`form\`, with a suffix when taken; the description from \`title\` and \`description\`, else the field labels. Calling it fills the form in, validates it and runs \`onSubmit\`, as a user would. It answers with the status, the filled field names and the error messages, never a value; an error about a password is the catalog's generic one, and a field set to \`tool: false\` stays unnamed. Text in \`title\`, \`description\` and \`label\` reaches the model, so pass \`tool.description\` when a title quotes user content. MultiStepForm: the current step's Form.
- \`ask()\`, while open: \`answer_dialog\` and \`cancel_dialog\`. A disabled \`confirm\` or \`cancel\` removes its tool.
- Button: \`click_button({ id })\` for those a person could press, and \`click_danger_button({ id })\` for \`color="danger"\` or \`tool={{ consequential: true }}\`, which carries \`consequentialHint\`. Disabled, loading, hidden and nameless buttons are left out, as are links off the site, buttons a component's own tools cover (a field's, a menu trigger, a table's or a calendar's chrome), those that only change how a person looks at something (copying code, zoom, scroll to latest, minimize, text formatting) and anything past the first 100; a button is checked again when pressed. A Form's \`actions\` are left out when it has \`onSubmit\`, as its tool submits it, or \`tool={false}\`; give an action its own \`tool\` to keep it, such as a save-as-draft. Buttons that read the same are numbered ("Delete (2 of 3)"), and \`read_buttons\` or \`read_danger_buttons\` says what each belongs to, from its row, card or heading; that text is user content, so it stays out of the list and carries \`untrustedContentHint\`. A press is refused with \`read_first\` until the agent has read, and if the row changed since. A danger button nothing tells apart is left out; a distinct \`tool.description\` fixes it.
- Command, PopupMenu, MenuBar, a Sidebar row that only runs a handler: \`run_command({ id })\` and \`run_consequential_command({ id })\`. ContextMenu joins only while open, as its rows act on what was right-clicked.
- Sidebar, NavigationMenu, Breadcrumbs: \`navigate({ to })\`, limited to links on this site.
- Tabs: \`select_tab\`. Pagination: \`go_to_page\`.
- JsonEditor outside a Form: \`read_json\`, \`edit_json\`.
- DataTable: \`query_table\`, and \`move_row\` while rows can be reordered. Chart: \`read_chart_data\`. DocumentViewer: \`search_document\`, \`read_document\`. Kanban: \`read_board\`, \`move_card\`. EventCalendar: \`read_calendar\`, \`show_calendar\`, \`move_event\`. What these read carries \`untrustedContentHint\`, and is limited to what the component shows: a cell as it is drawn when its column has a renderer (a virtualized row off screen reads as empty there), the fields a chart's marks name, a card's title and description. Labels of buttons and rows reach the model as option titles, so \`tool={false}\` one that quotes user content.

Only the tools of the topmost modal Dialog stay available: page tools pause behind any modal, with or without a tool of its own.

Password fields can be filled in. File, voice and signature fields stay for the user, as does a Combobox whose \`items\` is a function, since nothing can tell an offered option from any string; the tool description says so. Disabled, read-only and hidden fields are not in the schema, and a value sent for one is ignored. A value no control could produce, such as a disabled option or one past a limit, is refused with a catalog message.

## Refining a tool

\`tool={false}\` keeps a component from agents. \`tool={{ name, title, description, consequential, exposedTo }}\` refines it (\`WebMCPToolOptions\`); \`consequential: false\` is for a harmless form such as a search, which the browser then does not need to confirm. An entry takes \`tool: false\` or \`tool: { description, schema }\`, and \`registerFormInputs\` takes \`toolSchema\` for an app-defined type, without which the field stays for the user.

## Custom tools

\`useWebMCPTool(() => tool)\` registers a tool for the life of a component, whatever Theme says. The getter is reactive; returning \`null\` removes the tool. \`registerWebMCPTool(tool, options)\` is the same outside a component and returns a handle with \`update\` and \`remove\`. \`webmcpSupported()\` tells whether the browser has the API. Pass \`{ modal: true }\` to keep only this tool available while it is registered, \`{ modal: id }\` to join the modal Dialog with that \`id\`, and \`{ exposedTo }\` to expose it to other origins.
`;
