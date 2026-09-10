export { default as FloatingWindow } from './FloatingWindow.svelte';
export type {
	FloatingWindowDimensionTuple,
	FloatingWindowDimensions,
	FloatingWindowDockPlacement,
	FloatingWindowDragFrom,
	FloatingWindowMovePayload,
	FloatingWindowPayload,
	FloatingWindowPosition,
	FloatingWindowProps,
	FloatingWindowResizePayload,
	FloatingWindowResizeDirection
} from './floatingWindow.props.js';
export {
	floatingWindowTheme,
	setFloatingWindowTheme,
	useFloatingWindowTheme,
	type FloatingWindowTheme,
	type FloatingWindowThemeProps
} from './floatingWindow.theme.js';
export { floatingWindowDescription } from './floatingWindow.mcp.js';
