import { createContext } from 'svelte';
import type {
	ThemeDesignTokenMap,
	ThemeDesignTokens,
	ThemeElevation,
	ThemeSpacingScale,
	TypeScalePreset
} from '$lib/components/Theme/theme.designTokens.js';
import { defaultThemeSpacingScale } from '$lib/components/Theme/theme.designTokens.js';
import {
	themePresetNames,
	themePresets,
	type ThemePresetName,
	type ThemePresetTokens
} from '$lib/components/Theme/theme.presets.js';
import {
	defaultMotionTokens,
	motionDurationSteps,
	presetFactor,
	radiusFactors,
	spacingFactors,
	type DeepPartial,
	type MotionEasingTokens,
	type MotionTokens
} from '$lib/tailwind/scales.js';
import {
	runtimeColorPaletteNames,
	runtimeColorPaletteStyle,
	type RuntimeColorPaletteName
} from './playground/runtimeColorPalettes.js';

type RuntimeThemePreset = ThemePresetTokens & {
	label: string;
	description: string;
	palette: RuntimeColorPaletteName;
};

export const runtimeThemePresetNames = themePresetNames;
export type RuntimeThemePresetName = ThemePresetName;

/** Docs-only colour pairing for each shipped preset (colours are not part of a preset). */
const presetPalettes: Record<ThemePresetName, RuntimeColorPaletteName> = {
	dense: 'graphite',
	compact: 'violet',
	balanced: 'default',
	comfortable: 'emerald',
	spacious: 'amber',
	sharp: 'cyan',
	rounded: 'rose',
	display: 'plum',
	editorial: 'graphite',
	glass: 'cyan',
	terminal: 'emerald'
};

// The playground starts from the presets the library ships (`entasis/theme`), so the docs
// can never drift from what an app gets.
export const runtimeThemePresets = Object.fromEntries(
	themePresetNames.map((name) => [
		name,
		{
			...themePresets[name].tokens,
			label: themePresets[name].label,
			description: themePresets[name].description,
			palette: presetPalettes[name]
		}
	])
) as Record<RuntimeThemePresetName, RuntimeThemePreset>;

/**
 * Easing kits for the motion control. Each one re-points the four easing roles at a
 * different family, so a single picker retunes every component that resolves the roles.
 */
export const runtimeMotionEasingPresets = {
	standard: {
		label: 'Standard',
		description: 'Library defaults.',
		easing: defaultMotionTokens.easing
	},
	gentle: {
		label: 'Gentle',
		description: 'Softer acceleration, no overshoot.',
		easing: { standard: 'sineInOut', enter: 'sineOut', exit: 'sineIn', emphasized: 'quadOut' }
	},
	snappy: {
		label: 'Snappy',
		description: 'Fast start, long settle.',
		easing: { standard: 'quintInOut', enter: 'expoOut', exit: 'expoIn', emphasized: 'circOut' }
	},
	playful: {
		label: 'Playful',
		description: 'Overshoots on the way in.',
		easing: { standard: 'backInOut', enter: 'backOut', exit: 'backIn', emphasized: 'backOut' }
	},
	linear: {
		label: 'Linear',
		description: 'No easing at all.',
		easing: { standard: 'linear', enter: 'linear', exit: 'linear', emphasized: 'linear' }
	}
} as const satisfies Record<
	string,
	{ label: string; description: string; easing: MotionEasingTokens }
>;

export type RuntimeMotionEasingPresetName = keyof typeof runtimeMotionEasingPresets;

export const runtimeMotionEasingPresetNames = Object.keys(
	runtimeMotionEasingPresets
) as RuntimeMotionEasingPresetName[];

/**
 * Presets may name a scale step (`radius: 'subtile'`) while the playground sliders drive
 * plain multipliers, so both sides are compared and applied as resolved factors.
 */
const presetSpacingFactor = (preset: RuntimeThemePreset) =>
	presetFactor(preset.spacing ?? 1, spacingFactors, 'spacing');

const presetRadiusFactor = (preset: RuntimeThemePreset) =>
	presetFactor(preset.radius ?? 1, radiusFactors, 'radius');

class RuntimeThemePlayground {
	spacing = $state(1);
	spacingScaleValues = $state<number[]>(Object.values(defaultThemeSpacingScale));
	radius = $state(1);
	typeScale = $state<TypeScalePreset>('default');
	elevation = $state<ThemeElevation>('normal');
	raisedWithBorder = $state(true);
	palette = $state<RuntimeColorPaletteName>('default');
	/** Multiplier applied to every duration step, so the whole scale speeds up together. */
	motionSpeed = $state(1);
	motionEasing = $state<RuntimeMotionEasingPresetName>('standard');

	get selectedPreset() {
		return runtimeThemePresetNames.find((presetName) => {
			const preset = runtimeThemePresets[presetName];
			return (
				presetSpacingFactor(preset) === this.spacing &&
				this.hasDefaultSpacingScale &&
				presetRadiusFactor(preset) === this.radius &&
				preset.typeScale === this.typeScale &&
				preset.elevation === this.elevation &&
				preset.raisedWithBorder === this.raisedWithBorder &&
				preset.palette === this.palette &&
				this.hasDefaultMotion
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

	/** The motion scale the sliders produce: every duration step scaled, roles re-pointed. */
	get motion(): DeepPartial<MotionTokens> {
		return {
			duration: Object.fromEntries(
				motionDurationSteps.map((step) => [
					step,
					Math.round(defaultMotionTokens.duration[step] * this.motionSpeed)
				])
			) as MotionTokens['duration'],
			easing: runtimeMotionEasingPresets[this.motionEasing].easing
		};
	}

	get hasDefaultMotion() {
		return this.motionSpeed === 1 && this.motionEasing === 'standard';
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
			elevation: this.elevation,
			motion: this.motion,
			raisedWithBorder: this.raisedWithBorder
		} satisfies ThemeDesignTokens;

		return {
			light: tokens,
			dark: tokens
		};
	}

	applyPreset(presetName: RuntimeThemePresetName) {
		const preset = runtimeThemePresets[presetName];
		this.spacing = presetSpacingFactor(preset);
		this.spacingScaleValues = Object.values(defaultThemeSpacingScale);
		this.radius = presetRadiusFactor(preset);
		this.typeScale = preset.typeScale;
		this.elevation = preset.elevation;
		this.raisedWithBorder = preset.raisedWithBorder;
		this.palette = preset.palette;
		this.motionSpeed = 1;
		this.motionEasing = 'standard';
	}

	reset() {
		this.applyPreset('balanced');
	}

	/** Plain snapshot of every lever, for persistence across reloads. */
	get snapshot(): RuntimeThemePlaygroundSnapshot {
		return {
			spacing: this.spacing,
			spacingScaleValues: [...this.spacingScaleValues],
			radius: this.radius,
			typeScale: this.typeScale,
			elevation: this.elevation,
			raisedWithBorder: this.raisedWithBorder,
			palette: this.palette,
			motionSpeed: this.motionSpeed,
			motionEasing: this.motionEasing
		};
	}

	restore(snapshot: Partial<RuntimeThemePlaygroundSnapshot>) {
		if (typeof snapshot.spacing === 'number') this.spacing = snapshot.spacing;
		if (Array.isArray(snapshot.spacingScaleValues)) {
			this.spacingScaleValues = snapshot.spacingScaleValues.filter((v) => typeof v === 'number');
		}
		if (typeof snapshot.radius === 'number') this.radius = snapshot.radius;
		if (snapshot.typeScale) this.typeScale = snapshot.typeScale;
		if (snapshot.elevation) this.elevation = snapshot.elevation;
		if (typeof snapshot.raisedWithBorder === 'boolean')
			this.raisedWithBorder = snapshot.raisedWithBorder;
		if (
			snapshot.palette &&
			(runtimeColorPaletteNames as readonly string[]).includes(snapshot.palette)
		) {
			this.palette = snapshot.palette;
		}
		if (typeof snapshot.motionSpeed === 'number') this.motionSpeed = snapshot.motionSpeed;
		if (snapshot.motionEasing && snapshot.motionEasing in runtimeMotionEasingPresets) {
			this.motionEasing = snapshot.motionEasing;
		}
	}
}

/** Cookie carrying the footer playground levers, so SSR paints the chosen tokens first. */
export const PLAYGROUND_COOKIE = 'entasis-docs-playground';

export type RuntimeThemePlaygroundSnapshot = {
	spacing: number;
	spacingScaleValues: number[];
	radius: number;
	typeScale: TypeScalePreset;
	elevation: ThemeElevation;
	raisedWithBorder: boolean;
	palette: RuntimeColorPaletteName;
	motionSpeed: number;
	motionEasing: RuntimeMotionEasingPresetName;
};

const [useRuntimeThemePlayground, setRuntimeThemePlayground] =
	createContext<RuntimeThemePlayground>();

export { useRuntimeThemePlayground };

export const createRuntimeThemePlayground = () =>
	setRuntimeThemePlayground(new RuntimeThemePlayground());
