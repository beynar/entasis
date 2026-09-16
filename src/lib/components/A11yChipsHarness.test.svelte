<script lang="ts">
	// Harness for the verified feature chips in `a11y-chips.svelte.test.ts`. One scenario per
	// docs claim, wrapped in <Theme> so overlays and floating windows get their context.
	import Theme from './Theme/Theme.svelte';
	import Breadcrumbs from './Breadcrumbs/Breadcrumbs.svelte';
	import Button from './Button/Button.svelte';
	import Carousel from './Carousel/Carousel.svelte';
	import Collapsible from './Collapsible/Collapsible.svelte';
	import Combobox from './Form/Combobox/Combobox.svelte';
	import ColorPicker from './Form/ColorPicker/ColorPicker.svelte';
	import Command from './Command/Command.svelte';
	import Confirmation from './Confirmation/Confirmation.svelte';
	import Dialog from './Dialog/Dialog.svelte';
	import Popover from './Popover/Popover.svelte';
	import { confirmation } from './Confirmation/confirmation.state.svelte.js';
	import CalendarInput from './Form/Calendar/CalendarInput.svelte';
	import FloatingWindow from './FloatingWindow/FloatingWindow.svelte';
	import Form from './Form/Form/Form.svelte';
	import HoverCard from './HoverCard/HoverCard.svelte';
	import Menu from './Menu/Menu.svelte';
	import MenuBar from './MenuBar/MenuBar.svelte';
	import MenuOption from './MenuOption/MenuOption.svelte';
	import Pagination from './Pagination/Pagination.svelte';
	import PinInput from './Form/PinInput/PinInput.svelte';
	import PopupMenu from './PopupMenu/PopupMenu.svelte';
	import RadioInput from './Form/RadioInput/RadioInput.svelte';
	import RatingInput from './Form/RatingInput/RatingInput.svelte';
	import Resizable from './Resizable/Resizable.svelte';
	import ScrollArea from './ScrollArea/ScrollArea.svelte';
	import Select from './Form/Select/Select.svelte';
	import Separator from './Separator/Separator.svelte';
	import Slider from './Form/Slider/Slider.svelte';
	import Switch from './Form/Switch/Switch.svelte';
	import Tabs from './Tabs/Tabs.svelte';
	import ToggleMenu from './ToggleMenu/ToggleMenu.svelte';
	import type { MenuItem } from './Menu/menu.props.js';
	import type { ToggleMenuItem } from './ToggleMenu/toggleMenu.props.js';

	type Scenario =
		| 'breadcrumbs'
		| 'button'
		| 'carousel'
		| 'collapsible'
		| 'color-picker'
		| 'combobox'
		| 'command'
		| 'confirmation'
		| 'dialog'
		| 'popover'
		| 'calendar'
		| 'floating-window'
		| 'form'
		| 'hover-card'
		| 'menu'
		| 'menu-bar'
		| 'menu-option'
		| 'pagination'
		| 'pin-input'
		| 'popup-menu'
		| 'radios'
		| 'rating'
		| 'resizable'
		| 'scroll-area'
		| 'select'
		| 'separator'
		| 'slider'
		| 'switch'
		| 'tabs'
		| 'toggle-menu';

	let {
		scenario,
		onSubmit,
		onSelect,
		dismissable = true
	}: {
		scenario: Scenario;
		onSubmit?: (value: unknown) => void;
		onSelect?: (value: unknown) => void;
		/** Dialog/Popover scenarios: toggles closeOnEscape and closeOnClickOutside together. */
		dismissable?: boolean;
	} = $props();

	const zero = { in: { duration: 0 }, out: { duration: 0 } };
	const menuItems: MenuItem[] = [
		{ type: 'option', title: 'Archive' },
		{ type: 'option', title: 'Copy' },
		{ type: 'option', title: 'Delete' }
	];
	const fruits = [
		{ value: 'apple', label: 'Apple' },
		{ value: 'banana', label: 'Banana' },
		{ value: 'cherry', label: 'Cherry' }
	];
	let toggleItems = $state<ToggleMenuItem[]>([
		{ type: 'toggle', children: 'Bold' },
		{ type: 'toggle', children: 'Italic' },
		{ type: 'toggle', children: 'Underline' }
	]);
	let windowOpen = $state(true);
	let confirmed = $state<string>('pending');
	let switchValue = $state(false);
	let comboboxValue = $state<string | null>(null);
	let selectValue = $state<string | null>(null);
</script>

<Theme>
	{#if scenario === 'breadcrumbs'}
		<Breadcrumbs
			items={[
				{ label: 'Home', href: '/' },
				{ label: 'Products', href: '/products' },
				{ label: 'Electronics', href: '/products/electronics', active: true }
			]}
		/>
	{:else if scenario === 'button'}
		<Button label="Save changes">Save</Button>
		<Button label="Open docs" href="/docs">Docs</Button>
	{:else if scenario === 'carousel'}
		<Carousel
			items={['one', 'two', 'three']}
			pagination={{ variant: 'dots', color: 'primary' }}
			navigationButton={{ color: 'primary' }}
		>
			{#snippet children(item)}
				<p>{item}</p>
			{/snippet}
		</Carousel>
	{:else if scenario === 'collapsible'}
		<Collapsible>
			{#snippet trigger()}
				<span>Show details</span>
			{/snippet}
			<p>Hidden details</p>
		</Collapsible>
	{:else if scenario === 'color-picker'}
		<ColorPicker value="#ff0000" />
	{:else if scenario === 'combobox'}
		<Combobox label="Fruit" items={fruits} bind:value={comboboxValue} />
		<output data-testid="combobox-value">{String(comboboxValue)}</output>
	{:else if scenario === 'command'}
		<Command
			items={[{ heading: 'Suggestions', items: fruits }]}
			onSelect={(value) => onSelect?.(value)}
		/>
	{:else if scenario === 'confirmation'}
		<Confirmation />
		<button
			type="button"
			onclick={async () => {
				const result = await confirmation({
					title: 'Delete item',
					description: 'This cannot be undone.',
					confirm: 'Delete',
					cancel: 'Keep'
				});
				confirmed = String(result.confirmed);
			}}
		>
			Ask
		</button>
		<output data-testid="confirmed">{confirmed}</output>
	{:else if scenario === 'dialog'}
		<Dialog
			responsive={false}
			transition={zero}
			closeOnEscape={dismissable}
			closeOnClickOutside={dismissable}
			title="Chip dialog"
		>
			{#snippet trigger(dialog)}
				<button type="button" onclick={dialog.open}>Open dialog</button>
			{/snippet}
			<p>Dialog body</p>
		</Dialog>
	{:else if scenario === 'popover'}
		<Popover
			transition={zero}
			trigger={{ content: 'Open popover' }}
			closeOnEscape={dismissable}
			closeOnClickOutside={dismissable}
		>
			<p>Popover body</p>
		</Popover>
	{:else if scenario === 'calendar'}
		<CalendarInput type="calendar" label="Pick a date" value={new Date(2024, 0, 10)} />
	{:else if scenario === 'floating-window'}
		<FloatingWindow bind:open={windowOpen} title="Notes">
			<p>Window body</p>
		</FloatingWindow>
		<output data-testid="window-open">{String(windowOpen)}</output>
	{:else if scenario === 'form'}
		<Form
			inputs={{
				name: { type: 'text', label: 'Name', required: true },
				email: { type: 'email', label: 'Email', required: true }
			}}
			onSubmit={(value) => onSubmit?.(value)}
			actions={[{ children: 'Submit', onAction: (form) => void form.submit() }]}
		/>
	{:else if scenario === 'hover-card'}
		<HoverCard
			trigger={{ content: '@svelai' }}
			delay={0}
			title="svelai"
			description="Hover card body"
			transition={zero}
		/>
	{:else if scenario === 'menu'}
		<Menu items={menuItems} focusOnMount />
	{:else if scenario === 'menu-bar'}
		<MenuBar
			menus={[
				{ label: 'File', items: [{ type: 'option', title: 'New file' }] },
				{ label: 'Edit', items: [{ type: 'option', title: 'Undo' }] },
				{ label: 'View', items: [{ type: 'option', title: 'Zoom' }] }
			]}
		/>
	{:else if scenario === 'menu-option'}
		<MenuOption title="Disabled option" disabled />
		<MenuOption title="Selected option" role="option" selected />
	{:else if scenario === 'pagination'}
		<Pagination value={2} totalPages={5} />
		<Pagination
			value={2}
			totalPages={5}
			label="Pages (fr)"
			getItemLabel={(item) =>
				item.type === 'page' ? `Aller à la page ${item.page}` : `Aller: ${item.type}`}
		/>
	{:else if scenario === 'pin-input'}
		<PinInput label="Code" length={4} />
	{:else if scenario === 'popup-menu'}
		<PopupMenu menu={{ items: menuItems }} transition={zero}>
			{#snippet trigger(popover)}
				<button type="button" onclick={popover.toggle} {@attach popover.reference}>
					Open menu
				</button>
			{/snippet}
		</PopupMenu>
	{:else if scenario === 'radios'}
		<RadioInput
			label="Plan"
			name="plan"
			items={[
				{ value: 'free', label: 'Free' },
				{ value: 'pro', label: 'Pro' }
			]}
		/>
	{:else if scenario === 'rating'}
		<RatingInput label="Overall rating" value={2} />
	{:else if scenario === 'resizable'}
		<Resizable
			handle
			panels={[
				{ id: 'left', defaultSize: 50, content: panel },
				{ id: 'right', defaultSize: 50, content: panel }
			]}
		/>
	{:else if scenario === 'scroll-area'}
		<ScrollArea class="h-10">
			<p>Scrollable content</p>
		</ScrollArea>
	{:else if scenario === 'select'}
		<Select label="Fruit" items={fruits} bind:value={selectValue} />
		<output data-testid="select-value">{String(selectValue)}</output>
	{:else if scenario === 'separator'}
		<Separator orientation="vertical" />
		<div data-testid="decorative"><Separator decorative /></div>
	{:else if scenario === 'slider'}
		<Slider label="Volume" value={30} min={0} max={100} />
	{:else if scenario === 'switch'}
		<Switch label="Notifications" labelPosition="top" bind:value={switchValue} />
		<output data-testid="switch-value">{String(switchValue)}</output>
	{:else if scenario === 'tabs'}
		<Tabs items={['Overview', 'Settings', 'Billing']}>
			{#snippet children({ item })}
				<p>{item} panel</p>
			{/snippet}
		</Tabs>
	{:else if scenario === 'toggle-menu'}
		<ToggleMenu bind:items={toggleItems} label="Editor tools" />
	{/if}
</Theme>

{#snippet panel()}
	<p>Panel</p>
{/snippet}
