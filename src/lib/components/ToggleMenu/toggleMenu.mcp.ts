export const toggleMenuDescription = `
# ToggleMenu Component

ToggleMenu renders standalone toggles, independent toggle groups, exclusive radio groups, menu buttons, and custom snippet controls as one accessible, responsive toolbar.

## Basic Usage

\`\`\`svelte
<script>
	import { ToggleMenu } from 'svelai/toggle-menu';

	let items = $state([
		{ type: 'toggle', prefix: eyeIcon, ariaLabel: 'Preview', value: true },
		{
			type: 'group',
			ariaLabel: 'Text formatting',
			value: { bold: true },
			items: {
				bold: { prefix: textBIcon, ariaLabel: 'Bold' },
				italic: { prefix: textItalicIcon, ariaLabel: 'Italic' }
			}
		},
		{
			type: 'menu',
			ariaLabel: 'Text color',
			prefix: paletteIcon,
			menu: getTextColorOptions
		}
	]);
</script>

<ToggleMenu bind:value={items} ariaLabel="Editor tools" />
\`\`\`

## Item Types

- **toggle**: A standalone ToggleButton configuration with \`type: 'toggle'\`. Its boolean \`value\` stores the pressed state.
- **group**: A labeled collection of independent toggles. Nested items are immutable configuration and the group \`value\` map owns their checked state.
- **radio-group**: A labeled collection of mutually exclusive toolbar choices. Its string \`value\` owns the checked radio and \`onValueChange\` receives the selected key.
- **menu**: A toolbar menu button. Its \`menu\` is a \`MenuItem[]\` or reactive factory and automatically becomes a submenu inside More.
- **custom**: A snippet control with \`type: 'custom'\`. Its \`children\` snippet receives the resolved toolbar state and a \`reference\` attachment for the primary focusable element. \`overflowItems\` is required so the control has an explicit representation inside More.

Groups are joined by default. Set \`joined: false\` when their buttons should remain visually separate.

## Props

- **value**: ToggleMenuItem[] (bindable) - Ordered toggles, groups, menu buttons, and custom controls.
- **defaultValue**: ToggleMenuItem[] - Initial toolbar value when value is omitted.
- **ariaLabel**: string (required) - Accessible name for the toolbar.
- **size**: 'small' | 'normal' | 'large' - Default size inherited by items.
- **color**: Colors - Default color inherited by items.
- **variant**: 'outline' | 'ghost' - Default variant inherited by items.
- **disabled**: boolean - Disables every item.
- **onValueChange**: (value) => void - Called once with the complete updated configuration.
- **class**: string - Additional classes for the toolbar root.
- **theme**: ToggleMenuThemeProps - Theme overrides for root, rail, units, and overflow trigger.

Item-level size, color, variant, and disabled values override toolbar defaults. Toggle, group, and radio-group callbacks receive their native checked value, value map, or selected key.

## Menu Buttons

A \`menu\` item renders a normal button with menu-button ARIA state and inherited toolbar styling. Pass a function when checked rows or other menu state must be recalculated reactively. \`closeOnItemClick\` defaults to \`true\`. ToggleMenu owns the PopupMenu attachments, tooltip, and overflow submenu representation.

## Custom Controls

\`ToggleMenuCustomPayload\` contains:

- **reference**: Attachment for the custom control's primary focusable element. Applying it includes the control in roving keyboard navigation.
- **size**, **color**, **variant**, **disabled**: Resolved toolbar or item values.
- **overflowed**: Whether the logical unit currently lives in More.

\`overflowItems\` accepts either a \`MenuItem[]\` or a function returning one. Use the function form when the overflow representation depends on reactive state. Popup triggers should attach both the toolbar \`reference\` and their own popover reference to the same button.

## Overflow

ToggleMenu stays on one row. When complete logical units no longer fit, it moves them into a More popup rather than wrapping or splitting a group. Toggle overflow rows use \`menuitemcheckbox\`; radio rows use \`menuitemradio\`. Both expose \`aria-checked\` and remain open while changing state. Menu buttons become submenus from the same menu data. Custom controls contribute their declared \`overflowItems\` as one logical unit.

## Keyboard And Tooltips

- The toolbar uses one roving tab stop.
- ArrowLeft and ArrowRight move between visible controls; Home and End move to the edges.
- Arrow navigation through a radio group does not change its value. Space, Enter, or click selects the focused radio.
- Disabled and overflowed controls are excluded from navigation.
- Icon-only toggle and menu controls automatically use their \`ariaLabel\` as tooltip content. Custom snippets own their tooltip and accessible label.
- Use \`radio-group\` for exclusive choices inside ToggleMenu and SegmentedControl for standalone exclusive controls.
`;
