import { getContext, setContext } from 'svelte';
import type { PopoverProps } from '../Popover/popover.props.js';

// A submenu is a second PopupMenu nested inside the first. Its panel must be the same panel
// one level down — same size, so the same padding and the same concentric radius — which nothing
// carries across on its own: the nested PopupMenu is rendered by the Menu, not by the consumer.
// The parent PopupMenu publishes its panel size here and MenuFloating reads it back.
const POPUP_MENU_PANEL_SIZE = Symbol('svelai:popup-menu-panel-size');

export type PopupMenuPanelSize = NonNullable<PopoverProps['size']>;

export const providePopupMenuPanelSize = (read: () => PopupMenuPanelSize) =>
	setContext(POPUP_MENU_PANEL_SIZE, read);

export const usePopupMenuPanelSize = (): (() => PopupMenuPanelSize) | undefined =>
	getContext<(() => PopupMenuPanelSize) | undefined>(POPUP_MENU_PANEL_SIZE);
