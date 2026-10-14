export { default as Dialog } from './Dialog.svelte';
export type { DialogProps, DialogSnapPoint, DialogType } from './dialog.props.js';
export type { DialogApi } from './dialog.api.js';
export type { FocusOnClose } from '$lib/utils/useFocusScope.svelte.js';
export {
	dialogTheme,
	setDialogTheme,
	useDialogTheme,
	type DialogTheme,
	type DialogThemeProps
} from './dialog.theme.js';
