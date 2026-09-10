// Re-export for backwards compatibility
// All types and theme have been moved to separate files
export type {
	FormStep,
	MultiStepFormProps,
	MergedMultiStepFormInputs
} from './multiStepForm.props.js';
export {
	multiStepFormTheme,
	setMultiStepFormTheme,
	useMultiStepFormTheme,
	type MultiStepFormTheme,
	type MultiStepFormThemeProps
} from './multiStepForm.theme.js';
