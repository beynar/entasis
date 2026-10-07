import { createContext } from 'svelte';
import { resolveKit, type SectionKit } from '../engine/kit.js';

/**
 * Sections read the page's component kit from context instead of hard-coding component props,
 * so one kit restyles every Button, Chip, field and badge on a page. Without a provider they get
 * the default kit, which matches the library defaults.
 */
const [getKit, setKit, hasKit] = createContext<() => SectionKit>();

const fallback = resolveKit();

export function provideSectionKit(kit: () => SectionKit) {
	setKit(kit);
}

/** A live view of the nearest kit: every read goes through the provider, so it stays reactive. */
export function useSectionKit(): SectionKit {
	const read = hasKit() ? getKit() : () => fallback;
	return {
		get size() {
			return read().size;
		},
		get accent() {
			return read().accent;
		},
		get primary() {
			return read().primary;
		},
		get secondary() {
			return read().secondary;
		},
		get chip() {
			return read().chip;
		},
		step: (offset) => read().step(offset),
		stack: (offset) => read().stack(offset),
		action: (onBrand) => read().action(onBrand),
		quiet: () => read().quiet()
	};
}

const [getTone, setTone, hasTone] = createContext<() => string>();

/** The shell publishes its tone, so shared pieces can step off the surface they sit on. */
export function provideSectionTone(tone: () => string) {
	setTone(tone);
}

export function useSectionTone(): () => string {
	return hasTone() ? getTone() : () => 'plain';
}
