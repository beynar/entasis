import type { Colors } from '$lib/types/theme.js';
import { createRawSnippet } from 'svelte';
import type { SVGAttributes } from 'svelte/elements';

type IconProps = {
	size?: number | string;
	mirrored?: boolean;
	color?: (string & {}) | Colors;
} & Omit<SVGAttributes<SVGSVGElement>, 'color' | 'size'>;

const attributesToString = (attributes: SVGAttributes<SVGSVGElement>) => {
	let result = '';
	for (const key in attributes) {
		if (Object.prototype.hasOwnProperty.call(attributes, key)) {
			const value = attributes[key as keyof SVGAttributes<SVGSVGElement>];
			const isObject = typeof value === 'object';
			if (!isObject && value !== undefined) {
				result += `${key}="${value}" `;
			}
		}
	}
	return result.trim();
};

const sizeWithUnit = (size: number | string) => {
	if (typeof size === 'number') {
		return `${size}px`;
	}
	if (!size) {
		return '1lh';
	}
	return size;
};

const colorSet = new Set<Colors>([
	'primary',
	'secondary',
	'danger',
	'success',
	'warning',
	'info',
	'neutral'
]);
const isColor = (color?: string | Colors): color is Colors => colorSet.has(color as Colors);

const useSetup = (node: Element, args: (() => IconProps) | undefined) => {
	// Reconcile instead of only adding: dynamic classes (e.g. a conditional
	// rotate-180) must come OFF the node when the prop drops them.
	let prevClasses: string[] = [];
	$effect(() => {
		const { size, mirrored, color, class: className = '', ...attributes } = args?.() || {};
		// `size` is rendered into the markup by `render`; the setup pass only reconciles
		// attributes, so it is destructured here purely to keep it out of `attributes`.
		void size;
		for (const key in attributes) {
			const value = attributes[key as keyof typeof attributes];
			if (value !== undefined) {
				node.setAttribute(key, value);
			}
		}
		if (color) {
			if (isColor(color)) {
				node.setAttribute('fill', `var(--color-${color})`);
			} else {
				node.setAttribute('fill', color);
			}
		} else {
			node.setAttribute('fill', 'currentColor');
		}
		if (mirrored) node.setAttribute('transform', 'scale(-1, 1)');
		if (typeof className === 'string') {
			const classList = className.split(' ').filter(Boolean);
			for (const cls of prevClasses) {
				if (!classList.includes(cls)) node.classList.remove(cls);
			}
			for (const cls of classList) {
				node.classList.add(cls);
			}
			prevClasses = classList;
		}
	});
};
export const icon = (...paths: string[]) => {
	const render = (propsAccessor: () => IconProps) => {
		const { size, mirrored, color, class: className = '', ...rest } = propsAccessor();

		const icon = `<svg class="${className} aspect-square" 
		${attributesToString(rest)} ${mirrored ? 'transform="scale(-1, 1)"' : ''}
		xmlns="http://www.w3.org/2000/svg" 
		viewBox="0 0 256 256" 
		height="${sizeWithUnit(size || '1lh')}"
		fill="${isColor(color) ? `var(--color-${color})` : color || 'currentColor'}"
		>
          ${paths.map((path, i) => `<path d="${path}" ${paths.length === 2 && i === 0 ? "opacity='0.2'" : ''} />`).join('')}
        </svg>`;
		return icon;
	};

	const snippet = createRawSnippet<[IconProps] | []>((...args) => {
		return {
			render: () =>
				render(() => args[0]?.() || { size: '1lh', mirrored: false, color: 'currentColor' }),
			setup: (node) => {
				useSetup(node, () => {
					const value = args[0]?.() || { size: '1lh', mirrored: false, color: 'currentColor' };
					return value;
				});
			}
		};
	});

	Object.assign(snippet, {
		withProps: (props: IconProps) => {
			return createRawSnippet(() => {
				return {
					render: () =>
						render(() => props || { size: '1lh', mirrored: false, color: 'currentColor' }),
					setup: (node) => {
						useSetup(node, () => props);
					}
				};
			});
		}
	});

	return snippet as typeof snippet & {
		withProps: (props: IconProps) => typeof snippet;
	};
};
