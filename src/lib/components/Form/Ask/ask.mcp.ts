export const askDescription = `
# Ask

Import from \`entasis/ask\`.

Mount Ask to host programmatic requests created by ask. Requests use the existing Form inputs and validation boundary inside Dialog, including input types the app registered with registerFormInputs (see Form), so a request can arrive as plain data. AskResult reports submitted and value; cancellation preserves the current form value. Submission failures reject the request. Fields validate as in Form (validationMode and validationDebounce are accepted, async validators are awaited), disabled fields are left out of the result, and Confirm marks itself loading rather than natively disabled while the form submits, so it keeps keyboard focus. Mount the host before requesting a form. A form taller than the viewport scrolls in its own body (\`data-slot="ask-body"\`), so the title, description and buttons stay on screen; pass \`dialog: { scroll: 'outer' }\` to scroll the whole card instead.
`;
