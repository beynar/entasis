/** Semantic palette roles accepted by component `color` props. */
export type Colors =
	'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'neutral';
export type FontSize = `fontSize.${
	'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'DEFAULT'}`;
export type ColorKeys = `${
	'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'neutral'}.${
	'light' | 'lighter' | 'DEFAULT' | 'contrast' | 'dark' | 'muted' | 'readable' | 'muted-readable'}`;

export type ColorPath = `colors.${ColorKeys}`;

export type ThemePaths = ColorPath | FontSize | (string & {});
export type ThemeFunction = (paths: ThemePaths) => string;

export type Styles = Partial<CSSStyleDeclaration & { textWrap: string }>;

export const deepMerge = <T>(a?: Partial<T>, b?: Partial<T>): T => {
	a = a || {};
	b = b || {};
	for (const key in b) {
		if (b[key] !== undefined && typeof b[key] === 'object') {
			Object.assign(a, {
				[key]: deepMerge(a[key] || {}, b[key] || {})
			});
		} else {
			Object.assign(a, { [key]: b[key] });
		}
	}
	return a as T;
};

/** Component geometry scale. It does not change internal whitespace density. */
export type Sizes = 'small' | 'normal' | 'large';

/**
 * Spacing density of a component: paddings and gaps, independent of the
 * typography scale (`Sizes`) and deliberately using a distinct vocabulary so a
 * density value can never be mistaken for a size. 'compact' for dense
 * dashboards, 'normal' for everyday UI, 'comfortable' for roomy detail surfaces.
 */
export type Density = 'compact' | 'normal' | 'comfortable';

export type Easing = 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';

/**
 * Indicator drawn on a disclosure control (collapsible group, expandable row):
 * a rotating chevron, a plus/minus glyph, or no indicator at all.
 */
export type DisclosureIndicator = 'chevron' | 'plus-minus' | 'none';
