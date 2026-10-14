import { applyCspNonce, nonceAttribute } from '$lib/utils/cspNonce.js';

const ANIMATION_DELAY_MS = 1;

/** Suspends every CSS transition until the returned function runs; the style carries `nonce`. */
export const disableAnimation = (nonce?: string) => {
	const css = applyCspNonce(document.createElement('style'), nonce);
	css.appendChild(
		document.createTextNode(
			`*{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`
		)
	);
	document.head.appendChild(css);

	return () => {
		// Force to restyle
		(() => window.getComputedStyle(document.body))();

		// Wait for the next tick before removing
		setTimeout(() => {
			document.head.removeChild(css);
		}, ANIMATION_DELAY_MS);
	};
};

export const escapeForInlineScript = (json: unknown) =>
	JSON.stringify(json)
		.replace(/</g, '\\u003C')
		.replace(/>/g, '\\u003E')
		.replace(/-->/g, '--\\>')
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029');
export const escapeJsString = (s: string) =>
	String(s)
		.replace(/\\/g, '\\\\')
		.replace(/'/g, "\\'")
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029');

export const MEDIA = '(prefers-color-scheme: dark)';

type ThemeBlockingScriptOptions = {
	value?: Partial<Record<string, string>>;
	colorScheme?: Partial<Record<string, string>>;
	themes?: readonly string[];
	validThemes: readonly string[];
	storageKey: string;
	systemTheme: boolean;
	syncColorScheme: boolean;
	forcedTheme?: string;
	defaultTheme: string;
	attribute: string;
	/** The CSP nonce stamped on the emitted `<script>`. */
	nonce?: string;
};

/** Blocking `<head>` script that applies the stored theme before first paint. */
export const compileThemeBlockingScript = ({
	value,
	colorScheme,
	themes,
	validThemes,
	storageKey,
	systemTheme,
	syncColorScheme,
	forcedTheme,
	defaultTheme,
	attribute,
	nonce
}: ThemeBlockingScriptOptions) => {
	const classNames = !value ? [...(themes ?? [])] : Object.values(value);
	const escapedDefaultTheme = escapeJsString(defaultTheme);
	const escapedStorageKey = escapeJsString(storageKey);
	const systemThemeExpr = systemTheme
		? `window.matchMedia('${MEDIA}').matches ? 'dark' : 'light'`
		: "'normal'";
	const resolvedThemeExpr = forcedTheme
		? `'${escapeJsString(forcedTheme)}'`
		: `isSystemTheme ? systemTheme : currentTheme`;
	const colorSchemeStmt = syncColorScheme
		? `d.style.setProperty('color-scheme', colorSchemeMode);`
		: '';
	const classRemoveStmt =
		attribute === 'class'
			? `d.classList.remove(${classNames.map((name) => `'${escapeJsString(name ?? '')}'`).join(',')})`
			: '';
	const applyStmt =
		attribute === 'class'
			? `d.classList.add(val);`
			: `d.setAttribute('${escapeJsString(attribute)}', val);`;

	return `<script${nonceAttribute(nonce)}>
		function svelteTheme(){
		var d=document.documentElement;
		var x=${escapeForInlineScript(value || {})};
		var y=${escapeForInlineScript(colorScheme || {})};
		var validThemes=${escapeForInlineScript(validThemes)};
		var localStorageTheme; try { localStorageTheme = localStorage.getItem('${escapedStorageKey}'); } catch(e) { localStorageTheme = null; }
		var systemTheme = ${systemThemeExpr};
		var isValidTheme = validThemes.indexOf(localStorageTheme) !== -1;
		var isSystemThemeButDisabled = localStorageTheme === 'system' && ${!systemTheme};
		var currentTheme = isValidTheme ? localStorageTheme : '${escapedDefaultTheme}';
		if (isSystemThemeButDisabled) {
			currentTheme = '${escapedDefaultTheme}';
			try { localStorage.setItem('${escapedStorageKey}', currentTheme); } catch(e) {}
		}
		var isSystemTheme = ${systemTheme ? "currentTheme === 'system'" : 'false'};
		var resolvedTheme = ${resolvedThemeExpr};
		var colorSchemeMode = y[resolvedTheme] || (resolvedTheme === 'light' || resolvedTheme === 'dark' ? resolvedTheme : 'normal');
		var val = x[resolvedTheme] || resolvedTheme;
		${colorSchemeStmt}
		${classRemoveStmt};
		${applyStmt}
		};svelteTheme();
		</script>`;
};

/** The custom property carrying how far the on-screen keyboard overlaps the layout viewport. */
export const KEYBOARD_INSET_VARIABLE = '--keyboard-inset';

/**
 * Boot script that mirrors the viewport onto `<html>`: `--window-height` and `--window-width`,
 * and `--keyboard-inset`, the px height the on-screen keyboard (or any other browser UI that
 * shrinks only the visual viewport) covers at the bottom of the layout viewport, `0px` without
 * one. A pinch zoom also shrinks the visual viewport, so the inset stays `0px` while it is
 * zoomed. Browsers that resize the layout viewport for the keyboard report no overlap either.
 * Written as a self-contained string because it runs before hydration.
 */
export const compileViewportScript = () => /* js */ `
(() => {
	const visualViewport = window.visualViewport;
	const root = document.documentElement;
	const setWindowHeight = () => {
		const height = visualViewport?.height ?? window.innerHeight;
		root.style.setProperty('--window-height', height + 'px');
	};
	const setWindowWidth = () => {
		root.style.setProperty('--window-width', window.innerWidth + 'px');
	};
	const setKeyboardInset = () => {
		const zoomed = !!visualViewport && Math.abs(visualViewport.scale - 1) > 0.01;
		const inset =
			visualViewport && !zoomed
				? Math.max(0, Math.round(window.innerHeight - visualViewport.height - visualViewport.offsetTop))
				: 0;
		root.style.setProperty('${KEYBOARD_INSET_VARIABLE}', inset + 'px');
	};
	window.addEventListener('resize', setWindowHeight);
	window.addEventListener('resize', setWindowWidth);
	window.addEventListener('resize', setKeyboardInset);
	visualViewport?.addEventListener('resize', setWindowHeight);
	visualViewport?.addEventListener('resize', setKeyboardInset);
	visualViewport?.addEventListener('scroll', setKeyboardInset);
	setWindowHeight();
	setWindowWidth();
	setKeyboardInset();
})();
`;

export const colorSchemes = ['light', 'dark'] as const;
export type ColorScheme = (typeof colorSchemes)[number];
