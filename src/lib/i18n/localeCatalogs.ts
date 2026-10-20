import type { Messages } from './en.js';
import type { LocaleCode } from './locales.js';

/**
 * One dynamic import per locale, so a bundler emits each catalog as its own chunk and an app
 * only downloads the locales it renders. English is the built-in default and never loads.
 */
const loaders: Record<Exclude<LocaleCode, 'en'>, () => Promise<Messages>> = {
	es: () => import('./es.js').then((m) => m.es),
	fr: () => import('./fr.js').then((m) => m.fr),
	de: () => import('./de.js').then((m) => m.de),
	ja: () => import('./ja.js').then((m) => m.ja),
	'zh-CN': () => import('./zh.js').then((m) => m.zh),
	'pt-BR': () => import('./pt.js').then((m) => m.pt),
	ar: () => import('./ar.js').then((m) => m.ar)
};

const pending = new Map<LocaleCode, Promise<Messages>>();

/** Load a shipped locale's catalog on demand. Repeated calls share one request. */
export const loadLocaleMessages = (code: LocaleCode): Promise<Messages> | undefined => {
	if (code === 'en') return undefined;
	let request = pending.get(code);
	if (!request) {
		request = loaders[code]();
		pending.set(code, request);
		request.catch(() => pending.delete(code));
	}
	return request;
};

/** Text direction of a shipped locale, without importing its catalog. */
export const localeDirection = (code: LocaleCode): 'ltr' | 'rtl' => (code === 'ar' ? 'rtl' : 'ltr');
