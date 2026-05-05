import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

export interface ChartPoint {
	time: string;
	count: number;
}

export default function PlayerCountChart({ data }: { data: ChartPoint[] }) {
	if (data.length === 0) {
		return (
			<div className="text-neutral-400 text-sm text-center py-8 select-none">
				暂无玩家数据
			</div>
		);
	}

	const option: EChartsOption = {
		animation: true,
		tooltip: {
			trigger: 'axis',
			backgroundColor: '#fff',
			borderColor: '#e5e7eb',
			borderWidth: 1,
			textStyle: { color: '#374151', fontSize: 12 },
			formatter: (params: unknown) => {
				const p = (params as { data: number[]; axisValue: string }[])[0];
				return `${p.axisValue}<br/>玩家: <b>${p.data[1]}</b>`;
			}
		},
		grid: { top: 10, right: 12, bottom: data.length > 50 ? 40 : 24, left: 36 },
		xAxis: {
			type: 'category',
			data: data.map(d => d.time),
			axisLabel: {
				fontSize: 10,
				color: '#9ca3af',
				interval: Math.max(0, Math.ceil(data.length / 6) - 1)
			},
			axisTick: { show: false },
			axisLine: { lineStyle: { color: '#e5e7eb' } }
		},
		yAxis: {
			type: 'value',
			min: 0,
			splitNumber: 3,
			axisLabel: { fontSize: 10, color: '#9ca3af' },
			splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } }
		},
		dataZoom:
			data.length > 50
				? [
						{
							type: 'slider',
							bottom: 0,
							height: 16,
							borderColor: 'transparent',
							backgroundColor: '#f9fafb',
							fillerColor: '#1976d233',
							handleStyle: { color: '#1976d2', borderColor: '#1976d2' },
							showDetail: false,
							start: 0,
							end: 100
						}
					]
				: undefined,
		series: [
			{
				type: 'line',
				data: data.map(d => d.count),
				smooth: true,
				symbol: data.length <= 30 ? 'circle' : 'none',
				symbolSize: 5,
				lineStyle: { color: '#1976d2', width: 1.5 },
				itemStyle: { color: '#1976d2' },
				areaStyle: {
					color: {
						type: 'linear',
						x: 0,
						y: 0,
						x2: 0,
						y2: 1,
						colorStops: [
							{ offset: 0, color: 'rgba(25,118,210,0.18)' },
							{ offset: 1, color: 'rgba(25,118,210,0)' }
						]
					}
				}
			}
		]
	};

	return (
		<ReactECharts
			option={option}
			style={{ height: 150, width: '100%' }}
			opts={{ renderer: 'svg' }}
		/>
	);
}
