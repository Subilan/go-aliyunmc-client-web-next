import type { AdvancementProgress } from '~/utils/requests/game';
import { MetricItem } from '~/components/metric-item';

export const CATEGORY_DISPLAY: Record<string, string> = {
	'minecraft:story': '主线',
	'minecraft:husbandry': '农牧',
	'minecraft:adventure': '冒险',
	'minecraft:nether': '下界',
	'minecraft:end': '末地'
};

export function AdvancementMetrics({
	advProgress
}: {
	advProgress: AdvancementProgress | undefined;
}) {
	if (!advProgress || advProgress.categories.length === 0) {
		return <div className="text-neutral-400 text-sm">加载中...</div>;
	}

	return (
		<div className="mb-4">
			<div className="grid grid-cols-5 gap-3">
				{advProgress.categories.map(c => (
					<MetricItem
						centered
						key={c.category}
						title={CATEGORY_DISPLAY[c.category] ?? c.category}
					>
						{c.completed}/{c.total}
					</MetricItem>
				))}
			</div>
		</div>
	);
}
