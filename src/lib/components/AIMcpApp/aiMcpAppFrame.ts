import {
	PostMessageTransport,
	buildAllowAttribute
} from '@modelcontextprotocol/ext-apps/app-bridge';
import type {
	Transport,
	TransportSendOptions
} from '@modelcontextprotocol/sdk/shared/transport.js';
import type { JSONRPCMessage, MessageExtraInfo } from '@modelcontextprotocol/sdk/types.js';
import type { AIMcpAppHostConfig, AIMcpAppResource, AIMcpToolCall } from './aiMcpApp.props.js';
import type { AIMcpAppResourcePermissions } from './aiMcpProtocol.js';

export class AIMcpAppPostMessageTransport implements Transport {
	onclose?: Transport['onclose'];
	onerror?: Transport['onerror'];
	onmessage?: Transport['onmessage'];
	sessionId?: string;
	private readonly delegate: PostMessageTransport;
	private readonly onWindowMessage = (event: MessageEvent): void => {
		if (event.source !== this.targetWindow || event.origin === this.targetOrigin) return;
		event.stopImmediatePropagation();
		this.onerror?.(
			new Error(
				`MCP App sandbox origin changed from "${this.targetOrigin}" to "${event.origin || 'opaque'}".`
			)
		);
	};

	constructor(
		private readonly targetWindow: Window,
		private readonly targetOrigin: string
	) {
		this.delegate = new PostMessageTransport(targetWindow, targetWindow);
	}

	async start(): Promise<void> {
		this.delegate.onclose = () => this.onclose?.();
		this.delegate.onerror = (error: Error) => this.onerror?.(error);
		this.delegate.onmessage = <T extends JSONRPCMessage>(message: T, extra?: MessageExtraInfo) =>
			this.onmessage?.(message, extra);
		window.addEventListener('message', this.onWindowMessage);
		try {
			await this.delegate.start();
		} catch (error) {
			window.removeEventListener('message', this.onWindowMessage);
			throw error;
		}
	}

	async send(message: JSONRPCMessage, options?: TransportSendOptions): Promise<void> {
		void options;
		this.targetWindow.postMessage(message, this.targetOrigin);
	}

	async close(): Promise<void> {
		window.removeEventListener('message', this.onWindowMessage);
		await this.delegate.close();
	}

	setProtocolVersion(version: string): void {
		this.delegate.setProtocolVersion?.(version);
	}
}

export async function resolveAIMcpAppSandboxUrl(
	host: AIMcpAppHostConfig,
	resource: AIMcpAppResource,
	tool: AIMcpToolCall,
	signal: AbortSignal,
	hostOrigin: string
): Promise<URL> {
	if (resource.domain && !host.resolveSandboxUrl) {
		throw new Error(
			`MCP App resource "${resource.uri}" declares domain "${resource.domain}" and requires resolveSandboxUrl.`
		);
	}
	const value = host.resolveSandboxUrl
		? await host.resolveSandboxUrl({ resource, tool, signal })
		: host.sandboxUrl;
	throwIfAborted(signal);
	if (!value) throw new Error('MCP App host requires sandboxUrl or resolveSandboxUrl.');
	let url: URL;
	try {
		url = new URL(String(value));
	} catch (error) {
		throw new Error('MCP App sandbox URL must be absolute.', { cause: error });
	}
	if (url.protocol !== 'http:' && url.protocol !== 'https:') {
		throw new Error('MCP App sandbox URL must use HTTP or HTTPS.');
	}
	if (url.username || url.password) {
		throw new Error('MCP App sandbox URL must not contain credentials.');
	}
	if (url.origin === hostOrigin) {
		throw new Error('MCP App sandbox URL must use a different origin from the host page.');
	}
	if (resource.csp) url.searchParams.set('csp', JSON.stringify(resource.csp));
	return url;
}

export function waitForAIMcpAppSandbox(
	frame: HTMLIFrameElement,
	url: URL,
	signal: AbortSignal,
	timeout: number
): Promise<void> {
	return new Promise((resolve, reject) => {
		let timeoutId = 0;
		const cleanup = () => {
			window.clearTimeout(timeoutId);
			window.removeEventListener('message', onMessage);
			frame.removeEventListener('error', onFrameError);
			signal.removeEventListener('abort', onAbort);
		};
		const rejectWith = (error: Error) => {
			cleanup();
			reject(error);
		};
		const onTimeout = () =>
			rejectWith(new Error(`MCP App sandbox at "${url.origin}" did not become ready in time.`));
		const onAbort = () =>
			rejectWith(new DOMException('MCP App initialization aborted.', 'AbortError'));
		const onFrameError = () =>
			rejectWith(new Error(`MCP App sandbox navigation to "${url.href}" failed.`));
		const onMessage = (event: MessageEvent) => {
			if (
				event.source !== frame.contentWindow ||
				event.origin !== url.origin ||
				event.data?.jsonrpc !== '2.0' ||
				event.data?.method !== 'ui/notifications/sandbox-proxy-ready'
			)
				return;
			cleanup();
			resolve();
		};
		if (signal.aborted) {
			onAbort();
			return;
		}
		window.addEventListener('message', onMessage);
		frame.addEventListener('error', onFrameError, { once: true });
		signal.addEventListener('abort', onAbort, { once: true });
		timeoutId = window.setTimeout(onTimeout, Math.max(1, timeout));
		frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
		frame.referrerPolicy = 'origin';
		try {
			frame.src = url.href;
		} catch (error) {
			rejectWith(
				new Error(`MCP App sandbox navigation to "${url.href}" failed.`, { cause: error })
			);
		}
	});
}

export function setAIMcpAppFramePermissions(
	frame: HTMLIFrameElement,
	permissions: AIMcpAppResourcePermissions | undefined
): void {
	const allow = buildAllowAttribute(permissions);
	if (allow) frame.setAttribute('allow', allow);
	else frame.removeAttribute('allow');
}

function throwIfAborted(signal: AbortSignal): void {
	if (signal.aborted) throw new DOMException('MCP App initialization aborted.', 'AbortError');
}
