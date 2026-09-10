import { createContext } from 'svelte';
import type {
	ThemeDesignTokenMap,
	ThemeDesignTokens,
	ThemeSpacingScale,
	TypeScalePreset
} from '$lib/components/Theme/theme.designTokens.js';
import { defaultThemeSpacingScale } from '$lib/components/Theme/theme.designTokens.js';
import {
	runtimeColorPaletteStyle,
	type RuntimeColorPaletteName
} from './playground/runtimeColorPalettes.js';

type RuntimeThemePreset = ThemeDesignTokens & {
	label: string;
	description: string;
	palette: RuntimeColorPaletteName;
};

export const runtimeThemePresetNames = [
	'dense',
	'compact',
	'balanced',
	'comfortable',
	'spacious',
	'sharp',
	'rounded',
	'display'
] as const;

export type RuntimeThemePresetName = (typeof runtimeThemePresetNames)[number];

export const runtimeThemePresets = {
	dense: {
		label: 'Dense',
		description: 'Maximum information density.',
		spacing: 0.65,
		radius: 0.5,
		typeScale: 'compact',
		raisedWithBorder: true,
		palette: 'graphite'
	},
	compact: {
		label: 'Compact',
		description: 'Tight product interfaces.',
		spacing: 0.8,
		radius: 0.75,
		typeScale: 'compact',
		raisedWithBorder: true,
		palette: 'violet'
	},
	balanced: {
		label: 'Balanced',
		description: 'Neutral application defaults.',
		spacing: 1,
		radius: 1,
		typeScale: 'default',
		raisedWithBorder: true,
		palette: 'indigo'
	},
	comfortable: {
		label: 'Comfortable',
		description: 'Relaxed everyday surfaces.',
		spacing: 1.15,
		radius: 1.25,
		typeScale: 'comfortable',
		raisedWithBorder: true,
		palette: 'emerald'
	},
	spacious: {
		label: 'Spacious',
		description: 'Roomy content layouts.',
		spacing: 1.35,
		radius: 1.5,
		typeScale: 'comfortable',
		raisedWithBorder: false,
		palette: 'amber'
	},
	sharp: {
		label: 'Sharp',
		description: 'Square, technical chrome.',
		spacing: 0.9,
		radius: 0,
		typeScale: 'default',
		raisedWithBorder: true,
		palette: 'cyan'
	},
	rounded: {
		label: 'Rounded',
		description: 'Soft, friendly controls.',
		spacing: 1,
		radius: 2.25,
		typeScale: 'default',
		raisedWithBorder: false,
		palette: 'rose'
	},
	display: {
		label: 'Display',
		description: 'Large editorial hierarchy.',
		spacing: 1.2,
		radius: 1.4,
		typeScale: 'large',
		raisedWithBorder: true,
		palette: 'plum'
	}
} as const satisfies Record<RuntimeThemePresetName, RuntimeThemePreset>;

class RuntimeThemePlayground {
	spacing = $state(1);
	spacingScaleValues = $state<number[]>(Object.values(defaultThemeSpacingScale));
	radius = $state(1);
	typeScale = $state<TypeScalePreset>('default');
	raisedWithBorder = $state(true);
	palette = $state<RuntimeColorPaletteName>('indigo');

	get selectedPreset() {
		return runtimeThemePresetNames.find((presetName) => {
			const preset = runtimeThemePresets[presetName];
			return (
				preset.spacing === this.spacing &&
				this.hasDefaultSpacingScale &&
				preset.radius === this.radius &&
				preset.typeScale === this.typeScale &&
				preset.raisedWithBorder === this.raisedWithBorder &&
				preset.palette === this.palette
			);
		});
	}

	get colorStyle() {
		return runtimeColorPaletteStyle(this.palette);
	}

	get spacingScale(): ThemeSpacingScale {
		const [xs, sm, md, lg, xl] = this.spacingScaleValues;
		return {
			xs: xs ?? defaultThemeSpacingScale.xs,
			sm: sm ?? defaultThemeSpacingScale.sm,
			md: md ?? defaultThemeSpacingScale.md,
			lg: lg ?? defaultThemeSpacingScale.lg,
			xl: xl ?? defaultThemeSpacingScale.xl
		};
	}

	get resolvedSpacingScale() {
		return Object.fromEntries(
			Object.entries(this.spacingScale).map(([step, multiplier]) => [
				step,
				`${Number((4 * this.spacing * multiplier).toFixed(1))}px`
			])
		) as Record<keyof ThemeSpacingScale, string>;
	}

	get hasDefaultSpacingScale() {
		return Object.values(defaultThemeSpacingScale).every(
			(multiplier, index) => this.spacingScaleValues[index] === multiplier
		);
	}

	get designTokens(): ThemeDesignTokenMap<readonly ['light', 'dark']> {
		const tokens = {
			spacing: this.spacing,
			spacingScale: this.spacingScale,
			radius: this.radius,
			typeScale: this.typeScale,
			raisedWithBorder: this.raisedWithBorder
		} satisfies ThemeDesignTokens;

		return {
			light: tokens,
			dark: tokens
		};
	}

	applyPreset(presetName: RuntimeThemePresetName) {
		const preset = runtimeThemePresets[presetName];
		this.spacing = preset.spacing;
		this.spacingScaleValues = Object.values(defaultThemeSpacingScale);
		this.radius = preset.radius;
		this.typeScale = preset.typeScale;
		this.raisedWithBorder = preset.raisedWithBorder;
		this.palette = preset.palette;
	}

	reset() {
		this.applyPreset('balanced');
	}
}

const [useRuntimeThemePlayground, setRuntimeThemePlayground] =
	createContext<RuntimeThemePlayground>();

export { useRuntimeThemePlayground };

export const createRuntimeThemePlayground = () =>
	setRuntimeThemePlayground(new RuntimeThemePlayground());
