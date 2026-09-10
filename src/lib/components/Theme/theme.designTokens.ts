export type ThemeSpacing = 'small' | 'normal' | 'large' | number;
export type ThemeRadius = 'none' | 'subtile' | 'small' | 'normal' | 'large' | 'round' | number;
export type ThemeSpacingStep = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ThemeSpacingScale = Record<ThemeSpacingStep, number>;

export type TypeScaleRatio =
	| 'minorSecond'
	| 'majorSecond'
	| 'minorThird'
	| 'majorThird'
	| 'perfectFourth'
	| 'augmentedFourth'
	| 'perfectFifth'
	| 'goldenRatio';

export type TypeScaleOptions = {
	baseMinPx?: number;
	baseMaxPx?: number;
	minViewport?: number;
	maxViewport?: number;
	scale?: TypeScaleRatio;
	remValueInPx?: number;
};

export type TypeScalePreset = 'compact' | 'default' | 'comfortable' | 'large';

export type ThemeDesignTokens = {
	spacing?: ThemeSpacing;
	spacingScale?: Partial<ThemeSpacingScale>;
	radius?: ThemeRadius;
	typeScale?: TypeScalePreset | TypeScaleOptions;
	raisedWithBorder?: boolean;
};

export type ThemeDesignTokenMap<T extends readonly string[] = readonly string[]> = Partial<
	Record<T[number], ThemeDesignTokens>
>;

type CompileThemeDesignTokensOptions<T extends readonly string[]> = {
	designTokens?: ThemeDesignTokenMap<T>;
	attribute: string;
	value?: Partial<Record<T[number], string>>;
	colorScheme?: Partial<Record<T[number], 'light' | 'dark' | 'normal'>>;
};

const spacingFactors = {
	small: 0.8,
	normal: 1,
	large: 1.2
} as const;

export const defaultThemeSpacingScale = {
	xs: 1,
	sm: 1.5,
	md: 2,
	lg: 3,
	xl: 4
} as const satisfies ThemeSpacingScale;

const radiusFactors = {
	none: 0,
	subtile: 0.5,
	small: 0.75,
	normal: 1,
	large: 1.5,
	round: 2.5
} as const;

const radiusScale = {
	sm: 0.25,
	md: 0.5,
	lg: 0.75
} as const;

const typeScaleRatios = {
	minorSecond: 1.067,
	majorSecond: 1.125,
	minorThird: 1.2,
	majorThird: 1.25,
	perfectFourth: 1.32,
	augmentedFourth: 1.414,
	perfectFifth: 1.5,
	goldenRatio: 1.618
} as const;

export const typeScalePresets = {
	compact: { baseMinPx: 14, baseMaxPx: 16, scale: 'minorThird' },
	default: { baseMinPx: 16, baseMaxPx: 18, scale: 'majorThird' },
	comfortable: { baseMinPx: 16, baseMaxPx: 20, scale: 'majorThird' },
	large: { baseMinPx: 18, baseMaxPx: 22, scale: 'perfectFourth' }
} as const satisfies Record<TypeScalePreset, TypeScaleOptions>;

const typeScaleSteps = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'] as const;
const themeNamePattern = /^[A-Za-z_][A-Za-z0-9_-]*$/;
const dataAttributePattern = /^data-[A-Za-z_][A-Za-z0-9_-]*$/;

const finiteNumber = (value: number, name: string, minimum = 0) => {
	if (!Number.isFinite(value) || value < minimum) {
		throw new Error(`${name} must be a finite number greater than or equal to ${minimum}.`);
	}
	return value;
};

const positiveNumber = (value: number, name: string) => {
	if (!Number.isFinite(value) || value <= 0) {
		throw new Error(`${name} must be a finite number greater than 0.`);
	}
	return value;
};

const presetFactor = <Preset extends Record<string, number>>(
	value: keyof Preset | number,
	presets: Preset,
	name: string
) => {
	if (typeof value === 'number') return finiteNumber(value, name);
	const factor = presets[value];
	if (factor === undefined) throw new Error(`Unknown ${name} preset "${String(value)}".`);
	return factor;
};

const round = (value: number) => Number(value.toFixed(3));
const formatRem = (value: number) => `${Number(value.toFixed(6))}rem`;

const spacingScaleVariables = (spacingScale: Partial<ThemeSpacingScale>) => {
	const resolvedScale: ThemeSpacingScale = {
		...defaultThemeSpacingScale,
		...spacingScale
	};
	const entries = Object.entries(resolvedScale) as [ThemeSpacingStep, number][];

	entries.forEach(([step, value], index) => {
		positiveNumber(value, `spacingScale.${step}`);
		const previousEntry = entries[index - 1];
		if (previousEntry && value <= previousEntry[1]) {
			throw new Error(
				`spacingScale.${step} must be greater than spacingScale.${previousEntry[0]}.`
			);
		}
	});

	return Object.fromEntries(
		entries.map(([step, multiplier]) => [`--space-${step}`, `calc(var(--spacing) * ${multiplier})`])
	);
};

const typeScaleVariables = (typeScale: TypeScalePreset | TypeScaleOptions) => {
	const preset: TypeScaleOptions =
		typeof typeScale === 'string' ? typeScalePresets[typeScale] : typeScale;
	if (!preset) throw new Error(`Unknown typeScale preset "${String(typeScale)}".`);

	const baseMinPx = positiveNumber(preset.baseMinPx ?? 16, 'typeScale.baseMinPx');
	const baseMaxPx = positiveNumber(preset.baseMaxPx ?? 18, 'typeScale.baseMaxPx');
	const minViewport = finiteNumber(preset.minViewport ?? 375, 'typeScale.minViewport');
	const maxViewport = positiveNumber(preset.maxViewport ?? 1440, 'typeScale.maxViewport');
	const remValueInPx = positiveNumber(preset.remValueInPx ?? 16, 'typeScale.remValueInPx');
	const scale = preset.scale ?? 'majorThird';
	const ratio = typeScaleRatios[scale];

	if (!ratio) throw new Error(`Unknown typeScale ratio "${String(scale)}".`);
	if (baseMaxPx < baseMinPx) {
		throw new Error('typeScale.baseMaxPx must be greater than or equal to typeScale.baseMinPx.');
	}
	if (maxViewport <= minViewport) {
		throw new Error('typeScale.maxViewport must be greater than typeScale.minViewport.');
	}

	return Object.fromEntries(
		typeScaleSteps.map((step, index) => {
			const multiplier = Math.pow(ratio, index - 2);
			const minPx = index < 2 ? Math.max(baseMinPx * multiplier, 10) : baseMinPx * multiplier;
			const maxPx = index < 2 ? Math.max(baseMaxPx * multiplier, 12) : baseMaxPx * multiplier;
			const slope = (maxPx - minPx) / (maxViewport - minViewport);
			const intercept = minPx - slope * minViewport;
			const value = `clamp(${round(minPx / remValueInPx)}rem, ${round(slope * 100)}vw + ${round(intercept / remValueInPx)}rem, ${round(maxPx / remValueInPx)}rem)`;
			return [`--text-${step}`, value];
		})
	);
};

const radiusVariables = (radius: ThemeRadius) => {
	const factor = presetFactor(radius, radiusFactors, 'radius');
	const sm = formatRem(radiusScale.sm * factor);
	const md = formatRem(radiusScale.md * factor);
	const lg = formatRem(radiusScale.lg * factor);

	return {
		'--radius': sm,
		'--radius-xs': sm,
		'--radius-sm': sm,
		'--radius-md': md,
		'--radius-lg': lg,
		'--radius-xl': lg,
		'--radius-2xl': lg,
		'--radius-3xl': lg,
		'--radius-4xl': lg
	};
};

const tokenVariables = (tokens: ThemeDesignTokens, colorScheme: 'light' | 'dark' | 'normal') => ({
	...(tokens.spacing === undefined
		? {}
		: {
				'--spacing': formatRem(0.25 * presetFactor(tokens.spacing, spacingFactors, 'spacing'))
			}),
	...(tokens.spacingScale === undefined ? {} : spacingScaleVariables(tokens.spacingScale)),
	...(tokens.radius === undefined ? {} : radiusVariables(tokens.radius)),
	...(tokens.typeScale === undefined ? {} : typeScaleVariables(tokens.typeScale)),
	...(tokens.raisedWithBorder === undefined
		? {}
		: {
				'--raised-border': tokens.raisedWithBorder
					? '1px solid var(--current-border, var(--color-neutral-muted))'
					: '0 solid transparent'
			}),
	...(colorScheme === 'dark' ? { '--dark-raised-shadow': 'none' } : {})
});

const validateThemeName = (themeName: string) => {
	if (!themeNamePattern.test(themeName)) {
		throw new Error(
			`Theme name "${themeName}" must start with a letter or underscore and contain only letters, numbers, underscores, or hyphens.`
		);
	}
};

const themeSelector = (attribute: string, themeName: string) => {
	validateThemeName(themeName);
	if (attribute === 'class') return `html.${themeName}`;
	if (!dataAttributePattern.test(attribute)) {
		throw new Error(`Theme attribute "${attribute}" must be "class" or a valid data-* attribute.`);
	}
	return `html[${attribute}="${themeName}"]`;
};

export const compileThemeDesignTokens = <T extends readonly string[]>({
	designTokens,
	attribute,
	value,
	colorScheme
}: CompileThemeDesignTokensOptions<T>) => {
	if (!designTokens) return '';

	return (Object.entries(designTokens) as [string, ThemeDesignTokens][])
		.map(([themeName, tokens]) => {
			const attributeValue = value?.[themeName as T[number]] ?? themeName;
			const selector = themeSelector(attribute, attributeValue);
			const scheme =
				colorScheme?.[themeName as T[number]] ??
				(themeName === 'light' || themeName === 'dark' ? themeName : 'normal');
			const declarations = Object.entries(tokenVariables(tokens, scheme))
				.map(([property, propertyValue]) => `${property}:${propertyValue};`)
				.join('');
			return declarations ? `${selector}{${declarations}}` : '';
		})
		.filter(Boolean)
		.join('\n');
};
