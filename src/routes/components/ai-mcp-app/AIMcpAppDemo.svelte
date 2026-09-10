<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { SvelteURL } from 'svelte/reactivity';
	import { env } from '$env/dynamic/public';
	import {
		EXTENSION_ID,
		registerAppResource,
		registerAppTool,
		RESOURCE_MIME_TYPE
	} from '@modelcontextprotocol/ext-apps/server';
	import { Client } from '@modelcontextprotocol/sdk/client/index.js';
	import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
	import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
	import { CallToolResultSchema, type CallToolResult } from '@modelcontextprotocol/sdk/types.js';
	import { z } from 'zod';
	import Alert from '$lib/components/Alert/Alert.svelte';
	import AIMcpApp from '$lib/components/AIMcpApp/AIMcpApp.svelte';
	import type {
		AIMcpAppHostConfig,
		AIMcpToolCall
	} from '$lib/components/AIMcpApp/aiMcpApp.props.js';
	import Skeleton from '$lib/components/Skeleton/Skeleton.svelte';
	import { createMcpDemoAppHtml } from './mcpDemoAppHtml.js';
	import mcpDemoViewUrl from './mcpDemoView.js?worker&url';

	type HostTheme = 'system' | 'light' | 'dark';
	type ToolState = 'complete' | 'streaming' | 'cancelled' | 'error';
	type DemoEvent = { id: number; label: string };

	let {
		hostTheme = 'system',
		toolState = 'complete'
	}: { hostTheme?: HostTheme; toolState?: ToolState } = $props();

	const resourceUri = 'ui://svelai/launch-readiness.html';
	let baseHost = $state<AIMcpAppHostConfig>();
	let toolResult = $state<CallToolResult>();
	let setupError = $state<unknown>();
	let events = $state<DemoEvent[]>([]);
	let eventId = 0;
	let client: Client | undefined;
	let server: McpServer | undefined;
	const host = $derived(
		baseHost
			? {
					...baseHost,
					hostContext: {
						availableDisplayModes: ['inline', 'fullscreen'] as const,
						...(hostTheme === 'system' ? {} : { theme: hostTheme })
					}
				}
			: undefined
	);
	const tool = $derived(toolResult ? createToolCall(toolResult, toolState) : undefined);

	onMount(() => {
		void setupDemo();
	});
	onDestroy(() => {
		void closeDemo().catch((error) => {
			window.reportError(new Error('Failed to close MCP App demo.', { cause: error }));
		});
	});

	async function setupDemo(): Promise<void> {
		try {
			const sandboxUrl = resolveSandboxUrl();
			const nextServer = createServer();
			const nextClient = new Client(
				{ name: 'Svelai docs host', version: '1.0.0' },
				{
					capabilities: {
						extensions: {
							[EXTENSION_ID]: { mimeTypes: [RESOURCE_MIME_TYPE] }
						}
					}
				}
			);
			client = nextClient;
			server = nextServer;
			const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
			await Promise.all([nextServer.connect(serverTransport), nextClient.connect(clientTransport)]);
			const result = CallToolResultSchema.parse(
				await nextClient.callTool({
					name: 'show-launch-readiness',
					arguments: { release: 'Svelai AI components' }
				})
			);
			baseHost = {
				client: nextClient,
				hostInfo: { name: 'Svelai documentation', version: '1.0.0' },
				sandboxUrl,
				permissionPolicy: { allowedPermissions: [] },
				appToolPolicy: { allowedTools: ['record-demo-action'] },
				modelContextModalities: { structuredContent: {} },
				onMessage: ({ params }) => {
					recordEvent(`Message: ${params.content.length} content block`);
					return {};
				},
				onModelContext: ({ params }) => {
					recordEvent(
						params.structuredContent
							? 'Model context: structured content received'
							: 'Model context updated'
					);
				},
				onAppToolCall: async ({ params, extra }) => {
					recordEvent(`Tool call: ${params.name}`);
					return CallToolResultSchema.parse(
						await nextClient.callTool(params, CallToolResultSchema, { signal: extra.signal })
					);
				},
				onOpenLink: ({ params }) => {
					recordEvent(`Link request: ${new URL(params.url).hostname}`);
					return {};
				},
				onDownloadFile: ({ params }) => {
					recordEvent(`Download request: ${params.contents.length} file`);
					return {};
				},
				onLog: ({ params }) => recordEvent(`Log: ${params.level}`),
				onDisplayMode: ({ params }) => {
					recordEvent(`Display request: ${params.mode} denied`);
					return { mode: 'inline' };
				},
				onClosed: () => recordEvent('App closed gracefully'),
				onError: (error) => recordEvent(`Error: ${displayError(error)}`)
			};
			toolResult = result;
		} catch (error) {
			setupError = error;
		}
	}

	function createServer(): McpServer {
		const nextServer = new McpServer({ name: 'Svelai AI demo server', version: '1.0.0' });
		registerAppTool(
			nextServer,
			'show-launch-readiness',
			{
				title: 'Show launch readiness',
				description: 'Returns release-readiness checks.',
				inputSchema: { release: z.string() },
				outputSchema: z.object({ completed: z.array(z.string()), total: z.number() }),
				_meta: { ui: { resourceUri } }
			},
			async (): Promise<CallToolResult> => ({
				content: [{ type: 'text', text: 'Three of four release checks are complete.' }],
				structuredContent: {
					completed: ['Public exports', 'Documentation routes', 'Theme contracts'],
					total: 4
				}
			})
		);
		registerAppTool(
			nextServer,
			'record-demo-action',
			{
				title: 'Record demo action',
				description: 'Records an app-originated action in the live demo.',
				inputSchema: { action: z.string() },
				_meta: { ui: { resourceUri, visibility: ['app'] } }
			},
			async ({ action }): Promise<CallToolResult> => ({
				content: [{ type: 'text', text: action }]
			})
		);
		registerAppResource(
			nextServer,
			'Launch readiness view',
			resourceUri,
			{
				mimeType: RESOURCE_MIME_TYPE,
				_meta: { ui: { prefersBorder: true } }
			},
			async () => ({
				contents: [
					{
						uri: resourceUri,
						mimeType: RESOURCE_MIME_TYPE,
						text: createMcpDemoAppHtml(mcpDemoViewUrl),
						_meta: { ui: { prefersBorder: true } }
					}
				]
			})
		);
		return nextServer;
	}

	function createToolCall(result: CallToolResult, state: ToolState): AIMcpToolCall {
		const base = {
			id: `mcp-demo-${state}`,
			name: 'show-launch-readiness',
			title: 'Show launch readiness',
			input: { release: state === 'streaming' ? 'Svelai AI comp' : 'Svelai AI components' },
			_meta: { ui: { resourceUri } }
		} satisfies AIMcpToolCall;
		if (state === 'streaming') return { ...base, status: 'streaming' };
		if (state === 'cancelled') {
			return { ...base, status: 'cancelled', error: 'Cancelled from the documentation control.' };
		}
		if (state === 'error') {
			return {
				...base,
				status: 'error',
				result: {
					content: [{ type: 'text', text: 'The final release check failed.' }],
					isError: true
				}
			};
		}
		return { ...base, status: result.isError ? 'error' : 'success', result };
	}

	function recordEvent(label: string): void {
		events = [{ id: ++eventId, label }, ...events].slice(0, 4);
	}

	function resolveSandboxUrl(): string {
		const configuredUrl = env.PUBLIC_MCP_APP_SANDBOX_URL;
		if (configuredUrl) return configuredUrl;
		const currentUrl = new SvelteURL(window.location.href);
		if (currentUrl.hostname !== 'localhost' && currentUrl.hostname !== '127.0.0.1') {
			throw new Error('PUBLIC_MCP_APP_SANDBOX_URL is required outside local development.');
		}
		currentUrl.hostname = currentUrl.hostname === 'localhost' ? '127.0.0.1' : 'localhost';
		currentUrl.pathname = '/components/ai-mcp-app/sandbox';
		currentUrl.search = '';
		currentUrl.hash = '';
		return currentUrl.href;
	}

	async function closeDemo(): Promise<void> {
		const operations: Promise<void>[] = [];
		if (client) operations.push(client.close());
		if (server) operations.push(server.close());
		await Promise.all(operations);
	}

	function displayError(error: unknown): string {
		return error instanceof Error && error.message
			? error.message
			: 'Unable to start the MCP App demo.';
	}
</script>

{#if setupError}
	<Alert
		color="danger"
		variant="soft"
		title="MCP demo unavailable"
		description={displayError(setupError)}
	/>
{:else if host && tool}
	<div class="grid w-full gap-3">
		<AIMcpApp {host} {tool} aria-label="Launch readiness MCP App" data-host-theme={hostTheme} />
		{#if events.length > 0}
			<ul class="grid gap-1 text-xs text-neutral/70" aria-live="polite">
				{#each events as event (event.id)}
					<li>{event.label}</li>
				{/each}
			</ul>
		{/if}
	</div>
{:else}
	<Skeleton class="h-48 w-full" />
{/if}
