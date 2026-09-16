import type { LayoutServerLoad } from './$types.js';
import {
	PLAYGROUND_COOKIE,
	type RuntimeThemePlaygroundSnapshot
} from './runtimeThemePlayground.svelte.js';

export const load: LayoutServerLoad = ({ cookies }) => {
	let playground: Partial<RuntimeThemePlaygroundSnapshot> | null = null;
	const raw = cookies.get(PLAYGROUND_COOKIE);
	if (raw) {
		try {
			const parsed: unknown = JSON.parse(raw);
			if (parsed && typeof parsed === 'object') {
				playground = parsed as Partial<RuntimeThemePlaygroundSnapshot>;
			}
		} catch {
			// A corrupt cookie just means defaults.
		}
	}
	return { playground };
};
