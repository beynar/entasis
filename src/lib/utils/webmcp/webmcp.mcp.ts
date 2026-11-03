export const webmcpDescription = `
# WebMCP

Import from \`entasis/webmcp\`. Experimental: WebMCP is a W3C Community Group draft in a Chrome origin trial, and its API still changes.

WebMCP lets an AI agent running in the browser call tools a page declares. \`<Theme webmcp>\` turns it on for the whole interface. It is off by default and does nothing on the server or in a browser without the API.

## What becomes a tool

- Every Form. The input schema comes from \`inputs\`; the name from \`title\`, else \`form\`, with a suffix when taken; the description from \`title\` and \`description\`, else the field labels. Calling the tool fills the form in, validates it and runs \`onSubmit\`, as a user would. It answers with the status, the filled field names and the error messages, never a value; an error about a password is the catalog's generic one, and a field set to \`tool: false\` stays unnamed. Text in \`title\`, \`description\` and \`label\` reaches the model, so pass \`tool.description\` when a title quotes user content.
- Every \`ask()\` dialog while it is open: \`answer_dialog\` and \`cancel_dialog\`. Only the topmost modal Dialog's tools stay available: page tools pause behind any modal, with or without a tool of its own. A disabled \`confirm\` or \`cancel\` removes its tool.

- Every Button a person could press: \`click_button({ id })\`, and \`click_danger_button({ id })\` for \`color="danger"\` or \`tool={{ consequential: true }}\`, which carries \`consequentialHint\`. The ids and titles come from the button's text or \`label\`. Disabled, loading, hidden and nameless buttons are left out, as are a field's own buttons, links to another site and anything past the first 100 buttons; the button is checked again when pressed. \`<Button tool={false}>\` keeps one from agents.

Password fields can be filled in. File, voice and signature fields stay for the user, as does a Combobox whose \`items\` is a function, since nothing can tell an offered option from any string; the tool description says so. Disabled, read-only and hidden fields are not in the schema, and a value sent for one is ignored. A value no control could produce, such as a disabled option or one past a limit, is refused with a catalog message.

## Refining a tool

\`<Form tool={false}>\` keeps a form from agents. \`tool={{ name, title, description, consequential, exposedTo }}\` refines it; \`consequential: false\` is for a harmless form such as a search, which the browser then does not need to confirm. An entry takes \`tool: false\` or \`tool: { description, schema }\`, and \`registerFormInputs\` takes \`toolSchema\` for an app-defined type, without which the field stays for the user.

## Custom tools

\`useWebMCPTool(() => tool)\` registers a tool for the life of a component, whatever Theme says. The getter is reactive; returning \`null\` removes the tool. \`registerWebMCPTool(tool, options)\` is the same outside a component and returns a handle with \`update\` and \`remove\`. \`webmcpSupported()\` tells whether the browser has the API. Pass \`{ modal: true }\` to keep only this tool available while it is registered, \`{ modal: id }\` to join the modal Dialog with that \`id\`, and \`{ exposedTo }\` to expose it to other origins.
`;
