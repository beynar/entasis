import type { Messages } from '$lib/i18n/en.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Address, AddressField, AddressProvider } from '../../Address/address.js';
import type { InputProps } from '../Field/field.js';
import type { AddressInputThemeProps } from './addressInput.theme.js';

/** One part's settings in `fields`. */
export type AddressFieldConfig = {
	/** The part. */
	field: AddressField;
	/** Share of its row, as a proportion of the other parts' widths. @default 1 */
	width?: number;
	/** Label, over the i18n catalog's. */
	label?: string;
	/** Hint in the empty input. The street line defaults to the search hint. */
	placeholder?: string;
};

/** A part, by name or with its settings. */
export type AddressFieldItem = AddressField | AddressFieldConfig;

/** A row of the layout: one part, or several side by side. */
export type AddressFieldRow = AddressFieldItem | readonly AddressFieldItem[];

/**
 * `fields`: one input per part, the street line searching as you type. `search`: one search
 * input showing the chosen address on one line, with a button to edit the parts by hand.
 */
export type AddressInputLayout = 'fields' | 'search';

export type AddressInputProps = WithAttachments<
	Omit<InputProps<'address'>, 'theme' | 'placeholder'> & {
		/**
		 * Searches addresses as the street line is typed and fills every part from the chosen
		 * suggestion. Defaults to the provider `setAddressProvider` set for the app, else to Google
		 * Places through the app's `/api/places` route (served by `createGooglePlacesProxy` from
		 * `entasis/address`; without that route the search turns itself off). `null` turns the
		 * search off: the parts are typed by hand.
		 */
		provider?: AddressProvider | null;
		/**
		 * The parts the field shows and how they are laid out: one row per entry, a part on its own
		 * or several side by side in an array, each by name or with its settings (`{ field, width,
		 * label, placeholder }`). Widths share a row by proportion; a narrow field stacks every part.
		 * @default ['line1', 'line2', [{ field: 'postalCode', width: 1 }, { field: 'city', width: 2 }], 'country']
		 */
		fields?: readonly AddressFieldRow[];
		/**
		 * Parts a person may type in. Others show what the search filled, read-only. Defaults to
		 * every shown part.
		 */
		editableFields?: readonly AddressField[];
		/**
		 * Parts that must be filled once the address is started (or always, when `required`).
		 * Defaults to the shown parts except `line2` and `region` when `required` is set, and to
		 * none otherwise.
		 */
		requiredFields?: readonly AddressField[];
		/** ISO 3166-1 alpha-2 codes the search and the country list are limited to. */
		countries?: readonly string[];
		/** Country code an address starts in, until the search or the person picks another. */
		defaultCountry?: string;
		/** One input per part, or one search input. @default 'fields' */
		layout?: AddressInputLayout;
		/** Characters typed before the search runs. @default 3 */
		minSearchLength?: number;
		/**
		 * Hint in the search input (the street line, or the single input of `layout="search"`).
		 * Defaults to the i18n `addressSearchPlaceholder`.
		 */
		placeholder?: string;
		/** Called with the address a chosen suggestion resolved to, after the value changed. */
		onResolve?: (address: Address) => void;
		/** Per-instance translations merged over the global i18n catalog. */
		i18n?: Partial<Messages>;
		/** Theme overrides for the parts grid and the surrounding field. */
		theme?: AddressInputThemeProps & InputProps<'address'>['theme'];
	}
>;
