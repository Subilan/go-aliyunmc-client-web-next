import { useEffect } from 'react';
import { Toast } from '~/root';

interface TaskSSEState {
	done: boolean;
	error: string | null;
}

interface TaskEffectsDeps {
	fullDeploySSE: TaskSSEState;
	archiveSSE: TaskSSEState;
	fullDeployTaskId: number | null;
	archiveTaskId: number | null;
	setArchiveTaskId: (v: number | null) => void;
	setTaskRunning: (v: boolean) => void;
	setTasksRefreshKey: (updater: (k: number) => number) => void;
	fetchAll: () => Promise<void>;
}

export function useTaskEffects({
	fullDeploySSE,
	archiveSSE,
	fullDeployTaskId,
	archiveTaskId,
	setArchiveTaskId,
	setTaskRunning,
	setTasksRefreshKey,
	fetchAll
}: TaskEffectsDeps) {
	// 部署收尾。任务 ID 保留到下一次部署，便于状态弹窗展示最终输出。
	useEffect(() => {
		if (!fullDeploySSE.done || !fullDeployTaskId) return;
		if (fullDeploySSE.error) {
			Toast.error('启动游戏失败: ' + fullDeploySSE.error);
		} else {
			Toast.success('游戏已就绪');
		}
		setTaskRunning(false);
		fetchAll();
	}, [fullDeploySSE.done]);

	// 归档收尾
	useEffect(() => {
		if (!archiveSSE.done || !archiveTaskId) return;
		if (archiveSSE.error) {
			Toast.error('归档失败: ' + archiveSSE.error);
		} else {
			Toast.success('归档成功');
		}
		setArchiveTaskId(null);
		setTasksRefreshKey(k => k + 1);
	}, [archiveSSE.done]);
}
