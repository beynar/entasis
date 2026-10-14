import '@testing-library/jest-dom/vitest';
import { fireEvent, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';
import Avatar from './Avatar.svelte';
import AvatarGroup from './AvatarGroup.svelte';

const person = { name: 'Jane Doe', src: '/jane.png' };
const root = (container: HTMLElement) => container.querySelector<HTMLElement>('[data-avatar]')!;
const image = (container: HTMLElement) => container.querySelector('img')!;
const initials = (container: HTMLElement) =>
	container.querySelector<HTMLElement>('[data-avatar] div[aria-hidden="true"]');

// jsdom never fetches images, so `complete` is controlled here: a pending request reports false.
let complete = false;
beforeEach(() => {
	complete = false;
	vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockImplementation(() => complete);
});
afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});

describe('Avatar accessible name (DF-25)', () => {
	test('is one image named after the person in every state', async () => {
		const { container } = renderInTheme(Avatar, person);
		// loading
		expect(screen.getAllByRole('img')).toHaveLength(1);
		expect(screen.getByRole('img', { name: 'Jane Doe' })).toBe(root(container));
		expect(root(container)).toHaveAttribute('data-status', 'loading');
		// loaded
		await fireEvent.load(image(container));
		await waitFor(() => expect(root(container)).toHaveAttribute('data-status', 'loaded'));
		expect(screen.getAllByRole('img')).toHaveLength(1);
		// error
		await fireEvent.error(image(container));
		expect(screen.getAllByRole('img')).toHaveLength(1);
		expect(screen.getByRole('img', { name: 'Jane Doe' })).toBeInTheDocument();
		expect(root(container)).toHaveAttribute('data-status', 'error');
	});

	test('hides the image and the initials from the accessibility tree', () => {
		const { container } = renderInTheme(Avatar, person);
		expect(image(container)).toHaveAttribute('alt', '');
		expect(initials(container)).toHaveTextContent('JD');
		expect(initials(container)).toHaveAttribute('aria-hidden', 'true');
	});

	test('an avatar without src is named by the name, not announced as its initials', () => {
		const { container } = renderInTheme(Avatar, { name: 'Jane Doe' });
		expect(screen.getByRole('img', { name: 'Jane Doe' })).toBeInTheDocument();
		expect(screen.queryByText('JD')).not.toBeNull();
		expect(root(container)).toHaveAttribute('data-status', 'idle');
	});

	test('alt overrides the name and an empty alt makes the avatar decorative', async () => {
		const { rerender } = renderInTheme(Avatar, { ...person, alt: 'Profile photo' });
		expect(screen.getByRole('img', { name: 'Profile photo' })).toBeInTheDocument();
		await rerender({ alt: '' });
		expect(screen.queryByRole('img')).toBeNull();
	});
});

describe('Avatar status', () => {
	test('follows the image lifecycle and a new src starts again', async () => {
		const { container, rerender } = renderInTheme(Avatar, person);
		await fireEvent.error(image(container));
		expect(root(container)).toHaveAttribute('data-status', 'error');
		await rerender({ src: '/other.png' });
		expect(root(container)).toHaveAttribute('data-status', 'loading');
		await fireEvent.load(image(container));
		await waitFor(() => expect(root(container)).toHaveAttribute('data-status', 'loaded'));
		await rerender({ src: undefined });
		expect(root(container)).toHaveAttribute('data-status', 'idle');
	});

	test('a cached image is loaded as soon as it mounts', () => {
		complete = true;
		vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(32);
		vi.spyOn(HTMLImageElement.prototype, 'naturalHeight', 'get').mockReturnValue(32);
		const { container } = renderInTheme(Avatar, person);
		expect(root(container)).toHaveAttribute('data-status', 'loaded');
	});
});

describe('Avatar image attributes (DF-23)', () => {
	test('forwards the native attributes to the img', () => {
		const { container } = renderInTheme(Avatar, {
			...person,
			image: {
				srcset: '/jane.png 1x, /jane@2x.png 2x',
				sizes: '32px',
				crossorigin: 'anonymous',
				referrerpolicy: 'no-referrer',
				loading: 'lazy',
				decoding: 'async',
				fetchpriority: 'high'
			}
		});
		const img = image(container);
		expect(img).toHaveAttribute('srcset', '/jane.png 1x, /jane@2x.png 2x');
		expect(img).toHaveAttribute('sizes', '32px');
		expect(img).toHaveAttribute('crossorigin', 'anonymous');
		expect(img).toHaveAttribute('referrerpolicy', 'no-referrer');
		expect(img).toHaveAttribute('loading', 'lazy');
		expect(img).toHaveAttribute('decoding', 'async');
		expect(img).toHaveAttribute('fetchpriority', 'high');
	});

	test('a lazy image that has not been fetched keeps the initials on screen', () => {
		const { container } = renderInTheme(Avatar, { ...person, image: { loading: 'lazy' } });
		expect(initials(container)).toHaveTextContent('JD');
		expect(root(container)).toHaveAttribute('data-status', 'loading');
	});

	test('AvatarGroup forwards them to each avatar', () => {
		const { container } = renderInTheme(AvatarGroup, {
			items: [person, { name: 'John Roe', src: '/john.png' }],
			image: { loading: 'lazy', crossorigin: 'anonymous' }
		});
		const images = container.querySelectorAll('img');
		expect(images).toHaveLength(2);
		for (const img of images) {
			expect(img).toHaveAttribute('loading', 'lazy');
			expect(img).toHaveAttribute('crossorigin', 'anonymous');
		}
	});
});

// `fireEvent` waits on a real timer, which hangs under fake timers: dispatch directly and let the
// fake clock flush Svelte's microtasks.
const emit = async (target: HTMLElement, type: 'load' | 'error') => {
	target.dispatchEvent(new Event(type));
	await vi.advanceTimersByTimeAsync(0);
};

describe('Avatar fallbackDelay and revealDelay (DF-24)', () => {
	test('initials are immediate by default while the image loads', () => {
		const { container } = renderInTheme(Avatar, person);
		expect(initials(container)).toHaveTextContent('JD');
	});

	test('fallbackDelay holds the initials back while loading, then shows them', async () => {
		vi.useFakeTimers();
		const { container } = renderInTheme(Avatar, { ...person, fallbackDelay: 300 });
		expect(initials(container)).toBeNull();
		await vi.advanceTimersByTimeAsync(299);
		expect(initials(container)).toBeNull();
		await vi.advanceTimersByTimeAsync(1);
		expect(initials(container)).toHaveTextContent('JD');
	});

	test('an image that loads inside the delay never shows the initials', async () => {
		vi.useFakeTimers();
		const { container } = renderInTheme(Avatar, { ...person, fallbackDelay: 300 });
		await vi.advanceTimersByTimeAsync(100);
		await emit(image(container), 'load');
		await vi.advanceTimersByTimeAsync(1000);
		expect(root(container)).toHaveAttribute('data-status', 'loaded');
		expect(initials(container)).toBeNull();
	});

	test('an error shows the initials immediately', async () => {
		vi.useFakeTimers();
		const { container } = renderInTheme(Avatar, { ...person, fallbackDelay: 300 });
		expect(initials(container)).toBeNull();
		await emit(image(container), 'error');
		expect(initials(container)).toHaveTextContent('JD');
	});

	test('no src shows the initials immediately', () => {
		const { container } = renderInTheme(Avatar, { name: 'Jane Doe', fallbackDelay: 300 });
		expect(initials(container)).toHaveTextContent('JD');
	});

	test('revealDelay postpones a loaded image, and delay still works as its alias', async () => {
		vi.useFakeTimers();
		for (const props of [{ revealDelay: 200 }, { delay: 200 }]) {
			const { container, unmount } = renderInTheme(Avatar, { ...person, ...props });
			await emit(image(container), 'load');
			expect(root(container)).toHaveAttribute('data-status', 'loading');
			await vi.advanceTimersByTimeAsync(200);
			expect(root(container)).toHaveAttribute('data-status', 'loaded');
			unmount();
		}
	});

	test('revealDelay wins over the deprecated delay', async () => {
		vi.useFakeTimers();
		const { container } = renderInTheme(Avatar, { ...person, revealDelay: 0, delay: 500 });
		await emit(image(container), 'load');
		await vi.advanceTimersByTimeAsync(0);
		expect(root(container)).toHaveAttribute('data-status', 'loaded');
	});
});
