// The docs site's Markdown for agents: `/llms.txt` and `/components/<id>.md`. The text comes from
// the MCP registry the `/mcp` endpoint serves, formatted by the same module that writes the
// packed `docs/` folder, so the site, the package and the MCP server agree.
import { error } from '@sveltejs/kit';
import { componentInventory } from '$lib/generated/componentContract.js';
import { componentMcpRegistry } from '$lib/generated/componentMcpRegistry.js';
import {
	agentPages,
	componentMarkdown,
	llmsIndex
} from '../../tooling/component-contract/llms.mjs';

const descriptions: Record<string, string> = componentMcpRegistry;
const describe = (id: string) => (Object.hasOwn(descriptions, id) ? descriptions[id] : undefined);
const pages = new Map(
	agentPages(componentInventory, (id) => describe(id) !== undefined).map((page) => [page.id, page])
);
const headers = (type: string) => ({
	'content-type': `${type}; charset=utf-8`,
	'cache-control': 'public, max-age=3600'
});

export function llmsTxtResponse(origin: string) {
	return new Response(
		llmsIndex({
			inventory: componentInventory,
			describe,
			base: `${origin}/`,
			footer: `The agent skill (how to build, make agent-ready and test an interface with entasis) ships in the package at \`node_modules/entasis/skills/entasis/SKILL.md\`, with these pages in \`node_modules/entasis/docs/\` for the installed version. The MCP server is ${origin}/mcp.`
		}),
		{ headers: headers('text/plain') }
	);
}

export function componentMarkdownResponse(id: string, origin: string) {
	const page = pages.get(id);
	const description = describe(id);
	if (!page || description === undefined) error(404, `No Markdown documentation for ${id}`);
	return new Response(
		componentMarkdown({ page, description, inventory: componentInventory, base: origin }),
		{ headers: headers('text/markdown') }
	);
}
