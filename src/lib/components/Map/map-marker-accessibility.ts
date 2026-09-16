type MapMarkerTriggerAccessibilityOptions = {
	isInteractive: boolean;
	isFocusable: boolean;
	label: string;
	activate: () => void;
};

type ManagedAttribute = {
	name: string;
	hadValue: boolean;
	value: string | null;
};

const focusableSelector = 'button, a[href], input, select, textarea, [tabindex]';

export function applyMapMarkerTriggerAccessibility(
	node: HTMLElement,
	options: MapMarkerTriggerAccessibilityOptions
): () => void {
	const trigger = node.querySelector<HTMLElement>(focusableSelector) ?? node;
	const cleanups: Array<() => void> = [];

	if (!hasAccessibleName(trigger)) {
		cleanups.push(setManagedAttribute(trigger, 'aria-label', options.label));
	}

	if (!isNativeInteractiveElement(trigger)) {
		cleanups.push(setManagedAttribute(trigger, 'role', options.isInteractive ? 'button' : 'img'));

		if (options.isFocusable) {
			cleanups.push(setManagedAttribute(trigger, 'tabindex', '0'));
		}

		trigger.addEventListener('keydown', handleKeydown);
		cleanups.push(() => trigger.removeEventListener('keydown', handleKeydown));
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (!options.isInteractive || event.target !== event.currentTarget) {
			return;
		}

		if (event.key !== 'Enter' && event.key !== ' ') {
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		options.activate();
	}

	return () => {
		for (let index = cleanups.length - 1; index >= 0; index -= 1) {
			cleanups[index]();
		}
	};
}

function hasAccessibleName(element: HTMLElement): boolean {
	return element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby');
}

function isNativeInteractiveElement(element: HTMLElement): boolean {
	const tagName = element.tagName.toLowerCase();
	return (
		tagName === 'button' ||
		tagName === 'input' ||
		tagName === 'select' ||
		tagName === 'textarea' ||
		(tagName === 'a' && element.hasAttribute('href'))
	);
}

function setManagedAttribute(element: HTMLElement, name: string, value: string): () => void {
	const previous: ManagedAttribute = {
		name,
		hadValue: element.hasAttribute(name),
		value: element.getAttribute(name)
	};

	element.setAttribute(name, value);

	return () => {
		if (previous.hadValue && previous.value !== null) {
			element.setAttribute(previous.name, previous.value);
			return;
		}

		element.removeAttribute(previous.name);
	};
}
