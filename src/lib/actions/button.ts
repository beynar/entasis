export const button = (
	node: HTMLElement,
	options?: {
		click?: (e: MouseEvent | KeyboardEvent) => void;
		disabled?: boolean;
	}
) => {
	const { click, disabled = false } = options || {};

	// Add accessibility attributes
	node.setAttribute('role', 'button');
	node.setAttribute('tabindex', disabled ? '-1' : '0');
	if (disabled) node.setAttribute('aria-disabled', 'true');

	const onKeyDown = (e: KeyboardEvent) => {
		if ((e.key === 'Enter' || e.key === ' ') && !disabled && e.target === node) {
			e.preventDefault(); // Prevent scrolling on space
			click?.(e);
		}
	};

	const handleClick = (e: MouseEvent) => {
		if (!disabled) {
			click?.(e);
		}
	};

	node.addEventListener('keydown', onKeyDown);
	node.addEventListener('click', handleClick);

	return {
		update(newOptions?: { click?: (e: MouseEvent | KeyboardEvent) => void; disabled?: boolean }) {
			const { disabled: newDisabled = false } = newOptions || {};
			if (newDisabled !== disabled) {
				node.setAttribute('tabindex', newDisabled ? '-1' : '0');
				node.setAttribute('aria-disabled', newDisabled ? 'true' : 'false');
			}
			options = newOptions;
		},
		destroy() {
			node.removeEventListener('keydown', onKeyDown);
			node.removeEventListener('click', handleClick);
		}
	};
};
