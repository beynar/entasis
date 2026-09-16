const dimension = 'min(var(--spinner-size, 20px), 65px)';
export const spinners = {
	spinlargeQuarter: {
		style: {
			width: dimension,
			height: dimension,
			border: 'calc(var(--spinner-size, 20px) / 4) solid transparent',
			borderBottomColor: 'currentColor',
			borderRadius: '50%',
			display: 'inline-block',
			boxSizing: 'border-box',
			animation: 'ui-spinner-animation 1s linear infinite'
		},

		keyframes: {
			'ui-spinner-animation': {
				'0%': {
					transform: 'rotate(0deg)'
				},
				'100%': {
					transform: 'rotate(360deg)'
				}
			}
		}
	},
	spinLargeThreeQuarter: {
		style: {
			width: dimension,
			height: dimension,
			border: 'calc(var(--spinner-size, 20px) / 4) solid currentColor',
			borderBottomColor: 'transparent',
			borderRadius: '50%',
			display: 'inline-block',
			boxSizing: 'border-box',
			animation: 'ui-spinner-animation 1s linear infinite'
		},

		keyframes: {
			'ui-spinner-animation': {
				'0%': {
					transform: 'rotate(0deg)'
				},
				'100%': {
					transform: 'rotate(360deg)'
				}
			}
		}
	},
	spinDynamicThick: {
		style: {
			width: dimension,
			height: dimension,
			borderRadius: '50%',
			position: 'relative',
			animation: 'ui-spinner-animation 1s linear infinite',
			'&::before': {
				content: '""',
				boxSizing: 'border-box',
				position: 'absolute',
				inset: '0px',
				borderRadius: '50%',
				border: 'calc(var(--spinner-size, 20px) / 4) solid currentColor',
				animation: 'ui-spinner-animation-before 2s linear infinite'
			}
		},
		keyframes: {
			'ui-spinner-animation': {
				'100%': {
					transform: 'rotate(360deg)'
				}
			},
			'ui-spinner-animation-before': {
				'0%': {
					clipPath: 'polygon(50% 50%,0 0,0 0,0 0,0 0,0 0)'
				},
				'25%': {
					clipPath: 'polygon(50% 50%,0 0,100% 0,100% 0,100% 0,100% 0)'
				},
				'50%': {
					clipPath: 'polygon(50% 50%,0 0,100% 0,100% 100%,100% 100%,100% 100%)'
				},
				'75%': {
					clipPath: 'polygon(50% 50%,0 0,100% 0,100% 100%,0 100%,0 100%)'
				},
				'100%': {
					clipPath: 'polygon(50% 50%,0 0,100% 0,100% 100%,0 100%,0 0)'
				}
			}
		}
	},
	spinDynamicThin: {
		style: {
			width: dimension,
			height: dimension,
			borderRadius: '50%',
			position: 'relative',
			animation: 'ui-spinner-animation 1s linear infinite',
			'&::before': {
				content: '""',
				boxSizing: 'border-box',
				position: 'absolute',
				inset: '0px',
				borderRadius: '50%',
				border: '1px solid currentColor',
				animation: 'ui-spinner-animation-before 2s linear infinite'
			}
		},
		keyframes: {
			'ui-spinner-animation': {
				'100%': {
					transform: 'rotate(360deg)'
				}
			},
			'ui-spinner-animation-before': {
				'0%': {
					clipPath: 'polygon(50% 50%,0 0,0 0,0 0,0 0,0 0)'
				},
				'25%': {
					clipPath: 'polygon(50% 50%,0 0,100% 0,100% 0,100% 0,100% 0)'
				},
				'50%': {
					clipPath: 'polygon(50% 50%,0 0,100% 0,100% 100%,100% 100%,100% 100%)'
				},
				'75%': {
					clipPath: 'polygon(50% 50%,0 0,100% 0,100% 100%,0 100%,0 100%)'
				},
				'100%': {
					clipPath: 'polygon(50% 50%,0 0,100% 0,100% 100%,0 100%,0 0)'
				}
			}
		}
	}
} as const;

export type Spinner = keyof typeof spinners;
export const getSpinner = (options?: { spinner?: Spinner }) => {
	return spinners[options?.spinner || options?.spinner || 'spinDynamicThin'];
};
