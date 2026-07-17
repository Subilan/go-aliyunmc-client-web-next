import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

export interface TimelineTask {
	id: number;
	type: string;
	startAt: string;
	endAt?: string;
	status: string;
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
	0: '#3b82f6', // 部署 - 蓝色
	1: '#eab308', // 创建/启动 - 黄色
	2: '#a855f7', // 归档 - 紫色
	3: '#22c55e', // 备份 - 绿色
	4: '#9ca3af'  // 测试 - 灰色
};

function typeLabel(type: string) {
	switch (type) {
		case 'test':
			return '测试';
		case 'deploy':
			return '部署';
		case 'backup':
			return '备份';
		case 'archive':
			return '归档';
		case 'create_instance':
			return '创建实例';
		case 'start_server':
			return '启动服务器';
		default:
			return type;
	}
}

const SIX_HOURS_MS = 6 * 3600 * 1000;

export default function TaskTimelineChart({
	tasks,
	loading = false
}: {
	tasks: TimelineTask[];
	loading?: boolean;
}) {
	if (loading) {
		return (
			<div
				className="animate-pulse bg-neutral-100 rounded"
				style={{ height: 250, width: '100%' }}
			/>
		);
	}

	const now = Date.now();
	const cutoff = now - SIX_HOURS_MS;

	// Only keep tasks that overlap with the last 6 hours
	const valid = tasks.filter(t => {
		if (!t.startAt) return false;
		const start = new Date(t.startAt).getTime();
		const end = t.endAt
			? new Date(t.endAt).getTime()
			: t.status === 'running'
				? now
				: start;
		return end >= cutoff && start <= now;
	});

	if (valid.length === 0) {
		return (
			<div className="text-neutral-400 text-sm text-center py-8 select-none">
				最近 6 小时暂无任务
			</div>
		);
	}

	const data = valid.map((t, i) => {
		const start = new Date(t.startAt).getTime();
		let end: number;
		if (t.endAt) {
			end = new Date(t.endAt).getTime();
		} else if (t.status === 'running') {
			end = now;
		} else {
			end = start + 1000;
		}
		return {
			name: `${typeLabel(t.type)} #${t.id}`,
			value: [i, start, Math.max(end, start + 1000), typeCode[t.type] ?? 4],
			status: t.status
		};
	});

	// Use the earliest task start time as the left boundary
	const earliestStart = Math.min(...valid.map(t => new Date(t.startAt).getTime()));

	const rowHeight = 28;
	const chartHeight = valid.length * rowHeight + 50;

	const option: EChartsOption = {
		animation: true,
		tooltip: {
			backgroundColor: '#fff',
			borderColor: '#e5e7eb',
			borderWidth: 1,
			textStyle: { color: '#374151', fontSize: 12 },
			formatter: (params: unknown) => {
				const p = params as { name: string; data: { value: number[]; status: string } };
				const v = p.data.value;
				const startStr = new Date(v[1]).toLocaleString();
				const endStr = new Date(v[2]).toLocaleString();
				const duration = ((v[2] - v[1]) / 1000).toFixed(1);
				const statusText =
					p.data.status === 'success' ? '成功' :
					p.data.status === 'failed' ? '失败' :
					p.data.status === 'running' ? '运行中' : p.data.status;
				return `${p.name}<br/>状态: ${statusText}<br/>开始: ${startStr}<br/>结束: ${endStr}<br/>耗时: ${duration}s`;
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
			data: valid.map(t => `${typeLabel(t.type)} #${t.id}`),
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
			pieces: Object.entries(typeColorMap).map(([code, color]) => ({
				value: Number(code),
				color
			})),
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
				data
			}
		]
	};

	return (
		<ReactECharts
			option={option}
			style={{
				height: Math.max(chartHeight, 100),
				width: '100%'
			}}
			opts={{ renderer: 'svg' }}
		/>
	);
}
