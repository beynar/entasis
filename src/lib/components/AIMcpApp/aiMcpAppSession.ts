import { AppBridge } from '@modelcontextprotocol/ext-apps/app-bridge';
import { listAuthorizedAIMcpAppTools } from './aiMcpAppPolicy.js';
import type { AIMcpAppHostConfig, AIMcpAppResource, AIMcpToolCall } from './aiMcpApp.props.js';
import type {
	AIMcpAppContentModalities,
	AIMcpAppDisplayModeResult,
	AIMcpAppHostCapabilities,
	AIMcpAppHostContext,
	AIMcpAppResourcePermissions
} from './aiMcpProtocol.js';
import { createAIMcpCallToolResult } from './aiMcpResource.js';

export type AIMcpAppPayloadCloner = <T>(value: T, label: string) => T;

export type AIMcpAppSession = {
	key: string;
	bridge: AppBridge;
	controller: AbortController;
	frame: HTMLIFrameElement;
	host: AIMcpAppHostConfig;
	hostClient: AIMcpAppHostConfig['client'];
	resourceResolver: AIMcpAppHostConfig['resolveResource'];
	sandboxResolver: AIMcpAppHostConfig['resolveSandboxUrl'];
	tool: AIMcpToolCall;
	resource: AIMcpAppResource;
	approvedPermissions?: AIMcpAppResourcePermissions;
	allowedAppTools: readonly string[];
	initialized: boolean;
	inputSent: boolean;
	outcomeSent: boolean;
	closed: boolean;
	resizeObserver?: ResizeObserver;
	themeObserver?: MutationObserver;
	notificationQueue: Promise<void>;
	currentHostContext: AIMcpAppHostContext;
	clonePayload: AIMcpAppPayloadCloner;
};

type AIMcpAppSessionEvents = {
	onHeightChange: (height: number) => void;
	onCloseRequest: () => void;
	onFailure: (error: Error) => void;
};

type CreateAIMcpAppSessionOptions = {
	key: string;
	controller: AbortController;
	frame: HTMLIFrameElement;
	host: AIMcpAppHostConfig;
	tool: AIMcpToolCall;
	resource: AIMcpAppResource;
	approvedPermissions: AIMcpAppResourcePermissions | undefined;
	allowedAppTools: readonly string[];
	hostContext: AIMcpAppHostContext;
	clonePayload: AIMcpAppPayloadCloner;
	events: AIMcpAppSessionEvents;
};

export function createAIMcpAppSession(options: CreateAIMcpAppSessionOptions): AIMcpAppSession {
	const bridge = new AppBridge(
		null,
		options.clonePayload(options.host.hostInfo, 'hostInfo'),
		options.clonePayload(
			createHostCapabilities(
				options.host,
				options.resource,
				options.approvedPermissions,
				options.allowedAppTools
			),
			'hostCapabilities'
		),
		{ hostContext: options.clonePayload(options.hostContext, 'hostContext') }
	);
	const session: AIMcpAppSession = {
		key: options.key,
		bridge,
		controller: options.controller,
		frame: options.frame,
		host: options.host,
		hostClient: options.host.client,
		resourceResolver: options.host.resolveResource,
		sandboxResolver: options.host.resolveSandboxUrl,
		tool: options.tool,
		resource: options.resource,
		approvedPermissions: options.approvedPermissions,
		allowedAppTools: options.allowedAppTools,
		initialized: false,
		inputSent: false,
		outcomeSent: false,
		closed: false,
		notificationQueue: Promise.resolve(),
		currentHostContext: options.hostContext,
		clonePayload: options.clonePayload
	};
	registerBridgeHandlers(session);
	registerBridgeEvents(session, options.events);
	return session;
}

export async function updateAIMcpAppHostContext(
	session: AIMcpAppSession,
	update: Partial<AIMcpAppHostContext>
): Promise<void> {
	if (session.closed) return;
	session.currentHostContext = session.clonePayload(
		{ ...session.currentHostContext, ...update },
		'hostContext'
	);
	if (!session.initialized) return;
	const hostContext = session.currentHostContext;
	const operation = session.notificationQueue.then(() => {
		if (!session.closed) session.bridge.setHostContext(hostContext);
	});
	session.notificationQueue = operation;
	await operation;
}

export function sendAIMcpAppToolNotifications(session: AIMcpAppSession): Promise<void> {
	const tool = session.tool;
	const operation = session.notificationQueue.then(async () => {
		if (!session.initialized || session.closed) return;
		if (!session.inputSent) {
			if (tool.input !== undefined && !isRecord(tool.input)) {
				throw new Error('MCP App tool input must be an object.');
			}
			if (tool.status === 'streaming') {
				if (tool.input !== undefined) {
					await session.bridge.sendToolInputPartial({
						arguments: session.clonePayload(tool.input, 'partial tool input')
					});
				}
				return;
			}
			if (tool.input === undefined && (tool.status === 'pending' || tool.status === 'loading')) {
				return;
			}
			await session.bridge.sendToolInput({
				arguments: session.clonePayload(tool.input, 'tool input')
			});
			session.inputSent = true;
		}
		if (session.outcomeSent || session.closed) return;
		if (tool.status === 'cancelled') {
			await session.bridge.sendToolCancelled({ reason: errorReason(tool.error) });
			session.outcomeSent = true;
			return;
		}
		const result = createAIMcpCallToolResult(tool);
		if (!result) return;
		await session.bridge.sendToolResult(session.clonePayload(result, 'tool result'));
		session.outcomeSent = true;
	});
	session.notificationQueue = operation;
	return operation;
}

export function waitForAIMcpAppBridgeInitialization(
	bridge: AppBridge,
	signal: AbortSignal,
	timeout: number
): Promise<void> {
	return new Promise((resolve, reject) => {
		let timeoutId = 0;
		const previousHandler = bridge.oninitialized;
		const cleanup = () => {
			window.clearTimeout(timeoutId);
			bridge.oninitialized = previousHandler;
			signal.removeEventListener('abort', onAbort);
		};
		const onInitialized = (params: Record<string, never> | undefined) => {
			cleanup();
			try {
				previousHandler?.(params);
			} catch (error) {
				reject(error);
				return;
			}
			resolve();
		};
		const onTimeout = () => {
			cleanup();
			reject(new Error('MCP App view did not initialize in time.'));
		};
		const onAbort = () => {
			cleanup();
			reject(new DOMException('MCP App initialization aborted.', 'AbortError'));
		};
		if (signal.aborted) {
			onAbort();
			return;
		}
		bridge.oninitialized = onInitialized;
		signal.addEventListener('abort', onAbort, { once: true });
		timeoutId = window.setTimeout(onTimeout, Math.max(1, timeout));
	});
}

export async function teardownAIMcpAppSession(
	session: AIMcpAppSession
): Promise<unknown | undefined> {
	if (session.closed) return undefined;
	session.closed = true;
	session.controller.abort();
	session.resizeObserver?.disconnect();
	session.themeObserver?.disconnect();
	const errors: unknown[] = [];
	try {
		await session.notificationQueue;
	} catch (error) {
		errors.push(error);
	}
	try {
		if (session.initialized) await session.bridge.teardownResource({}, { timeout: 1_500 });
	} catch (error) {
		errors.push(error);
	}
	try {
		await closeBridge(session.bridge);
	} catch (error) {
		errors.push(error);
	}
	try {
		session.frame.removeAttribute('src');
		session.frame.removeAttribute('allow');
	} catch (error) {
		errors.push(error);
	}
	if (errors.length === 0) return undefined;
	return errors.length === 1 ? errors[0] : new AggregateError(errors, 'MCP App teardown failed.');
}

function registerBridgeHandlers(session: AIMcpAppSession): void {
	const { bridge } = session;
	if (session.host.onMessage) {
		bridge.onmessage = async (params, extra) => {
			const handler = session.host.onMessage;
			if (!handler) throw new Error('MCP App message handling is no longer available.');
			const safeParams = session.clonePayload(params, 'message params');
			assertSupportedContent(
				safeParams.content,
				undefined,
				session.host.messageModalities ?? { text: {} },
				'message'
			);
			return session.clonePayload(
				await handler({ params: safeParams, tool: session.tool, extra }),
				'message result'
			);
		};
	}
	if (session.host.onOpenLink) {
		bridge.onopenlink = async (params, extra) => {
			const handler = session.host.onOpenLink;
			if (!handler) throw new Error('MCP App link handling is no longer available.');
			return session.clonePayload(
				await handler({
					params: session.clonePayload(params, 'open-link params'),
					tool: session.tool,
					extra
				}),
				'open-link result'
			);
		};
	}
	if (session.host.onDownloadFile) {
		bridge.ondownloadfile = async (params, extra) => {
			const handler = session.host.onDownloadFile;
			if (!handler) throw new Error('MCP App download handling is no longer available.');
			return session.clonePayload(
				await handler({
					params: session.clonePayload(params, 'download params'),
					tool: session.tool,
					extra
				}),
				'download result'
			);
		};
	}
	if (session.host.onModelContext) {
		bridge.onupdatemodelcontext = async (params, extra) => {
			const handler = session.host.onModelContext;
			if (!handler) throw new Error('MCP App model-context handling is no longer available.');
			const safeParams = session.clonePayload(params, 'model-context params');
			assertSupportedContent(
				safeParams.content,
				safeParams.structuredContent,
				session.host.modelContextModalities ?? { text: {} },
				'model context'
			);
			await handler({ params: safeParams, tool: session.tool, extra });
			return {};
		};
	}
	if (session.host.onLog) {
		bridge.onloggingmessage = (params) => {
			const handler = session.host.onLog;
			if (!handler) throw new Error('MCP App logging is no longer available.');
			handler({ params: session.clonePayload(params, 'logging params'), tool: session.tool });
		};
	}
	if (session.allowedAppTools.length > 0) {
		bridge.oncalltool = async (params, extra) => {
			const safeParams = session.clonePayload(params, 'tool call params');
			const tools = await listAuthorizedAIMcpAppTools(
				session.host.client,
				session.allowedAppTools,
				extra.signal
			);
			if (!tools.some((candidate) => candidate.name === safeParams.name)) {
				throw new Error(`MCP App tool "${safeParams.name}" is not app-visible or host-authorized.`);
			}
			const handler = session.host.onAppToolCall;
			if (!handler) throw new Error('MCP App tool calls are disabled by host policy.');
			return session.clonePayload(
				await handler({ params: safeParams, tool: session.tool, extra }),
				'tool call result'
			);
		};
	}
}

function registerBridgeEvents(session: AIMcpAppSession, events: AIMcpAppSessionEvents): void {
	const { bridge } = session;
	bridge.onsizechange = ({ height }) => {
		if (height !== undefined) events.onHeightChange(height);
	};
	bridge.onrequestteardown = events.onCloseRequest;
	if (session.host.onDisplayMode) {
		bridge.onrequestdisplaymode = async (params, extra) => {
			const handler = session.host.onDisplayMode;
			if (!handler) throw new Error('MCP App display-mode handling is no longer available.');
			const safeParams = session.clonePayload(params, 'display-mode params');
			const currentMode = getCurrentDisplayMode(session);
			if (!isDisplayModeAvailable(session, safeParams.mode)) return { mode: currentMode };
			const result = await handler({ params: safeParams, tool: session.tool, extra });
			assertDisplayModeResult(session, result);
			await updateAIMcpAppHostContext(session, { displayMode: result.mode });
			return session.clonePayload(result, 'display-mode result');
		};
	}
	(bridge as AppBridge & { onerror?: (error: Error) => void }).onerror = events.onFailure;
}

function createHostCapabilities(
	host: AIMcpAppHostConfig,
	resource: AIMcpAppResource,
	approvedPermissions: AIMcpAppResourcePermissions | undefined,
	allowedAppTools: readonly string[]
): AIMcpAppHostCapabilities {
	return {
		serverTools: allowedAppTools.length > 0 ? {} : undefined,
		openLinks: host.onOpenLink ? {} : undefined,
		downloadFile: host.onDownloadFile ? {} : undefined,
		logging: host.onLog ? {} : undefined,
		message: host.onMessage ? (host.messageModalities ?? { text: {} }) : undefined,
		updateModelContext: host.onModelContext
			? (host.modelContextModalities ?? { text: {} })
			: undefined,
		sandbox: { csp: resource.csp, permissions: approvedPermissions }
	};
}

function assertSupportedContent(
	content: readonly { type: string }[] | undefined,
	structuredContent: unknown,
	modalities: AIMcpAppContentModalities,
	label: string
): void {
	for (const block of content ?? []) {
		const modality = getContentModality(block.type);
		if (modalities[modality] === undefined) {
			throw new Error(`MCP App ${label} contains unsupported ${modality} content.`);
		}
	}
	if (structuredContent !== undefined && modalities.structuredContent === undefined) {
		throw new Error(`MCP App ${label} contains unsupported structured content.`);
	}
}

function getContentModality(
	type: string
): 'text' | 'image' | 'audio' | 'resource' | 'resourceLink' {
	switch (type) {
		case 'text':
		case 'image':
		case 'audio':
		case 'resource':
			return type;
		case 'resource_link':
			return 'resourceLink';
		default:
			throw new Error(`MCP App content block type "${type}" is unsupported.`);
	}
}

function assertDisplayModeResult(
	session: AIMcpAppSession,
	result: AIMcpAppDisplayModeResult
): void {
	if (!isDisplayMode(result.mode) || !isDisplayModeAvailable(session, result.mode)) {
		throw new Error(
			`MCP App display-mode handler returned unavailable mode "${String(result.mode)}".`
		);
	}
}

function getCurrentDisplayMode(session: AIMcpAppSession): 'inline' | 'fullscreen' | 'pip' {
	const mode = session.currentHostContext.displayMode;
	return isDisplayMode(mode) ? mode : 'inline';
}

function isDisplayModeAvailable(
	session: AIMcpAppSession,
	mode: 'inline' | 'fullscreen' | 'pip'
): boolean {
	const hostModes = session.currentHostContext.availableDisplayModes ?? ['inline'];
	const appModes = session.bridge.getAppCapabilities()?.availableDisplayModes ?? ['inline'];
	return hostModes.includes(mode) && appModes.includes(mode);
}

function isDisplayMode(value: unknown): value is 'inline' | 'fullscreen' | 'pip' {
	return value === 'inline' || value === 'fullscreen' || value === 'pip';
}

function closeBridge(bridge: AppBridge): Promise<void> {
	// ext-apps 1.7.4 omits inherited Protocol methods from the AppBridge declaration.
	return (bridge as AppBridge & { close: () => Promise<void> }).close();
}

function errorReason(error: unknown): string | undefined {
	if (error === undefined) return undefined;
	return error instanceof Error ? error.message : String(error);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
