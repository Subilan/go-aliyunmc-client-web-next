import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

export interface PlayerOnlineRange {
	playerName: string;
	startAt: string;
	endAt: string;
}

const playerColors = [
	'#3b82f6', '#ef4444', '#22c55e', '#eab308', '#a855f7',
	'#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
	'#06b6d4', '#f43f5e', '#8b5cf6', '#10b981', '#e11d48',
];

interface PlayerOnlineGanttProps {
	data: PlayerOnlineRange[];
	loading?: boolean;
	style?: React.CSSProperties;
}

export default function PlayerOnlineGantt({ data, loading = false, style }: PlayerOnlineGanttProps) {
	if (loading) {
		return (
			<div
				className="animate-pulse bg-neutral-100 rounded"
				style={{ height: 200, width: '100%', ...style }}
			/>
		);
	}

	if (data.length === 0) {
		return (
			<div className="text-neutral-400 text-sm text-center py-8 select-none" style={style}>
				暂无玩家在线记录
			</div>
		);
	}

	// Deduplicate player names and assign indices
	const playerNames = [...new Set(data.map(d => d.playerName))];
	const playerIndex = new Map(playerNames.map((name, i) => [name, i]));

	const now = Date.now();
	const chartData = data.map(d => {
		const start = new Date(d.startAt).getTime();
		const end = new Date(d.endAt).getTime();
		const idx = playerIndex.get(d.playerName)!;
		return {
			name: d.playerName,
			value: [idx, start, Math.max(end, start + 1000)],
		};
	});

	const earliestStart = Math.min(...data.map(d => new Date(d.startAt).getTime()));
	const rowHeight = 24;
	const chartHeight = playerNames.length * rowHeight + 50;

	const option: EChartsOption = {
		animation: true,
		tooltip: {
			backgroundColor: '#fff',
			borderColor: '#e5e7eb',
			borderWidth: 1,
			textStyle: { color: '#374151', fontSize: 12 },
			formatter: (params: unknown) => {
				const p = params as { name: string; data: { value: number[] } };
				const v = p.data.value;
				const startStr = new Date(v[1]).toLocaleString();
				const endStr = new Date(v[2]).toLocaleString();
				const duration = ((v[2] - v[1]) / 1000 / 60).toFixed(1);
				return `${p.name}<br/>开始: ${startStr}<br/>结束: ${endStr}<br/>持续: ${duration} 分钟`;
			}
		},
		grid: { top: 10, right: 24, bottom: 16, left: 100 },
		xAxis: {
			type: 'time',
			min: earliestStart,
			max: now,
			axisLabel: { fontSize: 10, color: '#9ca3af' },
			axisLine: { lineStyle: { color: '#e5e7eb' } },
			axisTick: { show: false },
			splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } }
		},
		yAxis: {
			type: 'category',
			data: playerNames,
			axisLabel: {
				fontSize: 10,
				color: '#6b7280',
				width: 90,
				overflow: 'truncate'
			},
			axisTick: { show: false },
			axisLine: { lineStyle: { color: '#e5e7eb' } },
			inverse: true
		},
		series: [
			{
				type: 'custom',
				renderItem: (_params: unknown, api: unknown) => {
					const a = api as {
						value: (dim: number) => number;
						coord: (point: [number, number]) => [number, number];
						size: (sizes: [number, number]) => [number, number];
					};
					const yIdx = a.value(0);
					const startCoord = a.coord([a.value(1), yIdx]);
					const endCoord = a.coord([a.value(2), yIdx]);
					const h = a.size([0, 1])[1] * 0.55;
					const color = playerColors[yIdx % playerColors.length];

					return {
						type: 'rect',
						shape: {
							x: startCoord[0],
							y: startCoord[1] - h / 2,
							width: Math.max(endCoord[0] - startCoord[0], 3),
							height: h
						},
						style: {
							fill: color,
							rx: 4,
							ry: 4
						}
					};
				},
				encode: {
					x: [1, 2],
					y: 0
				},
				data: chartData
			}
		]
	};

	return (
		<ReactECharts
			option={option}
			style={{
				height: Math.max(chartHeight, 100),
				width: '100%',
				...style
			}}
			opts={{ renderer: 'svg' }}
		/>
	);
}

export function PlayerOnlineGanttCard({
	data,
	loading = false
}: {
	data: PlayerOnlineRange[];
	loading?: boolean;
}) {
	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="tracking-wider text-sm font-normal text-muted-foreground">
					玩家在线时间轴
				</CardTitle>
			</CardHeader>
			<CardContent>
				<PlayerOnlineGantt data={data} loading={loading} />
			</CardContent>
		</Card>
	);
}
