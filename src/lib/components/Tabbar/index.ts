export { default as Tabbar } from './Tabbar.svelte';
export type {
	TabbarProps,
	TabItem,
	TabAlignment,
	TabOrientation,
	TabbarPosition,
	TabbarValueChangePayload,
	TabbarValueChangeReason
} from './tabbar.props.js';
export {
	tabbarTheme,
	setTabbarTheme,
	useTabbarTheme,
	type TabbarTheme,
	type TabbarThemeProps
} from './tabbar.theme.js';
