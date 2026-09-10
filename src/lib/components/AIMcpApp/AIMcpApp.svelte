<script lang="ts">
	import { untrack } from 'svelte';
	import Alert from '../Alert/Alert.svelte';
	import Empty from '../Empty/Empty.svelte';
	import Skeleton from '../Skeleton/Skeleton.svelte';
	import Slot from '../Slot/Slot.svelte';
	import { approveAIMcpAppPermissions, validateAIMcpAppToolPolicy } from './aiMcpAppPolicy.js';
	import {
		AIMcpAppPostMessageTransport,
		resolveAIMcpAppSandboxUrl,
		setAIMcpAppFramePermissions,
		waitForAIMcpAppSandbox
	} from './aiMcpAppFrame.js';
	import { createAIMcpHostSessionKey, createAIMcpToolSessionKey } from './aiMcpAppIdentity.js';
	import type {
		AIMcpAppHostConfig,
		AIMcpAppProps,
		AIMcpAppResource,
		AIMcpAppState,
		AIMcpAppStatus,
		AIMcpToolCall
	} from './aiMcpApp.props.js';
	import { useAIMcpAppTheme } from './aiMcpApp.theme.js';
	import type { AIMcpAppHostContext } from './aiMcpProtocol.js';
	import {
		createAIMcpAppSession,
		sendAIMcpAppToolNotifications,
		teardownAIMcpAppSession,
		updateAIMcpAppHostContext,
		waitForAIMcpAppBridgeInitialization,
		type AIMcpAppSession
	} from './aiMcpAppSession.js';
	import {
		getAIMcpAppResourceUri,
		resolveAIMcpAppResource,
		validateAIMcpAppResource
	} from './aiMcpResource.js';

	let {
		ref = $bindable(),
		iframeRef = $bindable(),
		tool,
		host,
		minHeight = 128,
		maxHeight = 800,
		initializationTimeout = 15_000,
		children,
		loading,
		error: errorSlot,
		closed,
		class: className,
		theme,
		...attachments
	}: AIMcpAppProps = $props();

	let status = $state<AIMcpAppStatus>('loading-resource');
	let resourceUri = $state<string>();
	let resource = $state<AIMcpAppResource>();
	let lifecycleError = $state<unknown>();
	let iframeHeight = $state(128);
	let session = $state.raw<AIMcpAppSession>();
	let lifecycleQueue = Promise.resolve();

	const appState = $derived<AIMcpAppState>({
		status,
		resourceUri,
		error: lifecycleError,
		resource
	});
	const boundedMinHeight = $derived(Math.max(64, minHeight));
	const boundedMaxHeight = $derived(Math.max(boundedMinHeight, maxHeight));
	const isLoading = $derived(
		status === 'loading-resource' || status === 'loading-sandbox' || status === 'initializing'
	);
	const classes = $derived(useAIMcpAppTheme(theme));
	const toolSessionKey = $derived(createAIMcpToolSessionKey(tool));
	const hostSessionKey = $derived(createAIMcpHostSessionKey(host));
	const sessionClient = $derived(host.client);
	const sessionResourceResolver = $derived(host.resolveResource);
	const sessionSandboxResolver = $derived(host.resolveSandboxUrl);

	$effect(() => {
		const frame = iframeRef;
		const key = `${toolSessionKey}\u0000${hostSessionKey}`;
		const client = sessionClient;
		const resourceResolver = sessionResourceResolver;
		const sandboxResolver = sessionSandboxResolver;
		if (!frame) return;

		const controller = new AbortController();
		const currentTool = untrack(() => tool);
		const currentHost: AIMcpAppHostConfig = {
			...untrack(() => host),
			client,
			resolveResource: resourceResolver,
			resolveSandboxUrl: sandboxResolver
		};
		enqueueLifecycle(async () => {
			if (controller.signal.aborted) return;
			await initialize(frame, key, currentTool, currentHost, controller);
		});

		return () => {
			controller.abort();
			enqueueLifecycle(() => disposeSession(controller));
		};
	});

	$effect(() => {
		const currentTool = tool;
		const currentHost = host;
		const currentSession = session;
		const minimumHeight = boundedMinHeight;
		const maximumHeight = boundedMaxHeight;
		if (!currentSession || currentSession.closed) return;
		if (!isCurrentSessionSource(currentSession, currentTool, currentHost)) return;

		currentSession.tool = currentTool;
		currentSession.host = currentHost;
		iframeHeight = clamp(iframeHeight, minimumHeight, maximumHeight);
		if (currentSession.initialized) {
			void updateAIMcpAppHostContext(
				currentSession,
				createHostContext(currentHost, currentSession.frame)
			)
				.then(() => sendAIMcpAppToolNotifications(currentSession))
				.catch((error) => {
					enqueueLifecycle(() => failSession(currentSession, error));
				});
		} else {
			void updateAIMcpAppHostContext(
				currentSession,
				createHostContext(currentHost, currentSession.frame)
			).catch((error) => {
				enqueueLifecycle(() => failSession(currentSession, error));
			});
		}
	});

	function enqueueLifecycle(operation: () => Promise<void>): void {
		const pendingOperation = lifecycleQueue.then(operation);
		lifecycleQueue = pendingOperation.catch((error) => {
			lifecycleError = error;
			status = 'error';
		});
	}

	async function initialize(
		frame: HTMLIFrameElement,
		key: string,
		currentTool: AIMcpToolCall,
		currentHost: AIMcpAppHostConfig,
		controller: AbortController
	): Promise<void> {
		status = 'loading-resource';
		resource = undefined;
		resourceUri = undefined;
		lifecycleError = undefined;
		let createdSession: AIMcpAppSession | undefined;
		try {
			const allowedAppTools = validateAIMcpAppToolPolicy(currentHost);
			const uri = getAIMcpAppResourceUri(currentTool);
			if (!uri) throw new Error('Tool call does not declare an MCP App resource URI.');
			resourceUri = uri;
			const resolvedResource = validateAIMcpAppResource(
				uri,
				currentHost.resolveResource
					? await currentHost.resolveResource({
							uri,
							client: currentHost.client,
							tool: currentTool,
							signal: controller.signal
						})
					: await resolveAIMcpAppResource(currentHost.client, uri, controller.signal)
			);
			throwIfAborted(controller.signal);
			const approvedPermissions = approveAIMcpAppPermissions(
				resolvedResource.permissions,
				currentHost.permissionPolicy
			);
			resource = resolvedResource;
			iframeHeight = boundedMinHeight;
			setAIMcpAppFramePermissions(frame, approvedPermissions);

			const sandboxUrl = await resolveAIMcpAppSandboxUrl(
				currentHost,
				resolvedResource,
				currentTool,
				controller.signal,
				window.location.origin
			);
			throwIfAborted(controller.signal);
			const hostContext = cloneBridgePayload(createHostContext(currentHost, frame), 'hostContext');
			let nextSession: AIMcpAppSession;
			nextSession = createAIMcpAppSession({
				key,
				controller,
				frame,
				host: currentHost,
				tool: currentTool,
				resource: resolvedResource,
				approvedPermissions,
				allowedAppTools,
				hostContext,
				clonePayload: cloneBridgePayload,
				events: {
					onHeightChange: (height) => {
						iframeHeight = clamp(height, boundedMinHeight, boundedMaxHeight);
					},
					onCloseRequest: () => enqueueLifecycle(() => closeApp(nextSession)),
					onFailure: (error) => {
						if (!nextSession.initialized) {
							controller.abort(error);
							return;
						}
						enqueueLifecycle(() => failSession(nextSession, error));
					}
				}
			});
			createdSession = nextSession;
			session = nextSession;
			registerHostObservers(nextSession);

			status = 'loading-sandbox';
			await waitForAIMcpAppSandbox(frame, sandboxUrl, controller.signal, initializationTimeout);
			throwIfAborted(controller.signal);

			const contentWindow = frame.contentWindow;
			if (!contentWindow) throw new Error('MCP App sandbox window is unavailable.');
			const initialized = waitForAIMcpAppBridgeInitialization(
				nextSession.bridge,
				controller.signal,
				initializationTimeout
			);
			await nextSession.bridge.connect(
				new AIMcpAppPostMessageTransport(contentWindow, sandboxUrl.origin)
			);
			status = 'initializing';
			await nextSession.bridge.sendSandboxResourceReady({
				html: resolvedResource.html,
				csp: resolvedResource.csp,
				permissions: approvedPermissions
			});
			await initialized;
			throwIfAborted(controller.signal);
			nextSession.initialized = true;
			await updateAIMcpAppHostContext(nextSession, {});
			await sendAIMcpAppToolNotifications(nextSession);
			if (session === nextSession && !nextSession.closed) status = 'ready';
		} catch (error) {
			let failure =
				controller.signal.aborted && !isAbortError(controller.signal.reason)
					? controller.signal.reason
					: error;
			if (createdSession) {
				if (session === createdSession) session = undefined;
				const teardownError = await teardownAIMcpAppSession(createdSession);
				if (teardownError) {
					failure = new AggregateError(
						[failure, teardownError],
						'MCP App initialization and teardown both failed.'
					);
				}
			}
			if (isAbortError(error) || controller.signal.aborted) {
				if (!isAbortError(controller.signal.reason) || failure !== error) {
					setFailure(failure, currentHost, currentTool);
				}
				return;
			}
			setFailure(failure, currentHost, currentTool);
		}
	}

	function registerHostObservers(currentSession: AIMcpAppSession): void {
		const { frame } = currentSession;
		currentSession.resizeObserver = new ResizeObserver(([entry]) => {
			const width = Math.round(entry?.contentRect.width ?? 0);
			if (width <= 0 || currentSession.closed) return;
			void updateAIMcpAppHostContext(currentSession, {
				containerDimensions: { width, maxHeight: boundedMaxHeight }
			}).catch((error) => enqueueLifecycle(() => failSession(currentSession, error)));
		});
		currentSession.resizeObserver.observe(frame);
		currentSession.themeObserver = new MutationObserver(() => {
			if (currentSession.host.hostContext?.theme !== undefined) return;
			void updateAIMcpAppHostContext(currentSession, { theme: getDocumentTheme() }).catch((error) =>
				enqueueLifecycle(() => failSession(currentSession, error))
			);
		});
		currentSession.themeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class', 'data-theme', 'style']
		});
	}

	function createHostContext(
		currentHost: AIMcpAppHostConfig,
		frame: HTMLIFrameElement
	): AIMcpAppHostContext {
		const configuredContext = currentHost.hostContext ?? {};
		const availableDisplayModes = currentHost.onDisplayMode
			? [...new Set(['inline' as const, ...(configuredContext.availableDisplayModes ?? [])])]
			: ['inline' as const];
		const configuredDisplayMode = configuredContext.displayMode;
		const displayMode =
			configuredDisplayMode && availableDisplayModes.includes(configuredDisplayMode)
				? configuredDisplayMode
				: 'inline';
		return {
			platform: 'web',
			...configuredContext,
			displayMode,
			availableDisplayModes,
			theme: currentHost.hostContext?.theme ?? getDocumentTheme(),
			containerDimensions: {
				width: Math.max(1, Math.round(frame.getBoundingClientRect().width)),
				maxHeight: boundedMaxHeight
			}
		};
	}

	async function disposeSession(controller: AbortController): Promise<void> {
		const currentSession = session;
		if (!currentSession || currentSession.controller !== controller) return;
		session = undefined;
		const teardownError = await teardownAIMcpAppSession(currentSession);
		if (!teardownError) return;
		setFailure(teardownError, currentSession.host, currentSession.tool);
	}

	async function closeApp(currentSession: AIMcpAppSession): Promise<void> {
		if (currentSession.closed) return;
		const teardownError = await teardownAIMcpAppSession(currentSession);
		if (session === currentSession) session = undefined;
		if (teardownError) {
			setFailure(teardownError, currentSession.host, currentSession.tool);
			return;
		}
		status = 'closed';
		try {
			currentSession.host.onClosed?.(currentSession.tool);
		} catch (error) {
			setFailure(error, currentSession.host, currentSession.tool);
		}
	}

	async function failSession(currentSession: AIMcpAppSession, error: unknown): Promise<void> {
		if (currentSession.closed) return;
		const isCurrent = session === currentSession;
		if (isCurrent) {
			session = undefined;
			lifecycleError = error;
			status = 'error';
		}
		const teardownError = await teardownAIMcpAppSession(currentSession);
		const failure = teardownError
			? new AggregateError([error, teardownError], 'MCP App runtime and teardown both failed.')
			: error;
		if (isCurrent) setFailure(failure, currentSession.host, currentSession.tool);
		else notifyHostError(currentSession.host, failure, currentSession.tool);
	}

	function setFailure(
		error: unknown,
		currentHost: AIMcpAppHostConfig,
		currentTool: AIMcpToolCall
	): void {
		lifecycleError = notifyHostError(currentHost, error, currentTool);
		status = 'error';
	}

	function notifyHostError(
		currentHost: AIMcpAppHostConfig,
		error: unknown,
		currentTool: AIMcpToolCall
	): unknown {
		try {
			currentHost.onError?.({ error, tool: currentTool });
			return error;
		} catch (callbackError) {
			return new AggregateError([error, callbackError], 'MCP App failure reporting also failed.');
		}
	}

	function isCurrentSessionSource(
		currentSession: AIMcpAppSession,
		currentTool: AIMcpToolCall,
		currentHost: AIMcpAppHostConfig
	): boolean {
		return (
			currentSession.key ===
				`${createAIMcpToolSessionKey(currentTool)}\u0000${createAIMcpHostSessionKey(currentHost)}` &&
			currentSession.hostClient === currentHost.client &&
			currentSession.resourceResolver === currentHost.resolveResource &&
			currentSession.sandboxResolver === currentHost.resolveSandboxUrl
		);
	}

	function cloneBridgePayload<T>(value: T, label: string): T {
		try {
			return structuredClone($state.snapshot(value)) as T;
		} catch (error) {
			throw new Error(`MCP App ${label} must be structured-cloneable.`, { cause: error });
		}
	}

	function throwIfAborted(signal: AbortSignal): void {
		if (signal.aborted) throw new DOMException('MCP App initialization aborted.', 'AbortError');
	}

	function isAbortError(error: unknown): boolean {
		return error instanceof DOMException && error.name === 'AbortError';
	}

	function clamp(value: number, minimum: number, maximum: number): number {
		return Math.max(minimum, Math.min(maximum, Math.round(value)));
	}

	function getDocumentTheme(): 'light' | 'dark' {
		if (getComputedStyle(document.documentElement).colorScheme === 'dark') return 'dark';
		const explicitTheme = document.documentElement.dataset.theme;
		if (explicitTheme === 'dark' || explicitTheme === 'light') return explicitTheme;
		return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
	}

	function displayError(error: unknown): string {
		return error instanceof Error && error.message
			? error.message
			: 'Unable to render the MCP App.';
	}
</script>

<div
	bind:this={ref}
	data-slot="ai-mcp-app"
	data-status={status}
	aria-busy={isLoading}
	class={classes.root({ bordered: resource?.prefersBorder ?? true, className })}
	{...attachments}
>
	<iframe
		bind:this={iframeRef}
		title={tool.title ?? tool.name ?? 'MCP App'}
		aria-hidden={status !== 'ready'}
		class={classes.frame()}
		style:height={`${iframeHeight}px`}
		style:visibility={status === 'ready' ? 'visible' : 'hidden'}
	></iframe>

	{#if isLoading}
		<div class="absolute inset-0 {classes.state()}">
			{#if loading}<Slot render={loading} payload={appState} />{:else}<Skeleton
					class="h-28 w-full"
				/>{/if}
		</div>
	{:else if status === 'error'}
		<div class="absolute inset-0 {classes.state()}">
			{#if errorSlot}<Slot render={errorSlot} payload={appState} />{:else}<Alert
					color="danger"
					variant="soft"
					title="MCP App unavailable"
					description={displayError(lifecycleError)}
				/>{/if}
		</div>
	{:else if status === 'closed'}
		<div class="absolute inset-0 {classes.state()}">
			{#if closed}<Slot render={closed} payload={appState} />{:else}<Empty
					size="small"
					title="App closed"
				/>{/if}
		</div>
	{:else if children}
		<Slot render={children} payload={appState} />
	{/if}
</div>
