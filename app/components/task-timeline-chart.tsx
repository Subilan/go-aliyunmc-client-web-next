import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

export interface TimelineTask {
	id: number;
	type: string;
	startAt: string;
	endAt?: string;
	status: string;
}

export interface PlayerOnlineRange {
	playerName: string;
	startAt: string;
	endAt: string;
}

const typeCode: Record<string, number> = {
	deploy: 0,
	create_instance: 1,
	start_server: 1,
	archive: 2,
	backup: 3,
	test: 4
};

const typeColorMap: Record<number, string> = {
	0: '#3b82f6',
	1: '#eab308',
	2: '#a855f7',
	3: '#22c55e',
	4: '#9ca3af'
};

const playerColors = [
	'#ef4444', '#f97316', '#84cc16', '#14b8a6', '#06b6d4',
	'#6366f1', '#ec4899', '#78716c', '#d946ef', '#0ea5e9',
	'#f43f5e', '#10b981', '#8b5cf6', '#e11d48', '#0891b2',
];

function typeLabel(type: string) {
	switch (type) {
		case 'test': return '测试';
		case 'deploy': return '部署';
		case 'backup': return '备份';
		case 'archive': return '归档';
		case 'create_instance': return '创建实例';
		case 'start_server': return '启动服务器';
		default: return type;
	}
}

interface Props {
	tasks: TimelineTask[];
	playerRanges?: PlayerOnlineRange[];
	loading?: boolean;
	timeRangeHours?: number;
	style?: React.CSSProperties;
}

export default function TaskTimelineChart({
	tasks,
	playerRanges,
	loading = false,
	timeRangeHours = 6,
	style
}: Props) {
	if (loading) {
		return (
			<div
				className="animate-pulse bg-neutral-100 rounded"
				style={{ height: 250, width: '100%', ...style }}
			/>
		);
	}

	const now = Date.now();
	const cutoff = now - timeRangeHours * 3600 * 1000;

	const validTasks = tasks.filter(t => {
		if (!t.startAt) return false;
		const start = new Date(t.startAt).getTime();
		const end = t.endAt
			? new Date(t.endAt).getTime()
			: t.status === 'running' ? now : start;
		return end >= cutoff && start <= now;
	});

	const validRanges = (playerRanges ?? []).filter(r => {
		const start = new Date(r.startAt).getTime();
		const end = new Date(r.endAt).getTime();
		return end >= cutoff && start <= now;
	});

	const totalTasks = validTasks.length;
	const totalPlayers = validRanges.length;

	if (totalTasks === 0 && totalPlayers === 0) {
		return (
			<div className="text-neutral-400 text-sm text-center py-8 select-none" style={style}>
				最近 {timeRangeHours} 小时暂无活动
			</div>
		);
	}

	// Deduplicate player names and assign indices
	const playerNames = [...new Set(validRanges.map(r => r.playerName))];
	const playerIndex = new Map(playerNames.map((name, i) => [name, i]));

	// Build Y-axis labels and color dimension values
	type YEntry = { label: string; items: { yIdx: number; start: number; end: number; colorCode: number; tooltipName: string }[] };
	const yEntries: YEntry[] = [];

	const taskOffset = 10; // Reserve color codes 0-9 for tasks, 10+ for players

	// Task rows
	for (let i = 0; i < totalTasks; i++) {
		const t = validTasks[i];
		const start = new Date(t.startAt).getTime();
		let end: number;
		if (t.endAt) {
			end = new Date(t.endAt).getTime();
		} else if (t.status === 'running') {
			end = now;
		} else {
			end = start + 1000;
		}
		const code = typeCode[t.type] ?? 4;
		yEntries.push({
			label: `${typeLabel(t.type)} #${t.id}`,
			items: [{ yIdx: i, start, end: Math.max(end, start + 1000), colorCode: code, tooltipName: `${typeLabel(t.type)} #${t.id}` }]
		});
	}

	// Player rows
	for (let i = 0; i < playerNames.length; i++) {
		const name = playerNames[i];
		const sessions = validRanges.filter(r => r.playerName === name);
		const items = sessions.map(s => ({
			yIdx: totalTasks + i,
			start: new Date(s.startAt).getTime(),
			end: new Date(s.endAt).getTime(),
			colorCode: taskOffset + (i % playerColors.length),
			tooltipName: name,
		}));
		yEntries.push({ label: name, items });
	}

	const yLabels = yEntries.map(e => e.label);
	const allItems = yEntries.flatMap(e => e.items);

	const allData = allItems.map(item => ({
		name: item.tooltipName,
		value: [item.yIdx, item.start, Math.max(item.end, item.start + 1000), item.colorCode],
	}));

	const earliestStart = Math.min(
		...validTasks.map(t => new Date(t.startAt).getTime()),
		...validRanges.map(r => new Date(r.startAt).getTime())
	);

	const rowHeight = 24;
	const chartHeight = yLabels.length * rowHeight + 50;

	// Build visualMap pieces for both tasks and players
	const pieces: { value: number; color: string }[] = [];
	for (const [code, color] of Object.entries(typeColorMap)) {
		pieces.push({ value: Number(code), color });
	}
	playerColors.forEach((color, i) => {
		pieces.push({ value: taskOffset + i, color });
	});

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
				const durationMin = ((v[2] - v[1]) / 1000 / 60).toFixed(1);
				return `${p.name}<br/>开始: ${startStr}<br/>结束: ${endStr}<br/>持续: ${durationMin} 分钟`;
			}
		},
		grid: { top: 10, right: 24, bottom: 16, left: 110 },
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
			data: yLabels,
			axisLabel: {
				fontSize: 10,
				color: '#6b7280',
				width: 100,
				overflow: 'truncate'
			},
			axisTick: { show: false },
			axisLine: { lineStyle: { color: '#e5e7eb' } },
			inverse: true
		},
		visualMap: {
			show: false,
			dimension: 3,
			pieces,
			outOfRange: { color: '#9ca3af' }
		},
		series: [
			{
				type: 'custom',
				renderItem: (_params: unknown, api: unknown) => {
					const a = api as {
						value: (dim: number) => number;
						coord: (point: [number, number]) => [number, number];
						size: (sizes: [number, number]) => [number, number];
						visual: (key: string) => string;
					};
					const yIdx = a.value(0);
					const startCoord = a.coord([a.value(1), yIdx]);
					const endCoord = a.coord([a.value(2), yIdx]);
					const h = a.size([0, 1])[1] * 0.55;

					return {
						type: 'rect',
						shape: {
							x: startCoord[0],
							y: startCoord[1] - h / 2,
							width: Math.max(endCoord[0] - startCoord[0], 3),
							height: h
						},
						style: {
							fill: a.visual('color'),
							rx: 4,
							ry: 4
						}
					};
				},
				encode: {
					x: [1, 2],
					y: 0
				},
				data: allData
			}
		]
	};

	return (
		<ReactECharts
			option={option}
			style={{
				height: Math.max(chartHeight, 120),
				width: '100%',
				...style
			}}
			opts={{ renderer: 'svg' }}
		/>
	);
}
