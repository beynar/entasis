<script lang="ts">
	import type { Snippet } from 'svelte';
	import { BROWSER, DEV } from 'esm-env';
	import { setI18n, setI18nDirection } from './context.svelte.js';
	import { loadLocaleMessages, localeDirection } from './localeCatalogs.js';
	import type { LocaleCode } from './locales.js';
	import { en, type Messages } from './en.js';

	let {
		locale = $bindable('en'),
		catalogs,
		messages,
		dir,
		manageDocument = true,
		children
	}: {
		/** Active locale, bindable so a language picker can drive it. */
		locale?: LocaleCode;
		/**
		 * Catalogs available without loading, by locale: `catalogs={{ fr }}` with `fr` imported from
		 * `entasis/i18n`. A locale missing here loads its catalog on demand (English shows until it
		 * arrives, and server rendering stays English), so pass the locales an app renders first.
		 */
		catalogs?: Partial<Record<LocaleCode, Messages>>;
		/** Extra per-key overrides merged on top of the locale's messages. */
		messages?: Partial<Messages>;
		/** Force a text direction; defaults to the active locale's direction (rtl for Arabic). */
		dir?: 'ltr' | 'rtl';
		/** When true (default), keeps `<html dir>` and `<html lang>` in sync with the locale. */
		manageDocument?: boolean;
		/** App content; every descendant reads the active messages via `useI18n()`. */
		children?: Snippet;
	} = $props();

	let loaded = $state<Partial<Record<LocaleCode, Messages>>>({});
	// While a switched-to locale loads, keep showing the previous catalog rather than English.
	let shown: Messages = en;
	const catalog = $derived.by(() => {
		const next = locale === 'en' ? en : (catalogs?.[locale] ?? loaded[locale]);
		if (next) shown = next;
		return next ?? shown;
	});

	if (DEV && !BROWSER && locale !== 'en' && !catalogs?.[locale]) {
		console.warn(
			`entasis: <I18n locale="${locale}"> has no catalog for "${locale}" and renders English on the server. Pass catalogs={{ ... }} with the catalog imported from 'entasis/i18n'.`
		);
	}

	$effect(() => {
		const code = locale;
		if (code === 'en' || catalogs?.[code] || loaded[code]) return;
		loadLocaleMessages(code)?.then((catalog) => {
			loaded[code] = catalog;
		});
	});

	// Provide the merged catalog to all descendants. The getter keeps them reactive to `locale`.
	setI18n(() => ({ ...catalog, ...messages }));
	setI18nDirection(() => dir ?? localeDirection(locale));

	// Client-only: mirror direction + language onto the document element.
	// Restore the prior values on unmount / when manageDocument turns off, so a page-scoped
	// <I18n> (e.g. a demo) doesn't leave the whole app stuck in its locale after navigating away.
	$effect(() => {
		if (!manageDocument) return;
		const root = document.documentElement;
		const prevDir = root.dir;
		const prevLang = root.lang;
		root.dir = dir ?? localeDirection(locale);
		root.lang = locale;
		return () => {
			root.dir = prevDir;
			root.lang = prevLang;
		};
	});
</script>

{#if children}{@render children()}{/if}
