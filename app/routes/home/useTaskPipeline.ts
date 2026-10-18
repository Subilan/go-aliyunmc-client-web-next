import { useRef, useState } from 'react';
import { useTaskSSE } from '~/hooks/useTaskSSE';
import { useTaskEffects } from '~/routes/home/useTaskEffects';
import type { Task } from '~/types/Task';

export function useTaskPipeline(fetchAll: () => Promise<void>) {
	const [fullDeployTaskId, setFullDeployTaskId] = useState<number | null>(null);
	const [archiveTaskId, setArchiveTaskId] = useState<number | null>(null);
	const [taskRunning, setTaskRunning] = useState(false);
	const [serverStarting, setServerStarting] = useState(false);
	const [tasksRefreshKey, setTasksRefreshKey] = useState(0);
	const startServerTriggeredRef = useRef(false);

	const fullDeploySSE = useTaskSSE(fullDeployTaskId);
	const archiveSSE = useTaskSSE(archiveTaskId);

	useTaskEffects({
		fullDeploySSE,
		archiveSSE,
		fullDeployTaskId,
		archiveTaskId,
		setArchiveTaskId,
		setTaskRunning,
		setTasksRefreshKey,
		fetchAll
	});

	const activeOutputs = fullDeployTaskId ? fullDeploySSE.outputs : [];
	const latestOutput =
		activeOutputs.length > 0 ? activeOutputs[activeOutputs.length - 1].output : null;
	const archiving = archiveTaskId !== null;

	function syncRunningTasks(tasks: Task[], srvOnline: boolean) {
		const runningFullDeploy = tasks.find(
			t => t.type === 'oneclick_start_game' && t.status === 'running'
		);
		if (runningFullDeploy) {
			setFullDeployTaskId(runningFullDeploy.ID);
		}

		// 其他入口触发的部署链路任务同样要禁掉启动游戏。
		const chainTypes = ['oneclick_start_game', 'deploy', 'create_instance', 'start_server'];
		if (tasks.some(t => chainTypes.includes(t.type) && t.status === 'running')) {
			setTaskRunning(true);
		}

		const runningStart = tasks.find(t => t.type === 'start_server' && t.status === 'running');
		if (runningStart && !srvOnline) {
			setServerStarting(true);
			startServerTriggeredRef.current = true;
		}

		const runningArchive = tasks.find(t => t.type === 'archive' && t.status === 'running');
		if (runningArchive) setArchiveTaskId(runningArchive.ID);
	}

	return {
		fullDeployTaskId,
		setFullDeployTaskId,
		taskRunning,
		setTaskRunning,
		serverStarting,
		setServerStarting,
		tasksRefreshKey,
		setTasksRefreshKey,
		latestOutput,
		fullDeployOutputs: activeOutputs,
		fullDeployDone: fullDeploySSE.done,
		fullDeployError: fullDeploySSE.error,
		archiving,
		startServerTriggeredRef,
		syncRunningTasks
	};
}
