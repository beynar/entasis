import type { Slot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Sizes } from '$lib/types/theme.js';
import type { HTMLAttributes } from 'svelte/elements';
import type { Address as AddressValue, AddressField } from './address.js';
import type { AddressThemeProps } from './address.theme.js';

/** `block` writes one line per row; `inline` joins the lines with ", " on one line. */
export type AddressLayout = 'block' | 'inline';

export type AddressProps = WithAttachments<
	Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> & {
		/** The address to display. */
		address: AddressValue | null | undefined;
		/** Parts to display. Defaults to every part. Their order follows the country, not this list. */
		fields?: readonly AddressField[];
		/** One line per row, or every line on one. */
		layout?: AddressLayout;
		/** Text size. */
		size?: Sizes;
		/** Shown when the address has nothing to display. Defaults to nothing. */
		empty?: Slot;
		/** Bindable reference to the root `<address>`. */
		ref?: HTMLElement | null;
		/** Additional classes for the root `<address>`. */
		class?: string;
		/** Per-instance theme overrides. */
		theme?: AddressThemeProps;
	}
>;
