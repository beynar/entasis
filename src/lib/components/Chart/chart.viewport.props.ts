export type ChartViewportTransition = {
	duration?: number;
	easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
};

export type ChartViewportDefinition = {
	axis?: 'x';
	reset?: boolean;
	transition?: boolean | ChartViewportTransition;
};

export type ChartViewport = boolean | ChartViewportDefinition;
