import { onDestroy } from 'svelte';

export const useDebounce = <T extends unknown[]>(callback: (...args: T) => void, delay: number) => {
	let timeout: ReturnType<typeof setTimeout>;

	onDestroy(() => {
		clearTimeout(timeout);
	});
	return (...args: T) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => callback(...args), delay);
	};
};
