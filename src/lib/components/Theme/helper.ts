const ANIMATION_DELAY_MS = 1;

export const disableAnimation = () => {
	const css = document.createElement('style');
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
	attribute
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

	return `<script>
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

export const colorSchemes = ['light', 'dark'] as const;
export type ColorScheme = (typeof colorSchemes)[number];
