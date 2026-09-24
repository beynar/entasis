import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultMediaVolumeControlRoot = cva({
	base: 'flex min-w-0 shrink-0 items-center',
	variants: {
		mode: {
			popover: '',
			inline: 'w-full'
		}
	},
	defaultVariants: {
		mode: 'popover'
	}
});

const defaultMediaVolumeControlPopoverPanel = cva({
	base: 'p-sm pb-md'
});

const defaultMediaVolumeControlPanel = cva({
	base: 'flex min-w-0 items-center gap-md p-xs',
	variants: {
		orientation: {
			horizontal: 'w-full',
			vertical: 'w-auto flex-col justify-center gap-sm px-0 pt-micro pb-0'
		}
	},
	defaultVariants: {
		orientation: 'horizontal'
	}
});

const defaultMediaVolumeControlSlider = cva({
	base: 'flex min-w-0 shrink-0 items-center justify-center',
	variants: {
		orientation: {
			horizontal: 'w-full',
			vertical: 'h-auto'
		}
	},
	defaultVariants: {
		orientation: 'horizontal'
	}
});

export const mediaVolumeControlTheme = {
	root: defaultMediaVolumeControlRoot,
	popoverPanel: defaultMediaVolumeControlPopoverPanel,
	panel: defaultMediaVolumeControlPanel,
	slider: defaultMediaVolumeControlSlider
};

export type MediaVolumeControlTheme = typeof mediaVolumeControlTheme;
export type MediaVolumeControlThemeProps = InferComponentTheme<MediaVolumeControlTheme>;
export const setMediaVolumeControlTheme =
	setComponentTheme<MediaVolumeControlTheme>('media-volume-control');
export const useMediaVolumeControlTheme = useComponentTheme(
	'mediaVolumeControl',
	mediaVolumeControlTheme
);
