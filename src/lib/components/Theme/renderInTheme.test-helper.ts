import { render } from '@testing-library/svelte';
import type { Component, ComponentProps } from 'svelte';
import ThemeProviderHarness from './ThemeProviderHarness.test.svelte';

// Broad enough for every component shape `svelte2tsx` emits, so the props argument still infers
// from the component that was passed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = Component<any, any, any>;

/**
 * Mount one component inside a `<Theme>`. Every entasis component reads the provider through
 * `useTheme()`, which throws when it is missing, so an isolated component test goes through here
 * rather than rendering a bare tree.
 */
export const renderInTheme = <C extends AnyComponent>(component: C, props?: ComponentProps<C>) =>
	render(ThemeProviderHarness, {
		props: { component: component as unknown as Component<Record<string, unknown>>, ...props }
	});
