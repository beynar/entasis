/**
 * Class-variance engine vendored and trimmed from `cva`
 * (Copyright 2022 Joe Bell, Apache-2.0). The join + merge steps
 * come from `./merge.js`, where the `cn` engine is extended with the library's
 * own utility groups, and the original `defineConfig`/hooks indirection is
 * removed.
 */

import { cn } from './merge.js';
import type { ClassValue, CVA, CX, Compose } from './types.js';

export const cx: CX = cn;

const falsyToString = <T>(value: T) =>
	typeof value === 'boolean' ? `${value}` : value === 0 ? '0' : value;

export const cva: CVA = (config) => (props) => {
	if (config?.variants == null) return cx(config?.base, props?.class, props?.className);

	const { variants, defaultVariants } = config;

	const variantClassNames = Object.keys(variants).map((variant: keyof typeof variants) => {
		const variantProp = props?.[variant as keyof typeof props];
		const defaultVariantProp = defaultVariants?.[variant];

		const variantKey = (falsyToString(variantProp) ||
			falsyToString(defaultVariantProp)) as keyof (typeof variants)[typeof variant];

		return variants[variant][variantKey];
	});

	const defaultsAndProps: Record<string, unknown> = { ...defaultVariants };
	if (props) {
		for (const key in props) {
			const value = (props as Record<string, unknown>)[key];
			if (value !== undefined) defaultsAndProps[key] = value;
		}
	}

	const compoundClassNames: ClassValue[] = [];
	if (config.compoundVariants) {
		for (const { class: cvClass, className: cvClassName, ...cvConfig } of config.compoundVariants) {
			const matches = Object.entries(cvConfig).every(([cvKey, cvSelector]) => {
				const selector = defaultsAndProps[cvKey];
				return Array.isArray(cvSelector) ? cvSelector.includes(selector) : selector === cvSelector;
			});
			if (matches) compoundClassNames.push(cvClass, cvClassName);
		}
	}

	return cx(config.base, variantClassNames, compoundClassNames, props?.class, props?.className);
};

export const compose: Compose =
	(...components) =>
	(props) => {
		const propsWithoutClass = Object.fromEntries(
			Object.entries(props || {}).filter(([key]) => !['class', 'className'].includes(key))
		);

		return cx(
			components.map((component) => component(propsWithoutClass)),
			props?.class,
			props?.className
		);
	};
