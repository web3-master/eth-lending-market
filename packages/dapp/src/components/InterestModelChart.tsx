import {Rate} from "../../pages/market";
import {useCallback, useMemo} from "react";
import {scaleLinear} from "@visx/scale";
import {bisector, max} from 'd3-array';
import {Group} from "@visx/group";
import {Bar, Line, LinePath} from "@visx/shape";
import {curveMonotoneX} from "d3-shape";
import {AxisLeft} from "@visx/axis";
import {Text} from '@visx/text';
import {defaultStyles, TooltipWithBounds, withTooltip} from '@visx/tooltip';
import {WithTooltipProvidedProps} from "@visx/tooltip/lib/enhancers/withTooltip";
import {localPoint} from "@visx/event";

const background = '#3b6978';
const accentColorDark = '#75daad';
const utilizationColor = 'white';
const tooltipStyles = {
    ...defaultStyles,
    background,
    border: '1px solid white',
    color: 'white',
};

interface InterestModelChartParam {
    width: number;
    height: number;
    rates: Rate[];
    currentUtilizationRate: number;
    margin?: { top: number; right: number; bottom: number; left: number };
}

const bisectDate = bisector<Rate, number>((d) => d.utilization).center;

const InterestModelChart = withTooltip<InterestModelChartParam, Rate>(({
    width,
    height,
    rates,
    currentUtilizationRate,
    margin = {top: 20, right: 10, bottom: 0, left: 40},
    showTooltip,
    hideTooltip,
    tooltipData,
    tooltipLeft = 0,
}: InterestModelChartParam & WithTooltipProvidedProps<Rate>) => {
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = useMemo(
        () =>
            scaleLinear({
                range: [0, innerWidth],
                domain: [0, 100],
                nice: true,
            }),
        [innerWidth]
    );
    const yScale = useMemo(() => {
        const maxY = max(rates, (d: Rate) => Math.max(d.supply, d.borrow)) as number;
        return scaleLinear({
            range: [innerHeight, 0],
            domain: [0, (maxY || 0) * 1.1],
            nice: true,
        });
    }, [innerHeight, rates]);

    const handleTooltip = useCallback(
        (event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>) => {
            const {x: _x} = localPoint(event) || {x: 0};
            const x = _x - margin.left;
            const x0 = xScale.invert(x);
            const index = bisectDate(rates, x0, 1);
            const d0 = rates[index - 1];
            const d1 = rates[index];
            let d = d0;
            if (d1 && d1.utilization) {
                d = x0.valueOf()
                - d0.utilization.valueOf()
                > d1.utilization.valueOf()
                - x0.valueOf()
                    ? d1 : d0;
            }
            showTooltip({
                tooltipData: d,
                tooltipLeft: x,
            });
        },
        [showTooltip, xScale, rates, margin]
    );

    return (
        <>
            <svg width={width} height={height}>
                <Group left={margin.left} top={margin.top}>
                    <LinePath
                        stroke={'green'}
                        strokeWidth={3}
                        data={rates}
                        x={(d: Rate) => xScale(d.utilization) ?? 0}
                        y={(d: Rate) => yScale(d.supply) ?? 0}
                        curve={curveMonotoneX}
                    />
                    <LinePath
                        stroke={'purple'}
                        strokeWidth={3}
                        data={rates}
                        x={(d: Rate) => xScale(d.utilization) ?? 0}
                        y={(d: Rate) => yScale(d.borrow) ?? 0}
                        curve={curveMonotoneX}
                    />
                    <AxisLeft
                        scale={yScale}
                        strokeWidth={0}
                        tickLabelProps={() => ({
                            fill: utilizationColor,
                            fontSize: 8,
                            dx: -margin.left + 8,
                        })}
                        tickFormat={(value) => `${(value as number).toFixed(2)} %`}
                    />
                    <Bar
                        width={innerWidth}
                        height={innerHeight}
                        fill="transparent"
                        onTouchStart={handleTooltip}
                        onTouchMove={handleTooltip}
                        onMouseMove={handleTooltip}
                        onMouseLeave={() => hideTooltip()}
                    />
                    <Line
                        from={{x: xScale(0), y: innerHeight / 4}}
                        to={{x: xScale(100), y: innerHeight / 4}}
                        stroke={'#fff'}
                        strokeWidth={3}
                        pointerEvents="none"
                    />
                    <Line
                        from={{x: xScale(currentUtilizationRate), y: innerHeight / 4 - 5}}
                        to={{x: xScale(currentUtilizationRate), y: innerHeight / 4 + 5}}
                        stroke={utilizationColor}
                        strokeWidth={2}
                        pointerEvents="none"
                    />
                    <Text
                        x={xScale(currentUtilizationRate)}
                        y={innerHeight / 4 - 14}
                        width={360}
                        textAnchor="middle"
                        verticalAnchor="middle"
                        fontSize="10px"
                        fill={utilizationColor}
                    >
                        Current
                    </Text>

                    {tooltipData && (
                        <g>
                            <Line
                                from={{x: tooltipLeft, y: margin.top}}
                                to={{x: tooltipLeft, y: innerHeight + margin.top}}
                                stroke={accentColorDark}
                                strokeWidth={2}
                                pointerEvents="none"
                                strokeDasharray="5,2"
                            />
                            <circle
                                cx={tooltipLeft}
                                cy={yScale(tooltipData.borrow) + 1}
                                r={4}
                                fill="black"
                                fillOpacity={0.1}
                                stroke="black"
                                strokeOpacity={0.1}
                                strokeWidth={2}
                                pointerEvents="none"
                            />
                            <circle
                                cx={tooltipLeft}
                                cy={yScale(tooltipData.borrow)}
                                r={4}
                                fill={accentColorDark}
                                stroke="white"
                                strokeWidth={2}
                                pointerEvents="none"
                            />
                            <circle
                                cx={tooltipLeft}
                                cy={yScale(tooltipData.supply) + 1}
                                r={4}
                                fill="black"
                                fillOpacity={0.1}
                                stroke="black"
                                strokeOpacity={0.1}
                                strokeWidth={2}
                                pointerEvents="none"
                            />
                            <circle
                                cx={tooltipLeft}
                                cy={yScale(tooltipData.supply)}
                                r={4}
                                fill={accentColorDark}
                                stroke="white"
                                strokeWidth={2}
                                pointerEvents="none"
                            />
                        </g>
                    )}
                </Group>
            </svg>

            {tooltipData && (
                <div>
                    <TooltipWithBounds top={20} left={tooltipLeft + 12} style={tooltipStyles}>
                        <div>Utilization: {tooltipData.utilization}%</div>
                        <div>Supply Rate: {tooltipData.supply.toFixed(2)} %</div>
                        <div>Borrow Rate: {tooltipData.borrow.toFixed(2)} %</div>
                    </TooltipWithBounds>
                </div>
            )}
        </>
    );
});

export default InterestModelChart;
