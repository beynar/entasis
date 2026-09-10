import type { ChartMark as TanStackMark, ChartValue as TanStackValue } from '@tanstack/charts';
import { decorative } from '@tanstack/charts/mark/decorative';

export function withoutTooltipPoints<
	TDatum,
	TXPointValue extends TanStackValue,
	TYPointValue extends TanStackValue,
	TXScaleValue extends TanStackValue,
	TYScaleValue extends TanStackValue
>(
	mark: TanStackMark<TDatum, TXPointValue, TYPointValue, TXScaleValue, TYScaleValue>
): TanStackMark<TDatum, TXPointValue, TYPointValue, TXScaleValue, TYScaleValue> {
	return decorative(mark);
}
