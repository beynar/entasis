import type { ButtonProps } from '$lib/components/Button/index.js';
import type { DialogProps } from '$lib/components/Dialog/index.js';
import type { Slot } from '$lib/components/Slot/slot.js';
import type { FormProps } from '../Form/form.props.js';
import type { FormInputs, InferFormValue, LiveFormValue } from '../Form/form.js';

export type AskButton =
	| string
	| ({
			text: string;
	  } & Omit<
			ButtonProps,
			'children' | 'onclick' | 'loading' | 'href' | 'target' | 'rel' | 'download' | 'type' | 'ref'
	  >);

export type AskDialogOptions = Pick<DialogProps, 'type' | 'responsive' | 'size' | 'scroll'>;

export type AskOptions<I extends FormInputs> = Pick<
	FormProps<I>,
	'inputs' | 'value' | 'onSubmit' | 'class' | 'size' | 'density' | 'variant' | 'layout' | 'theme'
> & {
	/** Accessible title rendered in the Dialog header. */
	title: Slot;
	/** Supporting text rendered below the title. */
	description?: Slot;
	/** Submit action label or protected Button presentation props. */
	confirm: AskButton;
	/** Cancel action label or protected Button presentation props. */
	cancel: AskButton;
	/** Dialog presentation options. Dismissal behavior remains owned by Ask. */
	dialog?: AskDialogOptions;
};

export type AskResult<I extends FormInputs> =
	| {
			submitted: true;
			value: InferFormValue<I>;
	  }
	| {
			submitted: false;
			value: LiveFormValue<I>;
	  };

export type AskProps = {
	/** Default Dialog presentation used when a request does not provide dialog.type. */
	type?: DialogProps['type'];
};
