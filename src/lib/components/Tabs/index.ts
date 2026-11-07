export { default as Tabs } from './Tabs.svelte';
export type {
	TabsApi,
	TabsProps,
	TabsPlacement,
	TabsRenderPayload,
	TabsValueChangePayload,
	TabsValueChangeReason
} from './tabs.props.js';
export type { TabsActivationDirection } from './tabs.direction.svelte.js';
export { createTabsPanels, TabsPanels } from './tabs.panels.svelte.js';
export {
	tabsTheme,
	setTabsTheme,
	useTabsTheme,
	type TabsTheme,
	type TabsThemeProps
} from './tabs.theme.js';
