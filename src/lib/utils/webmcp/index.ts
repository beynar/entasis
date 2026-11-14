export { useWebMCPTool } from './useWebMCPTool.svelte.js';
export { isAgentAction } from './webmcp.agent.js';
export { registerWebMCPTool, webmcpSupported, type WebMCPToolHandle } from './webmcp.registry.js';
export type {
	WebMCPJsonSchema,
	WebMCPOptions,
	WebMCPRegisterOptions,
	WebMCPTool,
	WebMCPToolAnnotations,
	WebMCPToolOptions,
	WebMCPToolProp
} from './webmcp.types.js';
