import { SvelteSet } from 'svelte/reactivity';
import { useKeyDown } from './useKeyDown.svelte.js';
import { on } from 'svelte/events';
import { onDestroy, untrack } from 'svelte';
import { usePointerDown } from './usePointerDown.svelte.js';

type NavigationOptions = {
	enabled?: () => boolean;
	orientation?: 'horizontal' | 'vertical' | (() => 'horizontal' | 'vertical');
	loop?: boolean;
	id?: string;
	enableHoverFocus?: boolean;
	onChange?: (index: number | null) => void;
	defaultFocusedIndex?: () => number | null;
	preventKeyboardDefault?: boolean;
	/**
	 * Combobox-style navigation: keep DOM focus where it is (e.g. a search input) and
	 * only move the visual highlight + aria-activedescendant. Items never receive
	 * roving tabindex or DOM focus.
	 */
	virtualFocus?: boolean;
};

export const useNavigation = (opts: NavigationOptions) => {
	const itemsSet = new SvelteSet<HTMLElement>();
	let containerRef: HTMLElement | null = $state(null);
	let focusedIndex = $state<number | null>(null);
	let focusSource = $state<'keyboard' | 'pointer' | null>(null);
	let isHovering = $state(false);
	let isFocused = $state(false);
	let lastFocusedIndex = $state<number | null>(null);

	// Enabled by default — `enabled` is an opt-out, checked at event time so it stays reactive.
	const isEnabled = () => (opts.enabled ? opts.enabled() : true);

	$effect(() => {
		if (focusedIndex !== null && focusedIndex !== -1) {
			lastFocusedIndex = focusedIndex;
		}
	});
	// Generate ID if not provided
	const baseId = opts.id ?? `nav-${Math.random().toString(36).slice(2, 11)}`;

	// Get current orientation
	const getOrientation = () => {
		if (typeof opts.orientation === 'function') {
			return opts.orientation();
		}
		return opts.orientation || 'horizontal';
	};
	$effect(() => {
		if (focusedIndex === null) return;
		const newFocusedIndex = focusedIndex;
		untrack(() => {
			opts.onChange?.(newFocusedIndex);
		});
	});

	const cleanUp = () => {
		itemsSet.clear();
		containerRef = null;
		focusedIndex = null;
		focusSource = null;
		isHovering = false;
		isFocused = false;
		lastFocusedIndex = null;
	};

	onDestroy(() => {
		cleanUp();
	});
	const focusContainer = () => {
		if (containerRef) {
			focusedIndex = -1;
			containerRef.focus();
		}
	};

	// Derived: Get ordered items by DOM position
	const items = $derived.by(() => {
		if (itemsSet.size === 0) return [];
		if (containerRef === null) return [];
		const itemsArray = Array.from(itemsSet);
		// Sort by DOM position using compareDocumentPosition
		return itemsArray.sort((a, b) => {
			const position = a.compareDocumentPosition(b);
			if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
				return -1; // a comes before b
			} else if (position & Node.DOCUMENT_POSITION_PRECEDING) {
				return 1; // b comes before a
			}
			return 0;
		});
	});

	// Check if item is disabled
	const isItemDisabled = (item: HTMLElement) => {
		const dataDisabled = item.getAttribute('data-disabled');
		return (
			item.hasAttribute('disabled') ||
			item.getAttribute('aria-disabled') === 'true' ||
			(dataDisabled !== null && dataDisabled !== 'false')
		);
	};

	// Find next non-disabled index
	const findNextIndex = (currentIndex: number, direction: 1 | -1): number => {
		const { loop = true } = opts;
		const total = items.length;
		for (let distance = 1; distance <= total; distance += 1) {
			let nextIndex = currentIndex + direction * distance;
			if (loop) {
				nextIndex = ((nextIndex % total) + total) % total;
			} else if (nextIndex < 0 || nextIndex >= total) {
				return currentIndex;
			}
			if (!isItemDisabled(items[nextIndex])) return nextIndex;
		}
		return currentIndex;
	};

	// Find first non-disabled index
	const findFirstIndex = (): number => {
		for (let i = 0; i < items.length; i++) {
			if (!isItemDisabled(items[i])) return i;
		}
		return -1; // No enabled items
	};

	// Find last non-disabled index
	const findLastIndex = (): number => {
		for (let i = items.length - 1; i >= 0; i--) {
			if (!isItemDisabled(items[i])) return i;
		}
		return -1; // No enabled items
	};

	// Update ARIA attributes on all items
	const updateAriaAttributes = (focusIdx: number | null) => {
		// The roving tab-stop (the single item reachable with Tab): the focused item
		// when there is one, otherwise the default/active item, otherwise the first
		// enabled one. This makes Tab land on the meaningful item WITHOUT any element
		// being DOM-focused on mount (which would flash a focus ring). Virtual focus
		// keeps every item out of the tab order.
		const preferredTabStop = focusIdx ?? opts.defaultFocusedIndex?.();
		const enabledTabStop =
			preferredTabStop != null &&
			items[preferredTabStop] &&
			!isItemDisabled(items[preferredTabStop])
				? preferredTabStop
				: findFirstIndex();
		const tabStop = opts.virtualFocus ? -1 : enabledTabStop;
		items.forEach((item, index) => {
			const isFocused = index === focusIdx;
			const itemId = `${baseId}-item-${index}`;

			// Set ID
			if (!item.id) {
				item.id = itemId;
			}

			// Roving tabindex sits on the tab-stop; data-highlighted (below) tracks
			// actual keyboard focus, which is a separate concern.
			item.setAttribute('tabindex', index === tabStop && !isItemDisabled(item) ? '0' : '-1');

			// Set data-highlighted for keyboard focus
			if (isFocused) {
				item.setAttribute('data-highlighted', 'true');
			} else {
				item.removeAttribute('data-highlighted');
			}
		});

		// Update container's aria-activedescendant to focused item
		if (containerRef && focusIdx !== null && items[focusIdx]) {
			containerRef.setAttribute('aria-activedescendant', items[focusIdx].id);
		} else if (containerRef) {
			containerRef.removeAttribute('aria-activedescendant');
		}
	};

	// Move focus to specific index (arrow key navigation)
	const moveFocusTo = (index: number) => {
		if (items.length === 0) return;
		if (index < 0 || index >= items.length) return;
		if (isItemDisabled(items[index])) return;

		focusSource = 'keyboard';
		focusedIndex = index;
		updateAriaAttributes(index);

		if (items[index]) {
			const item = items[index];
			// Virtual focus (combobox pattern): DOM focus stays put, only the highlight moves.
			if (!opts.virtualFocus) {
				item.focus();
			}
			// Scroll the item into view if needed
			item.scrollIntoView({
				block: 'nearest',
				inline: 'nearest',
				behavior: 'smooth'
			});
		}
	};

	// Click the currently focused item (Enter/Space key)
	const clickFocused = () => {
		if (focusedIndex === null || focusedIndex < 0 || focusedIndex >= items.length) return;
		if (isItemDisabled(items[focusedIndex])) return;

		// Trigger click event on the focused element
		items[focusedIndex].click();
	};

	// Clear focus state when container loses focus
	const clearFocus = () => {
		focusedIndex = null;
		focusSource = null;

		// Restore the default roving tab stop while removing the active highlight.
		updateAriaAttributes(null);
	};

	// Handle item hover - only set visual focus (no DOM focus yet)
	const handleItemHover = (itemElement: HTMLElement) => {
		// Find the index of the hovered item
		const index = items.findIndex((item) => item === itemElement);
		if (index === -1) return;
		if (isItemDisabled(items[index])) return;

		// Set visual focus on hovered item (don't manipulate DOM focus)
		focusSource = 'pointer';
		focusedIndex = index;
		updateAriaAttributes(index);
	};

	// Handle keyboard events

	// Batch update ARIA attributes when items or focusedIndex change
	$effect(() => {
		if (items.length > 0) {
			updateAriaAttributes(focusedIndex);
		}
	});

	const pointerDown = usePointerDown({
		isActive: () => true
	});

	// Use the existing useKeyDown hook - pass all possible keys, filter in handleKeyboard
	const keyDown = useKeyDown({
		isActive: () => {
			if (!isEnabled()) return false;
			if (isHovering && opts.enableHoverFocus) {
				return true;
			}
			return true;
		},
		preventDefault: opts.preventKeyboardDefault,
		onWindow: () => {
			// return false;
			return isHovering && !isFocused && opts.enableHoverFocus ? true : false;
		},
		callback: (event: KeyboardEvent) => {
			// Respect the enabled gate per-event: the element listener is attached once at mount and
			// never re-checks isActive, so without this a disabled menu (e.g. a parent whose submenu
			// is open) would still handle keys that bubble to it and double-navigate.
			if (!isEnabled()) return;

			// Hover-to-navigate must not hijack when focus already lives inside another menu/listbox
			// (e.g. an open submenu portaled elsewhere): stealing focus here would yank the caret out
			// of the submenu and navigate this container instead.
			const active = document.activeElement;
			if (
				active &&
				!containerRef?.contains(active) &&
				active.closest('[role="menu"],[role="listbox"]')
			) {
				return;
			}

			// If hovering but container not focused, focus it first on arrow key
			if (
				isHovering &&
				opts.enableHoverFocus &&
				containerRef &&
				document.activeElement !== containerRef &&
				!containerRef.contains(document.activeElement)
			) {
				containerRef.focus();
			}

			const orientation = getOrientation();

			if (!opts.preventKeyboardDefault && event.key !== 'Escape') {
				event.preventDefault();
			}
			switch (event.key) {
				case 'ArrowLeft':
					if (orientation === 'horizontal') {
						const currentIdx = focusedIndex ?? findFirstIndex();
						if (currentIdx !== -1) {
							moveFocusTo(findNextIndex(currentIdx, -1));
						}
					} else if (focusedIndex !== null) {
						const node = items[focusedIndex];
						if ('onPrevious' in node && typeof node.onPrevious === 'function') {
							node.onPrevious();
						}
					}
					break;
				case 'ArrowRight':
					if (orientation === 'horizontal') {
						const currentIdx = focusedIndex ?? findFirstIndex();
						if (currentIdx !== -1) {
							moveFocusTo(findNextIndex(currentIdx, 1));
						}
					} else if (focusedIndex !== null) {
						const node = items[focusedIndex];
						if ('onNext' in node && typeof node.onNext === 'function') {
							node.onNext();
						}
					}
					break;
				case 'ArrowUp':
					if (orientation === 'vertical') {
						const currentIdx = focusedIndex ?? findFirstIndex();
						if (currentIdx !== -1) {
							moveFocusTo(findNextIndex(currentIdx, -1));
						} else {
							moveFocusTo(findLastIndex());
						}
					}
					break;
				case 'ArrowDown':
					if (orientation === 'vertical') {
						const currentIdx = focusedIndex ?? findFirstIndex();
						if (currentIdx !== -1) {
							moveFocusTo(findNextIndex(currentIdx, 1));
						} else {
							moveFocusTo(findFirstIndex());
						}
					}
					break;
				case 'Home': {
					const firstIndex = findFirstIndex();
					if (firstIndex !== -1) {
						moveFocusTo(firstIndex);
					}
					break;
				}
				case 'End': {
					const lastIndex = findLastIndex();
					if (lastIndex !== -1) {
						moveFocusTo(lastIndex);
					}
					break;
				}
				case 'Escape': {
					if (containerRef?.contains(document.activeElement)) {
						clearFocus();
					}
					break;
				}

				case 'Enter':
				case ' ':
					clickFocused();
					break;
			}
		},
		keys: ['Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', ' ']
	});

	return {
		containerReference: (node: HTMLElement) => {
			return untrack(() => {
				containerRef = node;

				// Make container focusable for keyboard navigation (virtual focus keeps
				// DOM focus on the consumer's own element, e.g. a combobox input).
				if (!node.hasAttribute('tabindex') && !opts.virtualFocus) {
					node.setAttribute('tabindex', '0');
				}

				// Apply keydown reference
				const keyDownCleanup = keyDown.reference?.(node);

				// Handle focus event - set focus to first item when container receives focus
				const handleFocus = () => {
					isFocused = true;

					if (focusedIndex === null && !pointerDown.isDown) {
						const firstIndex = opts.defaultFocusedIndex?.() ?? findFirstIndex();
						if (firstIndex !== -1) {
							moveFocusTo(firstIndex);
						}
					}
				};

				const focusCleanup = on(node, 'focusin', handleFocus);

				// Handle blur event - reset focus when container loses focus
				const handleBlur = (event: FocusEvent) => {
					isFocused = false;
					// Check if focus moved outside the container
					const relatedTarget = event.relatedTarget as HTMLElement | null;
					if (!relatedTarget || !node.contains(relatedTarget)) {
						// Focus moved outside, clear focus state
						clearFocus();
					}
				};

				const blurCleanup = on(node, 'focusout', handleBlur);

				// Handle container pointer enter - track hovering state
				const handleContainerEnter = () => {
					isHovering = true;
				};

				const containerEnterCleanup = on(node, 'pointerenter', handleContainerEnter);

				// Handle pointer leave - clear focus only if it was set by pointer
				const handlePointerLeave = () => {
					isHovering = false;

					if (focusSource === 'pointer') {
						clearFocus();
					}
				};

				const pointerLeaveCleanup = on(node, 'pointerleave', handlePointerLeave);
				const pointerDownCleanup = pointerDown.reference?.(node);
				// NOTE: we intentionally do NOT move DOM focus to `defaultFocusedIndex`
				// on mount — a tablist/menu must not steal focus just by existing (it
				// caused a focus-visible ring on the first tab on page load). Consumers
				// that want focus-on-mount opt in explicitly (e.g. Menu's `focusOnMount`
				// via onMount). Tabbing into the container still focuses the active item
				// through the `focusin` handler above, and the roving tab-stop
				// (updateAriaAttributes) makes the active item directly Tab-reachable.
				return () => {
					cleanUp();
					keyDownCleanup?.();
					focusCleanup();
					blurCleanup();
					containerEnterCleanup();
					pointerLeaveCleanup();
					pointerDownCleanup?.();
				};
			});
		},
		itemReference: (node: HTMLElement) => {
			return untrack(() => {
				// Add item to set
				itemsSet.add(node);

				// ARIA attributes are now batch-updated via $effect
				const handleFocus = () => {
					const index = items.findIndex((item) => item === node);
					if (index === -1 || isItemDisabled(node)) return;

					focusSource = 'keyboard';
					focusedIndex = index;
					updateAriaAttributes(index);
				};

				const focusCleanup = on(node, 'focus', handleFocus);

				// Handle hover - only move focus if enabled
				const handleHover = () => {
					if (isEnabled() && opts.enableHoverFocus !== false && !isItemDisabled(node)) {
						handleItemHover(node);
					}
				};

				const hoverCleanup = on(node, 'pointerenter', handleHover);

				return () => {
					// Remove item from set
					itemsSet.delete(node);
					focusCleanup();
					hoverCleanup();
				};
			});
		},
		// Expose focused index for external use
		get focusedIndex() {
			return focusedIndex;
		},
		// Expose control methods
		focusItem: (index: number) => {
			if (index >= 0 && index < items.length) {
				moveFocusTo(index);
			}
		},
		focusFirst: () => {
			const firstIndex = findFirstIndex();
			if (firstIndex !== -1) {
				moveFocusTo(firstIndex);
			}
		},
		focusLast: () => {
			const lastIndex = findLastIndex();
			if (lastIndex !== -1) {
				moveFocusTo(lastIndex);
			}
		},
		clearFocus: () => {
			clearFocus();
		},
		/**
		 * Re-sync the pointer highlight with the browser's real :hover state. While a
		 * submenu is open the parent nav is disabled, so the highlight freezes on the
		 * trigger row; when the submenu closes, the row actually under the mouse (if
		 * any) should be highlighted instead of the stale trigger.
		 */
		syncPointerFocus: () => {
			const hovered = items.findIndex((item) => item.matches(':hover') && !isItemDisabled(item));
			if (hovered !== -1) {
				handleItemHover(items[hovered]);
			} else if (focusSource === 'pointer') {
				clearFocus();
			}
		},
		get lastFocusedIndex() {
			return lastFocusedIndex;
		},
		focusContainer: focusContainer
	};
};
