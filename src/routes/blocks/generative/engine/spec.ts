import type { PageKit, PageSlot, PageSpec, Params } from './types.js';

/**
 * Page specs persist lever positions (params), never variant indices: adding a lever value would
 * shift every index, while params re-resolve against the current legal list. `version` guards the
 * shape itself.
 */
export const SPEC_VERSION = 1;

function toBase64Url(text: string) {
	const bytes = new TextEncoder().encode(text);
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string) {
	const padded = value.replace(/-/g, '+').replace(/_/g, '/');
	const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
	return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

export function encodeSpec(spec: PageSpec): string {
	return toBase64Url(JSON.stringify(spec));
}

const isParamValue = (value: unknown) =>
	typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';

function parseSlot(value: unknown): PageSlot | null {
	if (!value || typeof value !== 'object') return null;
	const slot = value as Record<string, unknown>;
	if (typeof slot.id !== 'string' || typeof slot.type !== 'string') return null;
	if (!slot.params || typeof slot.params !== 'object') return null;
	const params: Params = {};
	for (const [name, param] of Object.entries(slot.params as Record<string, unknown>)) {
		if (!isParamValue(param)) return null;
		params[name] = param as Params[string];
	}
	return {
		id: slot.id,
		type: slot.type,
		params,
		locked: slot.locked === true,
		nonce: typeof slot.nonce === 'number' && Number.isInteger(slot.nonce) ? slot.nonce : 0
	};
}

function parseKit(value: unknown): PageKit | undefined | null {
	if (value === undefined) return undefined;
	if (!value || typeof value !== 'object') return null;
	const kit = value as Record<string, unknown>;
	if (!kit.params || typeof kit.params !== 'object') return null;
	const params: Params = {};
	for (const [name, param] of Object.entries(kit.params as Record<string, unknown>)) {
		if (!isParamValue(param)) return null;
		params[name] = param as Params[string];
	}
	return {
		params,
		locked: kit.locked === true,
		nonce: typeof kit.nonce === 'number' && Number.isInteger(kit.nonce) ? kit.nonce : 0
	};
}

/** Parse an untrusted spec (URL, storage, paste). Structure only — rules are checked separately. */
export function parseSpec(value: unknown): PageSpec | null {
	if (!value || typeof value !== 'object') return null;
	const spec = value as Record<string, unknown>;
	if (spec.version !== SPEC_VERSION) return null;
	if (typeof spec.seed !== 'string' || typeof spec.direction !== 'string') return null;
	if (!Array.isArray(spec.sections)) return null;
	const sections: PageSlot[] = [];
	for (const entry of spec.sections) {
		const slot = parseSlot(entry);
		if (!slot) return null;
		sections.push(slot);
	}
	const kit = parseKit(spec.kit);
	if (kit === null) return null;
	return {
		version: SPEC_VERSION,
		seed: spec.seed,
		direction: spec.direction,
		...(kit ? { kit } : {}),
		sections
	};
}

export function decodeSpec(value: string | null | undefined): PageSpec | null {
	if (!value) return null;
	try {
		return parseSpec(JSON.parse(fromBase64Url(value)));
	} catch {
		return null;
	}
}
