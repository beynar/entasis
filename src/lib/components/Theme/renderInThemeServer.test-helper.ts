import type { Component, ComponentProps } from 'svelte';
import { render } from 'svelte/server';
import ThemeProviderHarness from './ThemeProviderHarness.test.svelte';

// Broad enough for every component shape `svelte2tsx` emits, so the props argument still infers
// from the component that was passed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = Component<any, any, any>;

/**
 * SSR counterpart of `renderInTheme`. `useTheme()` throws without a `<Theme>` above the component,
 * so a server-rendered component test mounts through the same harness the client tests use.
 */
export const renderInThemeServer = <C extends AnyComponent>(
	component: C,
	props?: ComponentProps<C>
) =>
	render(ThemeProviderHarness, {
		props: { component: component as unknown as Component<Record<string, unknown>>, ...props }
	});
