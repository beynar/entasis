import { untrack } from 'svelte';

export function createBindableValue<Value>(
	read: () => Value | undefined,
	write: (value: Value) => void,
	readDefault: () => Value
) {
	let retained: Value = $state(
		untrack(() => {
			const value = read();
			return value === undefined ? readDefault() : value;
		})
	);
	untrack(() => {
		if (read() === undefined) write(retained);
	});

	return {
		get value(): Value {
			const value = read();
			return value === undefined ? retained : value;
		},
		set value(value: Value) {
			retained = value;
			write(value);
		}
	};
}

export const bind = (ref: object, props: object) => {
	const descriptors = Object.getOwnPropertyDescriptors(props);
	for (const key in descriptors) {
		Object.defineProperty(ref, key, descriptors[key]);
	}
};

/**
 * Base class whose constructor copies the option property descriptors onto the instance, so a state
 * class reads its options as own members without class/interface declaration merging.
 */
export const withOptions = <Options extends object>() =>
	class {
		constructor(options: Options) {
			bind(this, options);
		}
	} as unknown as new (options: Options) => Options;

class BindableStateClass<P extends object> {
	constructor(props: P) {
		bind(this, props);
	}
}

// Type helper to create a properly typed bindable state class
type TypedBindableStateClass<P extends object> = new (props: P) => BindableStateClass<P> & P;

export const createBindableStateClass = <P extends object>() => {
	return class extends BindableStateClass<P> {
		constructor(props: P) {
			super(props);
		}
	} as TypedBindableStateClass<P>;
};

// Goal:
// The goal of this class is to allow state encapsulation inside a class while still being able the bind the state of this class to the props of a component.
// Such as :
// When props change, the state of the class should be updated.
// When the state of the class changes, the bindable props of the component should be updated.
// This make the bindable prop the unique source of truth for the state of the class.
// The class can be extended to add more methods and properties that will update the state of the class like any other class.

// Functionalities:
// - Get the bindable props of the class (props that have a getter and a setter)
// - Get the dynamic props of the class (props that have a getter and no setter) that should trigger effect on change
// - Get the static props of the class (props that have a value)
// - Define the dynamic props of the class (props that have a getter and a setter)
// - Define the static props of the class (every other props)

// Usage

// class Test extends createBindableStateClass<{ name: string; age: number }>() {
// 	constructor(props: { name: string; age: number }) {
// 		super(props);
// 	}
// }

// let {
// 	name = $bindable(),
// 	age = $bindable()
// }: {
// 	name: string;
// 	age: number;
// } = $props();

// const test = new Test({
// 	get name() {
// 		return name;
// 	},
// 	set name(value: string) {
// 		name = value;
// 	},
// 	get age() {
// 		return age;
// 	},
// 	set age(value: number) {
// 		age = value;
// 	}
// });
