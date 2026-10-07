import { createContext } from 'svelte';

/**
 * An inverse section re-scopes the whole palette with the opposite scheme class (`.dark` /
 * `.light`), which also re-declares every colour variable the host app may have overridden at the
 * root. A host that retunes its palette at runtime provides those overrides here, and the shell
 * re-applies them inside the flipped scope so an inverse band keeps the brand colour.
 */
export interface SectionScope {
	inverseStyle?: () => string | undefined;
}

const [getSectionScope, setSectionScope, hasSectionScope] = createContext<SectionScope>();

export { setSectionScope };

export function useSectionScope(): SectionScope {
	return hasSectionScope() ? getSectionScope() : {};
}
