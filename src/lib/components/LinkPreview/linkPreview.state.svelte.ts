import { onDestroy } from 'svelte';
import type {
	LinkPreviewFetch,
	LinkPreviewMetadata,
	LinkPreviewMetadataEndpoint,
	LinkPreviewStatus
} from './linkPreview.props.js';

export const DEFAULT_LINK_PREVIEW_METADATA_ENDPOINT = '/api/link-metadata';

type LinkPreviewStateOptions = {
	getHref: () => string;
	getMetadata: () => LinkPreviewMetadata | undefined;
	getFetchMetadata: () => LinkPreviewFetch | undefined;
	getMetadataEndpoint: () => LinkPreviewMetadataEndpoint | undefined;
	getShouldLoad: () => boolean;
	getDisabled: () => boolean;
	onLoad?: (payload: LinkPreviewMetadata) => void;
	onError?: (error: Error) => void;
};

export function createLinkPreviewState(options: LinkPreviewStateOptions) {
	const initialHref = options.getHref();
	const initialMetadata = options.getMetadata();

	let status = $state<LinkPreviewStatus>(initialMetadata !== undefined ? 'loaded' : 'idle');
	let metadata = $state<LinkPreviewMetadata | null>(
		initialMetadata !== undefined ? normalizeMetadata(initialMetadata, initialHref) : null
	);
	let stateHref = $state(initialHref);
	let hasControlledMetadata = $state(initialMetadata !== undefined);
	let error = $state<string | null>(null);
	let requestId = 0;
	let requestController: AbortController | null = null;

	function abortMetadataRequest() {
		if (!requestController) return;
		requestController.abort();
		requestController = null;
	}

	function getEndpointRequestUrl(nextHref: string): string {
		const endpoint = options.getMetadataEndpoint() ?? DEFAULT_LINK_PREVIEW_METADATA_ENDPOINT;
		if (typeof endpoint === 'function') {
			return endpoint(nextHref);
		}
		const separator = endpoint.includes('?') ? '&' : '?';
		return `${endpoint}${separator}url=${encodeURIComponent(nextHref)}`;
	}

	async function requestMetadata(nextHref: string, signal: AbortSignal) {
		const fetchMetadata = options.getFetchMetadata();
		if (fetchMetadata) {
			return fetchMetadata(nextHref, signal);
		}
		const response = await fetch(getEndpointRequestUrl(nextHref), {
			signal,
			headers: {
				accept: 'application/json'
			}
		});
		if (!response.ok) {
			throw new Error(await readResponseErrorMessage(response));
		}
		return readMetadata(await response.json());
	}

	async function loadMetadata(force = false) {
		const nextHref = options.getHref();
		if (options.getMetadata() !== undefined) return;
		if (!force && status !== 'idle') return;

		abortMetadataRequest();
		const currentRequestId = ++requestId;
		const controller = new AbortController();
		requestController = controller;
		stateHref = nextHref;
		status = 'loading';
		error = null;

		try {
			const nextMetadata = normalizeMetadata(
				await requestMetadata(nextHref, controller.signal),
				nextHref
			);
			if (controller.signal.aborted || currentRequestId !== requestId) return;
			metadata = nextMetadata;
			status = 'loaded';
			options.onLoad?.(nextMetadata);
		} catch (value) {
			if (controller.signal.aborted || currentRequestId !== requestId) return;
			const nextError = toError(value);
			metadata = null;
			error = nextError.message;
			status = 'error';
			options.onError?.(nextError);
		} finally {
			if (requestController === controller) {
				requestController = null;
			}
		}
	}

	$effect(() => {
		const nextHref = options.getHref();
		const nextMetadata = options.getMetadata();
		const nextHasControlledMetadata = nextMetadata !== undefined;
		const hrefChanged = nextHref !== stateHref;
		const controlChanged = nextHasControlledMetadata !== hasControlledMetadata;
		if (!hrefChanged && !controlChanged && !nextHasControlledMetadata) return;

		abortMetadataRequest();
		stateHref = nextHref;
		hasControlledMetadata = nextHasControlledMetadata;
		error = null;

		if (nextMetadata !== undefined) {
			metadata = normalizeMetadata(nextMetadata, nextHref);
			status = 'loaded';
			return;
		}

		metadata = null;
		status = 'idle';
	});

	$effect(() => {
		if (!options.getShouldLoad() || options.getMetadata() !== undefined || options.getDisabled())
			return;
		void loadMetadata();
	});

	onDestroy(() => {
		abortMetadataRequest();
	});

	return {
		get metadata() {
			return metadata;
		},
		get status() {
			return status;
		},
		get error() {
			return error;
		},
		get previewUrl() {
			return metadata?.url ?? options.getHref();
		},
		reload: () => loadMetadata(true)
	};
}

function normalizeMetadata(nextMetadata: LinkPreviewMetadata, href: string): LinkPreviewMetadata {
	return {
		...nextMetadata,
		url: nextMetadata.url ?? href
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: keyof LinkPreviewMetadata) {
	const value = record[key];
	if (typeof value !== 'string') return undefined;
	const trimmed = value.trim();
	return trimmed || undefined;
}

function readMetadata(value: unknown): LinkPreviewMetadata {
	if (!isRecord(value)) {
		throw new Error('Link preview endpoint returned invalid metadata.');
	}
	return {
		url: readString(value, 'url'),
		title: readString(value, 'title'),
		description: readString(value, 'description'),
		siteName: readString(value, 'siteName'),
		image: readString(value, 'image'),
		favicon: readString(value, 'favicon')
	};
}

async function readResponseErrorMessage(response: Response) {
	const fallback = `Link preview request failed (${response.status}).`;
	const contentType = response.headers.get('content-type') ?? '';
	if (!contentType.includes('application/json')) return fallback;
	try {
		const body: unknown = await response.json();
		return isRecord(body) && typeof body.message === 'string' ? body.message : fallback;
	} catch {
		// Error response bodies are optional; the status failure still propagates.
		return fallback;
	}
}

function toError(value: unknown) {
	if (value instanceof Error) return value;
	return new Error('Unable to load link preview.');
}
