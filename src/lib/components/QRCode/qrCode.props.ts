import type { WithAttachments } from '$lib/types/props.js';
import type { Colors, Sizes } from '../../types/index.js';
import type { QRCodeThemeProps } from './qrCode.theme.js';

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';
export type CrossOrigin = 'anonymous' | 'use-credentials' | '' | undefined;

export type GradientSettingsType = 'linear' | 'radial';
export interface GradientSettingsStop {
	/** Stop offset, e.g. '0%' or '100%'. */
	offset: string;
	/** Stop color, any CSS color value. */
	color: string;
}
export interface GradientSettings {
	/** The gradient type. */
	type: GradientSettingsType;
	/** The gradient color stops. */
	stops: GradientSettingsStop[];
	/** Rotation of the gradient in degrees (linear gradients only). */
	rotation?: number;
}

/** The QR code background: either a CSS color or gradient settings. */
export type BackgroundSettings = string | GradientSettings;

export type DataModulesStyle =
	| 'square'
	| 'square-sm'
	| 'pinched-square'
	| 'rounded'
	| 'leaf'
	| 'vertical-line'
	| 'horizontal-line'
	| 'circuit-board'
	| 'circle'
	| 'diamond'
	| 'star'
	| 'heart'
	| 'hashtag';

export interface DataModulesSettings {
	/** The color of the data modules. Defaults to `currentColor` (driven by the `color` prop). */
	color?: string;
	/** The shape used to render each data module. */
	style?: DataModulesStyle;
	/** Randomize the size of each data module (fillable styles only). */
	randomSize?: boolean;
	/**
	 * Scale multiplier applied to each data module (1 = full size). Keep
	 * between 0.75 and 1 for best results — lower values may degrade
	 * scannability. Only applies to fillable styles (square, pinched-square,
	 * circle, diamond, heart, star, hashtag). Ignored when `randomSize` is true.
	 * @default 1
	 */
	scale?: number;
	/**
	 * Width of the stroke for connected-shape styles, in module units. Only
	 * applies to `vertical-line`, `horizontal-line`, `rounded`, and
	 * `circuit-board`. Keep between 0.25 and 1 — lower values may degrade
	 * scannability, and values above 1 cause end caps to overflow neighbouring
	 * cells. Not clamped.
	 * @default 1 for `vertical-line` / `horizontal-line` / `rounded`, 0.5 for `circuit-board`
	 */
	lineWidth?: number;
}

export type FinderPatternOuterStyle =
	| 'square'
	| 'pinched-square'
	| 'rounded-sm'
	| 'rounded'
	| 'rounded-lg'
	| 'circle'
	| 'inpoint-sm'
	| 'inpoint'
	| 'inpoint-lg'
	| 'outpoint-sm'
	| 'outpoint'
	| 'outpoint-lg'
	| 'leaf-sm'
	| 'leaf'
	| 'leaf-lg';

export interface FinderPatternOuterSettings {
	/** The color of the outer finder patterns. Defaults to `currentColor` (driven by the `color` prop). */
	color?: string;
	/** The shape of the outer finder patterns. */
	style?: FinderPatternOuterStyle;
}

export type FinderPatternInnerStyle =
	| 'square'
	| 'pinched-square'
	| 'rounded-sm'
	| 'rounded'
	| 'rounded-lg'
	| 'circle'
	| 'inpoint-sm'
	| 'inpoint'
	| 'inpoint-lg'
	| 'outpoint-sm'
	| 'outpoint'
	| 'outpoint-lg'
	| 'leaf-sm'
	| 'leaf'
	| 'leaf-lg'
	| 'diamond'
	| 'star'
	| 'heart'
	| 'hashtag'
	| 'microchip';

export interface FinderPatternInnerSettings {
	/** The color of the inner finder patterns. Defaults to `currentColor` (driven by the `color` prop). */
	color?: string;
	/** The shape of the inner finder patterns. */
	style?: FinderPatternInnerStyle;
}

export interface ImageSettings {
	/** The URI of the embedded image. */
	src: string;
	/** The height, in pixels, of the image (relative to the nominal size of the QR code). */
	height: number;
	/** The width, in pixels, of the image (relative to the nominal size of the QR code). */
	width: number;
	/**
	 * Whether or not to "excavate" the modules around the embedded image. Any
	 * modules the embedded image overlaps will use the background color.
	 */
	excavate?: boolean;
	/** The horizontal offset of the embedded image, starting from the top left corner. Centered if not specified. */
	x?: number;
	/** The vertical offset of the embedded image, starting from the top left corner. Centered if not specified. */
	y?: number;
	/**
	 * The opacity of the embedded image in the range of 0-1.
	 * @default 1
	 */
	opacity?: number;
	/**
	 * The cross-origin value to use when loading the image. Note: `undefined`
	 * is treated differently than the empty string, matching HTML behavior.
	 */
	crossOrigin?: CrossOrigin;
}

export type DownloadFileFormat = 'svg' | 'png' | 'jpeg';
export interface DownloadOptions {
	/** File name without extension. @default 'qr-code' */
	name?: string;
	/** File format. @default 'svg' */
	format?: DownloadFileFormat;
	/** The exported file width and height in pixels. @default 500 */
	dimension?: number;
}

export type QRCodeProps = WithAttachments<{
	/**
	 * The SVG element rendered by the component. Bindable.
	 */
	ref?: SVGSVGElement | null;
	/**
	 * The value to encode into the QR Code. An array of strings can be passed
	 * in to represent multiple segments to further optimize the QR Code.
	 */
	value: string | string[];
	/**
	 * The size of the QR code (small: 96px, normal: 128px, large: 192px).
	 * @default 'normal'
	 */
	size?: Sizes;
	/**
	 * The color of the QR code modules, mapped to the theme colors.
	 * @default 'neutral'
	 */
	color?: Colors;
	/**
	 * The Error Correction Level to use.
	 * @see https://www.qrcode.com/en/about/error_correction.html
	 * @default 'M'
	 */
	level?: ErrorCorrectionLevel;
	/**
	 * The number of _modules_ to use for margin. The QR Code specification
	 * requires `4`, however you can specify any number. Values will be turned
	 * to integers with `Math.floor`.
	 * @default 4
	 */
	marginSize?: number;
	/**
	 * The minimum version used when encoding the QR Code. Valid values are
	 * 1-40 with higher values resulting in more complex QR Codes. The optimal
	 * (lowest) version is determined for the `value` provided, using
	 * `minVersion` as the lower bound.
	 * @default 1
	 */
	minVersion?: number;
	/**
	 * If enabled, the Error Correction Level of the result may be higher than
	 * the specified Error Correction Level option if it can be done without
	 * increasing the version.
	 * @default true
	 */
	boostLevel?: boolean;
	/**
	 * The QR code background: either a CSS color or gradient settings.
	 * Transparent when not provided.
	 */
	background?: BackgroundSettings;
	/**
	 * The gradient settings applied to the QR code data modules and finder
	 * patterns. Overrides `color` and the settings colors.
	 */
	gradient?: GradientSettings;
	/**
	 * The settings for the data modules.
	 */
	dataModulesSettings?: DataModulesSettings;
	/**
	 * The settings for the finder pattern outer modules.
	 */
	finderPatternOuterSettings?: FinderPatternOuterSettings;
	/**
	 * The settings for the finder pattern inner modules.
	 */
	finderPatternInnerSettings?: FinderPatternInnerSettings;
	/**
	 * The settings for the embedded image.
	 */
	imageSettings?: ImageSettings;
	/**
	 * The accessible label of the QR code.
	 * @default 'QR Code'
	 */
	ariaLabel?: string;
	/**
	 * The class name of the QR code. First element that the component outputs in the DOM.
	 */
	class?: string;
	/**
	 * Theme overrides for the QR code SVG element.
	 */
	theme?: QRCodeThemeProps;
}>;
