import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { type InferComponentTheme, cva } from '$lib/utils/cva/index.js';

// The panel wrapping every control, top to bottom.
const defaultRoot = cva({
	base: 'inline-flex flex-col rounded-lg raised-1 bg-surface-raised select-none',
	variants: {
		size: {
			small: 'w-52 gap-md p-md',
			// Wide enough for a full rgb()/hsl() string in the bottom row's text input.
			normal: 'w-68 gap-lg p-lg',
			large: 'w-76 gap-lg p-lg'
		},
		disabled: {
			true: 'pointer-events-none opacity-60',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		disabled: false
	}
});

// The large saturation/value square. Its solid hue background is applied inline (dynamic),
// with the two static gradients layered on top via `areaSaturation` and `areaValue`.
const defaultArea = cva({
	base: 'relative w-full overflow-hidden rounded-md outline-none touch-none',
	variants: {
		size: {
			small: 'h-32',
			normal: 'h-40',
			large: 'h-44'
		},
		disabled: {
			true: 'cursor-not-allowed',
			false: 'cursor-crosshair'
		}
	},
	defaultVariants: {
		size: 'normal',
		disabled: false
	}
});

// White (left) → transparent gradient: drives saturation across the X axis.
const defaultAreaSaturation = cva({
	base: 'pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#fff,rgba(255,255,255,0))]'
});

// Transparent → black (bottom) gradient: drives value/brightness down the Y axis.
const defaultAreaValue = cva({
	base: 'pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,#000,rgba(0,0,0,0))]'
});

// Draggable circular thumb inside the square (white ring, transparent center so the color shows through).
const defaultAreaThumb = cva({
	base: 'absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)] outline-none ring-selected/60 focus-visible:ring-2 cursor-grab active:cursor-grabbing',
	variants: {
		size: {
			small: 'size-3',
			normal: 'size-4',
			large: 'size-5'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

// Row holding the eyedropper button and the stacked hue/alpha sliders.
const defaultControls = cva({
	base: 'flex items-center',
	variants: {
		size: {
			small: 'gap-md',
			normal: 'gap-md',
			large: 'gap-lg'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

// Square outline button that launches the native EyeDropper.
const defaultEyedropperButton = cva({
	base: 'state-layer flex shrink-0 items-center justify-center rounded-sm border border-neutral/25 text-neutral/70 transition-colors hover:text-neutral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/50 disabled:pointer-events-none disabled:opacity-50',
	variants: {
		size: {
			small: 'size-7',
			normal: 'size-9',
			large: 'size-10'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

// Column stacking the hue slider above the alpha slider.
const defaultSliders = cva({
	base: 'flex flex-1 flex-col justify-center',
	variants: {
		size: {
			small: 'gap-md',
			normal: 'gap-md',
			large: 'gap-lg'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

// Rainbow hue track (0–360).
const defaultHueTrack = cva({
	base: 'relative w-full rounded-full outline-none touch-none bg-[linear-gradient(to_right,#f00_0%,#ff0_17%,#0f0_33%,#0ff_50%,#00f_67%,#f0f_83%,#f00_100%)]',
	variants: {
		size: {
			small: 'h-2.5',
			normal: 'h-3',
			large: 'h-3.5'
		},
		disabled: {
			true: 'cursor-not-allowed',
			false: 'cursor-pointer'
		}
	},
	defaultVariants: {
		size: 'normal',
		disabled: false
	}
});

// Alpha track: a pure-CSS checkerboard base with the transparent → color gradient layered on top.
const defaultAlphaTrack = cva({
	base: 'relative w-full rounded-full outline-none touch-none bg-[repeating-conic-gradient(#c7c7c7_0%_25%,#fff_0%_50%)] bg-[length:8px_8px]',
	variants: {
		size: {
			small: 'h-2.5',
			normal: 'h-3',
			large: 'h-3.5'
		},
		disabled: {
			true: 'cursor-not-allowed',
			false: 'cursor-pointer'
		}
	},
	defaultVariants: {
		size: 'normal',
		disabled: false
	}
});

// Transparent → current-color overlay sitting above the checkerboard (color applied inline).
const defaultAlphaGradient = cva({
	base: 'pointer-events-none absolute inset-0 rounded-full'
});

// Round white knob shared by the hue and alpha sliders.
const defaultSliderThumb = cva({
	base: 'absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-white shadow-[0_1px_3px_rgba(0,0,0,0.4)] outline-none ring-selected/60 focus-visible:ring-2 cursor-grab active:cursor-grabbing',
	variants: {
		size: {
			small: 'size-3.5',
			normal: 'size-4',
			large: 'size-[18px]'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

// Bottom row: format select, color text input, alpha percentage input. Kept tight so the
// color text input gets as much width as possible for rgb()/hsl() strings.
const defaultInputs = cva({
	base: 'flex items-center',
	variants: {
		size: {
			small: 'gap-xs',
			normal: 'gap-sm',
			large: 'gap-md'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

// Native <select> for the text format (hex / rgb / hsl). The native arrow is replaced by a slim
// inline chevron so the control stays as narrow as its label.
const defaultSelect = cva({
	base: "shrink-0 appearance-none rounded-sm border border-neutral/25 bg-surface text-neutral outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-focus/50 disabled:pointer-events-none disabled:opacity-50 bg-no-repeat bg-[length:12px_12px] bg-[position:right_2px_center] bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%23808080%22%20stroke-width=%222.5%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%3E%3Cpath%20d=%22m6%209%206%206%206-6%22/%3E%3C/svg%3E')]",
	variants: {
		size: {
			small: 'h-control-sm pl-xs pr-lg text-xs',
			normal: 'h-control-md pl-xs pr-lg text-xs',
			large: 'h-control-lg pl-sm pr-lg text-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

// The text input showing / accepting the color in the selected format. Negative word-spacing
// halves the mono font's full-width spaces after rgb()/hsl() commas — the value text is unchanged.
const defaultInput = cva({
	base: 'min-w-0 flex-1 rounded-sm border border-neutral/25 bg-surface font-mono text-neutral outline-none focus-visible:ring-2 focus-visible:ring-focus/50 disabled:pointer-events-none disabled:opacity-50 [word-spacing:-0.5ch]',
	variants: {
		size: {
			small: 'h-control-sm px-sm text-xs',
			normal: 'h-control-md px-sm text-xs',
			large: 'h-control-lg px-md text-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

// Wrapper positioning the alpha input above its `%` suffix.
const defaultAlphaField = cva({
	base: 'relative shrink-0',
	variants: {
		size: {
			small: 'w-10',
			normal: 'w-11',
			large: 'w-12'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

// The 0–100 alpha percentage input (native number spinners hidden).
const defaultAlphaInput = cva({
	base: 'w-full rounded-sm border border-neutral/25 bg-surface text-neutral outline-none focus-visible:ring-2 focus-visible:ring-focus/50 disabled:pointer-events-none disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
	variants: {
		size: {
			small: 'h-control-sm pl-xs pr-lg text-xs',
			normal: 'h-control-md pl-sm pr-lg text-xs',
			large: 'h-control-lg pl-sm pr-lg text-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

// The static `%` glyph pinned to the trailing edge of the alpha input.
const defaultAlphaSuffix = cva({
	base: 'pointer-events-none absolute inset-y-0 flex items-center text-neutral/70',
	variants: {
		size: {
			small: 'right-1 text-xs',
			normal: 'right-1 text-xs',
			large: 'right-1.5 text-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

export const colorPickerTheme = {
	root: defaultRoot,
	area: defaultArea,
	areaSaturation: defaultAreaSaturation,
	areaValue: defaultAreaValue,
	areaThumb: defaultAreaThumb,
	controls: defaultControls,
	eyedropperButton: defaultEyedropperButton,
	sliders: defaultSliders,
	hueTrack: defaultHueTrack,
	alphaTrack: defaultAlphaTrack,
	alphaGradient: defaultAlphaGradient,
	sliderThumb: defaultSliderThumb,
	inputs: defaultInputs,
	select: defaultSelect,
	input: defaultInput,
	alphaField: defaultAlphaField,
	alphaInput: defaultAlphaInput,
	alphaSuffix: defaultAlphaSuffix
};

export type ColorPickerTheme = typeof colorPickerTheme;
export type ColorPickerThemeProps = InferComponentTheme<ColorPickerTheme>;
export const setColorPickerTheme = setComponentTheme<ColorPickerTheme>('color-picker');
export const useColorPickerTheme = useComponentTheme('color-picker', colorPickerTheme);
