import { useRef, useState } from 'react';
import { useTaskSSE } from '~/hooks/useTaskSSE';
import { useTaskEffects } from '~/routes/home/useTaskEffects';
import type { Task } from '~/types/Task';

export function useTaskPipeline(fetchAll: () => Promise<void>) {
	const [createTaskId, setCreateTaskId] = useState<number | null>(null);
	const [deployTaskId, setDeployTaskId] = useState<number | null>(null);
	const [startTaskId, setStartTaskId] = useState<number | null>(null);
	const [archiveTaskId, setArchiveTaskId] = useState<number | null>(null);
	const [taskRunning, setTaskRunning] = useState(false);
	const [serverStarting, setServerStarting] = useState(false);
	const [tasksRefreshKey, setTasksRefreshKey] = useState(0);
	const startServerTriggeredRef = useRef(false);

	const createSSE = useTaskSSE(createTaskId);
	const deploySSE = useTaskSSE(deployTaskId);
	const startSSE = useTaskSSE(startTaskId);
	const archiveSSE = useTaskSSE(archiveTaskId);

	useTaskEffects({
		createSSE,
		deploySSE,
		startSSE,
		archiveSSE,
		createTaskId,
		deployTaskId,
		startTaskId,
		archiveTaskId,
		setCreateTaskId,
		setDeployTaskId,
		setStartTaskId,
		setArchiveTaskId,
		setTaskRunning,
		setServerStarting,
		setTasksRefreshKey,
		startServerTriggeredRef,
		fetchAll
	});

	const activeOutputs = startTaskId
		? startSSE.outputs
		: deployTaskId
			? deploySSE.outputs
			: createSSE.outputs;
	const latestOutput =
		activeOutputs.length > 0 ? activeOutputs[activeOutputs.length - 1].output : null;
	const archiving = archiveTaskId !== null;

	function syncRunningTasks(tasks: Task[], srvOnline: boolean) {
		const runningCreate = tasks.find(
			t => t.type === 'create_instance' && t.status === 'running'
		);
		const runningDeploy = tasks.find(
			t => t.type === 'deploy' && t.status === 'running'
		);
		if (runningCreate || runningDeploy) {
			setCreateTaskId(runningCreate?.ID ?? null);
			setDeployTaskId(runningDeploy?.ID ?? null);
			setTaskRunning(true);
		}
		const runningStart = tasks.find(
			t => t.type === 'start_server' && t.status === 'running'
		);
		if (runningStart) {
			setStartTaskId(runningStart.ID);
			setTaskRunning(true);
			if (!srvOnline) {
				setServerStarting(true);
				startServerTriggeredRef.current = true;
			}
		}
		const runningArchive = tasks.find(
			t => t.type === 'archive' && t.status === 'running'
		);
		if (runningArchive) setArchiveTaskId(runningArchive.ID);
	}

	return {
		createTaskId,
		setCreateTaskId,
		deployTaskId,
		setDeployTaskId,
		startTaskId,
		setStartTaskId,
		archiveTaskId,
		taskRunning,
		setTaskRunning,
		serverStarting,
		setServerStarting,
		tasksRefreshKey,
		setTasksRefreshKey,
		latestOutput,
		archiving,
		startServerTriggeredRef,
		syncRunningTasks
	};
}
