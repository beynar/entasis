import type { Component } from 'svelte';
import type { Params, SectionType } from './engine/types.js';

const sectionFiles = import.meta.glob<{ default: Component<{ params: Params }> }>(
	'./sections/*/*.svelte',
	{ eager: true }
);

/** The Svelte component a section type renders with, resolved from its `file`. */
export function sectionComponent(type: SectionType): Component<{ params: Params }> | undefined {
	return sectionFiles[`./sections/${type.file}`]?.default;
}
