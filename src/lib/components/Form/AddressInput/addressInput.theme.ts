import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';

const defaultParts = cva({
	base: '@container w-full min-w-0'
});

// The rows, one under the other.
const defaultGrid = cva({
	base: 'flex w-full min-w-0 flex-col',
	variants: {
		density: {
			compact: 'gap-sm',
			normal: 'gap-md',
			comfortable: 'gap-lg'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

// One row: its parts side by side by their widths (`--address-row-columns`) from 28rem of the
// field's width, stacked below.
const defaultRow = cva({
	base: 'grid w-full min-w-0 grid-cols-1 @md:grid-cols-[var(--address-row-columns)]',
	variants: {
		density: {
			compact: 'gap-sm',
			normal: 'gap-md',
			comfortable: 'gap-lg'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

const defaultPart = cva({
	base: 'min-w-0'
});

// The search input takes the field's width; the "enter by hand" link keeps to its start.
const defaultSearch = cva({
	base: 'flex w-full min-w-0 flex-col gap-xs [&>button]:self-start'
});

// A part's own error block: its message describes the part's input, but the address announces
// it, so the block stays out of sight and out of the accessibility tree.
const defaultPartErrors = cva({
	base: 'hidden'
});

export const addressInputTheme = {
	parts: defaultParts,
	grid: defaultGrid,
	row: defaultRow,
	part: defaultPart,
	search: defaultSearch,
	partErrors: defaultPartErrors
};

export type AddressInputTheme = typeof addressInputTheme;
export type AddressInputThemeProps = InferComponentTheme<AddressInputTheme>;
export const setAddressInputTheme = setComponentTheme<AddressInputTheme>('address-input');
export const useAddressInputTheme = useComponentTheme<AddressInputTheme>(
	'address-input',
	addressInputTheme
);
