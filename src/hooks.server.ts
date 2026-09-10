import type { HandleServerError } from '@sveltejs/kit';
import { mcpHandler, resource, tool, prompt } from 'svelte-mcp/mcp';

import * as z from 'zod/v4';
import { sequence } from '@sveltejs/kit/hooks';
import { componentMcpRegistry } from '$lib/generated/componentMcpRegistry.js';

const components = componentMcpRegistry;

const handler = mcpHandler({
	tools: {
		components: tool(`
			svelai  is a component library for sveltekit. It provides a set of components that can be used to build web applications with a focus on configuration over markup.
			Use this tool to get the documentation for a specific component.
			You will have to know that most of the components should be imported like this: 
			import { ComponentName } from 'svelai/component-name' 
			(using kebab-case for the package name, e.g., svelai/dialog and using PascalCase for the component name, e.g., Dialog)
			
			When available in props 
			- most of the components are using the following color props : primary, secondary, success, warning, danger, info, background, foreground.
			- most of the components are using the following size props : small, normal, large.
			- most of the components are using the following variant props : solid, outline, soft, ghost, link.
			- most of the component can receive prefix and suffix props to add icons or other content with a svelte 5 snippet.
			- for composability, most component allow passing custom snippets to replace the default rendering if necessary.

			The theme is declared globally so you should'nt have to style the components manually.
			If you have to use the theme props of the component to add classname manually on the part of the component you want to style.
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
	name: 'svelai-mcp',
	version: '1.0.0'
});

export const handle = sequence(async ({ event, resolve }) => {
	return resolve(event);
}, handler.handle);

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
	if (status !== 404) {
		console.log(error);
	} else {
		console.log('error', status);
	}

	return {
		message: 'Whoops!'
	};
};
