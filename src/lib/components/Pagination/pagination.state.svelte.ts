import { createBindableStateClass } from '$lib/utils/state.svelte.js';
import { en, type Messages } from '$lib/i18n/en.js';
import type {
	PaginationControlType,
	PaginationItem,
	PaginationItemLabel,
	PaginationPageItemPayload,
	PaginationSummaryPayload
} from './pagination.props.js';

type PaginationStateOptions = {
	page: number;
	totalPages?: number;
	totalItems?: number;
	pageSize?: number;
	siblingCount: number;
	boundaryCount: number;
	disabled: boolean;
	getHref?: (page: number) => string;
	getItemLabel?: (item: PaginationItemLabel) => string;
	onValueChange?: (value: number) => void;
	/** Active i18n catalog, used for the default control accessible names. */
	messages?: Messages;
};

let hasWarnedAboutMissingPageCount = false;

/**
 * Warns once per app session when a `<Pagination />` was given neither `totalPages` nor the
 * `totalItems` + `pageSize` pair, which makes the page count 0 and renders nothing.
 */
export function warnMissingPageCountOnce() {
	if (hasWarnedAboutMissingPageCount) return;
	hasWarnedAboutMissingPageCount = true;
	console.warn(
		'svelai: <Pagination /> has no page count and renders nothing. Pass `totalPages`, or both `totalItems` and `pageSize`.'
	);
}

export class PaginationState extends createBindableStateClass<PaginationStateOptions>() {
	pageCount = $derived(getPageCount(this.totalPages, this.totalItems, this.pageSize));
	clampPage = (nextPage: number) => {
		return clampPage(nextPage, this.pageCount);
	};
	currentPage = $derived(this.pageCount === 0 ? 0 : this.clampPage(this.page));
	siblings = $derived(getVisibleCount(this.siblingCount));
	boundaries = $derived(getVisibleCount(this.boundaryCount));
	items = $derived(
		getPaginationItems(this.currentPage, this.pageCount, this.siblings, this.boundaries)
	);
	summary = $derived(
		getPaginationSummary(this.currentPage, this.pageCount, this.totalItems, this.pageSize)
	);
	controlElement: 'a' | 'button' = $derived(this.getHref ? 'a' : 'button');
	hasPages = $derived(this.pageCount > 0);
	isPreviousDisabled = $derived(this.disabled || !this.hasPages || this.currentPage <= 1);
	isNextDisabled = $derived(this.disabled || !this.hasPages || this.currentPage >= this.pageCount);

	constructor(options: PaginationStateOptions) {
		super(options);
	}

	setPage = (nextPage: number) => {
		if (this.disabled || !this.hasPages) return;

		const resolvedPage = this.clampPage(nextPage);
		if (resolvedPage === this.page) return;

		this.page = resolvedPage;
		this.onValueChange?.(resolvedPage);
	};

	first = () => {
		this.setPage(1);
	};

	previous = () => {
		this.setPage(this.currentPage - 1);
	};

	next = () => {
		this.setPage(this.currentPage + 1);
	};

	last = () => {
		this.setPage(this.pageCount);
	};

	handleControlClick = (event: MouseEvent, nextPage: number, isDisabled: boolean) => {
		if (isDisabled || nextPage === this.currentPage || !this.getHref) {
			event.preventDefault();
		}

		if (!isDisabled) {
			this.setPage(nextPage);
		}
	};

	getPageHref = (nextPage: number, isDisabled: boolean) => {
		if (isDisabled || !this.getHref) return undefined;
		return this.getHref(this.clampPage(nextPage));
	};

	getPageItemPayload = (
		pageNumber: number,
		isActive: boolean,
		isDisabled: boolean
	): PaginationPageItemPayload => {
		return {
			page: pageNumber,
			active: isActive,
			disabled: isDisabled,
			totalPages: this.pageCount
		};
	};

	getControlAriaLabel = (
		type: PaginationControlType,
		targetPage: number,
		isActive: boolean,
		isDisabled: boolean
	) => {
		const labelItem = {
			type,
			page: this.clampPage(targetPage),
			active: isActive,
			disabled: isDisabled,
			totalPages: this.pageCount
		};

		return this.getItemLabel
			? this.getItemLabel(labelItem)
			: getDefaultItemLabel(labelItem, this.messages ?? en);
	};
}

function getPageCount(
	totalPages: number | undefined,
	totalItems: number | undefined,
	pageSize: number | undefined
) {
	const explicitTotalPages = getNonNegativeInteger(totalPages);
	if (explicitTotalPages !== undefined) return explicitTotalPages;

	const normalizedTotalItems = getNonNegativeInteger(totalItems);
	const normalizedPageSize = getPositiveInteger(pageSize);
	if (normalizedTotalItems === undefined || normalizedPageSize === undefined) return 0;

	return Math.ceil(normalizedTotalItems / normalizedPageSize);
}

function getPaginationItems(
	activePage: number,
	pageCount: number,
	activeSiblingCount: number,
	activeBoundaryCount: number
): PaginationItem[] {
	if (pageCount <= 0) return [];

	const visiblePages: number[] = [];
	const addVisiblePage = (pageNumber: number) => {
		if (!visiblePages.includes(pageNumber)) visiblePages.push(pageNumber);
	};
	for (
		let pageNumber = 1;
		pageNumber <= Math.min(activeBoundaryCount, pageCount);
		pageNumber += 1
	) {
		addVisiblePage(pageNumber);
	}
	for (
		let pageNumber = Math.max(pageCount - activeBoundaryCount + 1, 1);
		pageNumber <= pageCount;
		pageNumber += 1
	) {
		addVisiblePage(pageNumber);
	}
	for (
		let pageNumber = Math.max(activePage - activeSiblingCount, 1);
		pageNumber <= Math.min(activePage + activeSiblingCount, pageCount);
		pageNumber += 1
	) {
		addVisiblePage(pageNumber);
	}
	if (activePage <= activeBoundaryCount + 1 && activeBoundaryCount < pageCount) {
		addVisiblePage(activeBoundaryCount + 1);
	}
	if (activePage >= pageCount - activeBoundaryCount && activeBoundaryCount < pageCount) {
		addVisiblePage(pageCount - activeBoundaryCount);
	}

	const sortedPages = visiblePages.sort((left, right) => left - right);
	const items: PaginationItem[] = [];
	let previousPage = 0;

	for (const pageNumber of sortedPages) {
		if (previousPage > 0 && pageNumber - previousPage === 2) {
			items.push(previousPage + 1);
		} else if (previousPage > 0 && pageNumber - previousPage > 2) {
			items.push(previousPage < activePage ? 'ellipsis-start' : 'ellipsis-end');
		}

		items.push(pageNumber);
		previousPage = pageNumber;
	}

	return items;
}

function clampPage(nextPage: number, pageCount: number) {
	const normalizedPage = Number.isFinite(nextPage) ? Math.trunc(nextPage) : 1;
	return Math.min(Math.max(1, normalizedPage), pageCount);
}

function getPaginationSummary(
	page: number,
	totalPages: number,
	totalItems: number | undefined,
	pageSize: number | undefined
): PaginationSummaryPayload | undefined {
	const normalizedTotalItems = getNonNegativeInteger(totalItems);
	const normalizedPageSize = getPositiveInteger(pageSize);
	if (
		normalizedTotalItems === undefined ||
		normalizedPageSize === undefined ||
		normalizedTotalItems === 0
	) {
		return undefined;
	}

	const startItem = (page - 1) * normalizedPageSize + 1;
	const endItem = Math.min(page * normalizedPageSize, normalizedTotalItems);

	return {
		page,
		totalPages,
		totalItems: normalizedTotalItems,
		pageSize: normalizedPageSize,
		startItem,
		endItem
	};
}

function getDefaultItemLabel(item: PaginationItemLabel, messages: Messages) {
	if (item.type === 'page') {
		return item.active ? messages.currentPage(item.page) : messages.goToPage(item.page);
	}

	const labelByType: Record<Exclude<PaginationItemLabel['type'], 'page'>, string> = {
		first: messages.goToFirstPage,
		previous: messages.goToPreviousPage,
		next: messages.goToNextPage,
		last: messages.goToLastPage
	};

	return labelByType[item.type];
}

function getNonNegativeInteger(value: number | undefined) {
	if (value === undefined || !Number.isFinite(value)) return undefined;
	return Math.max(0, Math.trunc(value));
}

function getPositiveInteger(value: number | undefined) {
	if (value === undefined || !Number.isFinite(value)) return undefined;
	const normalized = Math.trunc(value);
	return normalized > 0 ? normalized : undefined;
}

function getVisibleCount(value: number) {
	if (!Number.isFinite(value)) return 0;
	return Math.max(0, Math.trunc(value));
}
