import type { HandleServerError } from '@sveltejs/kit';
import { mcpHandler, tool } from 'svelte-mcp/mcp';

import * as z from 'zod/v4';
import { sequence } from '@sveltejs/kit/hooks';
import { componentMcpRegistry } from '$lib/generated/componentMcpRegistry.js';

const components = componentMcpRegistry;

const handler = mcpHandler({
	tools: {
		components: tool(`
			entasis is a Svelte 5 component library for SvelteKit, built on configuration over markup.
			Call this tool with a component name to get that component's documentation: import path,
			props, data model, theme parts, motion and accessibility notes.

			Conventions most components share:
			- Import from the kebab-case subpath with the PascalCase name: import { Dialog } from 'entasis/dialog'.
			  Icons are snippets: import { houseIcon } from 'entasis/icons/house'.
			- color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'. Left out,
			  a control takes the theme's default color (neutral unless the Theme sets defaultColor).
			- size: 'small' | 'normal' | 'large'; density: 'compact' | 'normal' | 'comfortable' for inner spacing.
			- variant on buttons and similar controls: 'solid' | 'outline' | 'soft' | 'ghost' | 'link'.
			- Editable state is value / defaultValue / onValueChange; disclosure is open / defaultOpen / onOpenChange.
			- prefix / suffix take a snippet (usually an icon), and most parts accept a snippet that replaces them.
			- The app is wrapped once in <Theme> from 'entasis/theme', which sets color, radius, spacing and
			  motion for everything. Restyle a part through the component's theme prop instead of ad-hoc classes.
			`)
			.input(
				z.object({
					componentName: z.enum(Object.keys(components) as [string, ...string[]])
				})
			)
			.output(z.object({ documentation: z.string() }))

			.handle(async ({ input }) => {
				const component = components[input.componentName as keyof typeof components];
				return { documentation: component };
			})
	},
	name: 'entasis-mcp',
	version: '1.0.0'
});

export const handle = sequence(async ({ event, resolve }) => {
	return resolve(event);
}, handler.handle);

export const handleError: HandleServerError = async ({ error, status }) => {
	if (status !== 404) {
		console.log(error);
	} else {
		console.log('error', status);
	}

	return {
		message: 'Whoops!'
	};
};
