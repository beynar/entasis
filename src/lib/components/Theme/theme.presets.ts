import type {
	ThemeDesignTokens,
	ThemeElevation,
	ThemeRadius,
	ThemeSpacing,
	TypeScalePreset
} from './theme.designTokens.js';

/** The five tokens a preset always sets; everything else in `ThemeDesignTokens` stays open. */
export type ThemePresetTokens = ThemeDesignTokens & {
	spacing: ThemeSpacing;
	radius: ThemeRadius;
	typeScale: TypeScalePreset;
	elevation: ThemeElevation;
	raisedWithBorder: boolean;
};

/** A named bundle of design tokens: spacing, radius, type scale, elevation and borders travel together. */
export type ThemePreset = {
	label: string;
	description: string;
	/** Drop straight into `<Theme designTokens={{ light: preset.tokens, dark: preset.tokens }}>`. */
	tokens: ThemePresetTokens;
};

export const themePresetNames = [
	'dense',
	'compact',
	'balanced',
	'comfortable',
	'spacious',
	'sharp',
	'rounded',
	'display',
	'editorial',
	'glass',
	'terminal'
] as const;

export type ThemePresetName = (typeof themePresetNames)[number];

/**
 * The design-token presets the docs playground offers, shipped so an app can start from
 * one instead of tuning five tokens by hand. Colours are not part of a preset: they come
 * from the Tailwind plugin's theme block.
 */
export const themePresets = {
	dense: {
		label: 'Dense',
		description: 'Maximum information density.',
		tokens: {
			spacing: 0.65,
			radius: 0.5,
			typeScale: 'compact',
			elevation: 'normal',
			raisedWithBorder: true
		}
	},
	compact: {
		label: 'Compact',
		description: 'Tight product interfaces.',
		tokens: {
			spacing: 0.8,
			radius: 0.75,
			typeScale: 'compact',
			elevation: 'normal',
			raisedWithBorder: true
		}
	},
	balanced: {
		label: 'Balanced',
		description: 'Neutral application defaults.',
		tokens: {
			spacing: 1,
			radius: 1,
			typeScale: 'default',
			elevation: 'normal',
			raisedWithBorder: true
		}
	},
	comfortable: {
		label: 'Comfortable',
		description: 'Relaxed everyday surfaces.',
		tokens: {
			spacing: 1.15,
			radius: 1.25,
			typeScale: 'comfortable',
			elevation: 'normal',
			raisedWithBorder: true
		}
	},
	spacious: {
		label: 'Spacious',
		description: 'Roomy content layouts.',
		tokens: {
			spacing: 1.35,
			radius: 1.5,
			typeScale: 'comfortable',
			elevation: 'normal',
			raisedWithBorder: false
		}
	},
	sharp: {
		label: 'Sharp',
		description: 'Square, technical chrome.',
		tokens: {
			spacing: 0.9,
			radius: 0,
			typeScale: 'default',
			elevation: 'normal',
			raisedWithBorder: true
		}
	},
	rounded: {
		label: 'Rounded',
		description: 'Soft, friendly controls.',
		tokens: {
			spacing: 1,
			radius: 2.25,
			typeScale: 'default',
			elevation: 'normal',
			raisedWithBorder: false
		}
	},
	display: {
		label: 'Display',
		description: 'Large editorial hierarchy.',
		tokens: {
			spacing: 1.2,
			radius: 1.4,
			typeScale: 'large',
			elevation: 'normal',
			raisedWithBorder: true
		}
	},
	editorial: {
		label: 'Editorial',
		description: 'Long-form reading on flat paper.',
		tokens: {
			spacing: 'normal',
			radius: 'subtile',
			typeScale: 'large',
			elevation: 'flat',
			raisedWithBorder: true
		}
	},
	glass: {
		label: 'Glass',
		description: 'Round, airy panels with deep lift.',
		tokens: {
			spacing: 'large',
			radius: 'round',
			typeScale: 'comfortable',
			elevation: 'high',
			raisedWithBorder: false
		}
	},
	terminal: {
		label: 'Terminal',
		description: 'Square, compact, shadowless chrome.',
		tokens: {
			spacing: 'small',
			radius: 'none',
			typeScale: 'compact',
			elevation: 'flat',
			raisedWithBorder: true
		}
	}
} as const satisfies Record<ThemePresetName, ThemePreset>;
