import type { Colors, Sizes } from '$lib/types/theme.js';
import type { SegmentedControlVariant } from '$lib/components/SegmentedControl/segmentedControl.props.js';
import type { SliderVariant } from '$lib/components/Form/Slider/slider.props.js';

export type ComponentControlValue = string | number | boolean;
export type ComponentControlValues = Record<string, ComponentControlValue>;

export type ComponentControlOption<Value extends string = string> =
	| Value
	| {
			value: Value;
			label: string;
			disabled?: boolean;
	  };

type ComponentControlBase<Name extends string, Value extends ComponentControlValue> = {
	name: Name;
	label: string;
	value: Value;
	disabled?: boolean;
	visible?: boolean | ((value: ComponentControlValues) => boolean);
};

export type ComponentSegmentedControlDefinition<
	Name extends string = string,
	Options extends readonly ComponentControlOption[] = readonly ComponentControlOption[]
> = ComponentControlBase<Name, string> & {
	type: 'segmented';
	options: Options;
	size?: Sizes;
	color?: Colors;
	variant?: SegmentedControlVariant;
	label?: string;
	class?: string;
};

export type ComponentSwitchControlDefinition<Name extends string = string> = ComponentControlBase<
	Name,
	boolean
> & {
	type: 'switch';
	size?: Sizes;
};

export type ComponentSliderControlDefinition<Name extends string = string> = ComponentControlBase<
	Name,
	number
> & {
	type: 'slider';
	min?: number;
	max?: number;
	step?: number;
	size?: Sizes;
	color?: Colors;
	variant?: SliderVariant;
	showValue?: boolean;
	class?: string;
};

export type ComponentControlDefinition =
	| ComponentSegmentedControlDefinition
	| ComponentSwitchControlDefinition
	| ComponentSliderControlDefinition;

type ComponentControlOptionValue<Option> = Option extends string
	? Option
	: Option extends { value: infer Value extends string }
		? Value
		: never;

type InferComponentControlValue<Control> = Control extends {
	type: 'segmented';
	options: infer Options extends readonly ComponentControlOption[];
}
	? ComponentControlOptionValue<Options[number]>
	: Control extends { type: 'switch' }
		? boolean
		: Control extends { type: 'slider' }
			? number
			: never;

export type InferComponentControlsValue<Controls extends readonly ComponentControlDefinition[]> = {
	[Control in Controls[number] as Control['name']]: InferComponentControlValue<Control>;
};

export type ComponentControls<
	Controls extends readonly ComponentControlDefinition[] = readonly ComponentControlDefinition[]
> = {
	readonly definitions: Controls;
	readonly value: InferComponentControlsValue<Controls>;
	setValue<Name extends Extract<keyof InferComponentControlsValue<Controls>, string>>(
		name: Name,
		value: InferComponentControlsValue<Controls>[Name]
	): void;
	isVisible(control: Controls[number]): boolean;
};

export function createComponentControls<
	const Controls extends readonly ComponentControlDefinition[]
>(definitions: Controls): ComponentControls<Controls> {
	const value = $state(
		Object.fromEntries(
			definitions.map((control) => [control.name, control.value])
		) as InferComponentControlsValue<Controls>
	);

	return {
		definitions,
		value,
		setValue(name, nextValue) {
			Object.assign(value, { [name]: nextValue });
		},
		isVisible(control) {
			return typeof control.visible === 'function'
				? control.visible(value)
				: control.visible !== false;
		}
	};
}
