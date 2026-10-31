import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';

// An <address> resets the browser's italic: it reads as plain text in the surrounding type.
const defaultRoot = cva({
	base: 'min-w-0 text-neutral not-italic',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		},
		layout: {
			block: 'flex flex-col',
			inline: 'inline'
		}
	},
	defaultVariants: {
		size: 'normal',
		layout: 'block'
	}
});

const defaultLine = cva({
	base: 'min-w-0',
	variants: {
		layout: {
			block: 'block',
			inline: 'inline'
		}
	},
	defaultVariants: {
		layout: 'block'
	}
});

const defaultEmpty = cva({
	base: 'text-neutral/70'
});

export const addressTheme = {
	root: defaultRoot,
	line: defaultLine,
	empty: defaultEmpty
};

export type AddressTheme = typeof addressTheme;
export type AddressThemeProps = InferComponentTheme<AddressTheme>;
export const setAddressTheme = setComponentTheme<AddressTheme>('address');
export const useAddressTheme = useComponentTheme<AddressTheme>('address', addressTheme);
