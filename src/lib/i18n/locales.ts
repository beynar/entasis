import { en } from './en.js';
import { es } from './es.js';
import { fr } from './fr.js';
import { de } from './de.js';
import { ja } from './ja.js';
import { zh } from './zh.js';
import { pt } from './pt.js';
import { ar } from './ar.js';
import type { Messages } from './en.js';

export type LocaleCode = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh-CN' | 'pt-BR' | 'ar';

export type LocaleMeta = {
	/** Native language name, for a language picker. */
	name: string;
	/** Text direction; 'rtl' for Arabic. Set `document.dir` from this. */
	dir: 'ltr' | 'rtl';
	/** The message catalog for this locale. */
	messages: Messages;
};

/**
 * Every shipped locale with its catalog, for a language picker. Importing it bundles all eight
 * catalogs: an app with a fixed locale imports that catalog by name instead (`import { fr } from
 * 'entasis/i18n'`) and passes it to `<I18n catalogs={{ fr }}>` or `setI18n`.
 */
export const locales: Record<LocaleCode, LocaleMeta> = {
	en: { name: 'English', dir: 'ltr', messages: en },
	es: { name: 'Español', dir: 'ltr', messages: es },
	fr: { name: 'Français', dir: 'ltr', messages: fr },
	de: { name: 'Deutsch', dir: 'ltr', messages: de },
	ja: { name: '日本語', dir: 'ltr', messages: ja },
	'zh-CN': { name: '简体中文', dir: 'ltr', messages: zh },
	'pt-BR': { name: 'Português (Brasil)', dir: 'ltr', messages: pt },
	ar: { name: 'العربية', dir: 'rtl', messages: ar }
};

export const localeList = /* @__PURE__ */ Object.entries(locales).map(([code, meta]) => ({
	code: code as LocaleCode,
	...meta
}));
