export { default as Confirmation } from './Confirmation.svelte';
export type { ConfirmationProps } from './confirmation.props.js';
export { confirmation, popconfirm } from './confirmation.state.svelte.js';
export type {
	ConfirmationPayload,
	ConfirmationHost,
	ConfirmationOutcome,
	PopconfirmHandler,
	PopconfirmOptions
} from './confirmation.state.svelte.js';
export {
	confirmationTheme,
	setConfirmationTheme,
	useConfirmationTheme,
	type ConfirmationTheme,
	type ConfirmationThemeProps
} from './confirmation.theme.js';
