import { useEffect } from 'react';
import { Toast } from '~/root';
import { triggerTask } from '~/utils/requests/task';

interface TaskSSEState {
	done: boolean;
	error: string | null;
}

interface TaskEffectsDeps {
	createSSE: TaskSSEState;
	deploySSE: TaskSSEState;
	startSSE: TaskSSEState;
	archiveSSE: TaskSSEState;
	createTaskId: number | null;
	deployTaskId: number | null;
	startTaskId: number | null;
	archiveTaskId: number | null;
	setCreateTaskId: (v: number | null) => void;
	setDeployTaskId: (v: number | null) => void;
	setStartTaskId: (v: number | null) => void;
	setArchiveTaskId: (v: number | null) => void;
	setTaskRunning: (v: boolean) => void;
	setServerStarting: (v: boolean) => void;
	setTasksRefreshKey: (updater: (k: number) => number) => void;
	startServerTriggeredRef: { current: boolean };
	fetchAll: () => Promise<void>;
}

export function useTaskEffects({
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
}: TaskEffectsDeps) {
	// Chain create -> deploy
	useEffect(() => {
		if (!createSSE.done || !createTaskId) return;
		if (createSSE.error) {
			Toast.error('创建实例失败: ' + createSSE.error);
			setCreateTaskId(null);
			setTaskRunning(false);
			return;
		}
		Toast.success('实例创建成功');
		triggerTask('deploy', {}).then(res => {
			if (res.data) {
				setDeployTaskId(res.data.ID);
				fetchAll();
			} else {
				Toast.error('触发部署失败: ' + res.error);
				setCreateTaskId(null);
				setTaskRunning(false);
			}
		});
	}, [createSSE.done]);

	// Chain deploy -> start_server
	useEffect(() => {
		if (!deploySSE.done || !deployTaskId) return;
		if (deploySSE.error) {
			Toast.error('部署失败: ' + deploySSE.error);
			setDeployTaskId(null);
			setTaskRunning(false);
			return;
		}
		Toast.success('部署成功');
		setServerStarting(true);
		startServerTriggeredRef.current = true;
		triggerTask('start_server', {}).then(res => {
			if (res.data) {
				setStartTaskId(res.data.ID);
				fetchAll();
			} else {
				Toast.error('触发启动服务器失败: ' + res.error);
				setDeployTaskId(null);
				setTaskRunning(false);
			}
		});
	}, [deploySSE.done]);

	// Standalone start_server completion
	useEffect(() => {
		if (startSSE.done && startTaskId) {
			if (startSSE.error) {
				Toast.error('启动服务器失败: ' + startSSE.error);
			}
			setStartTaskId(null);
			setTaskRunning(false);
			fetchAll();
		}
	}, [startSSE.done]);

	// Archive completion
	useEffect(() => {
		if (archiveSSE.done && archiveTaskId) {
			if (archiveSSE.error) {
				Toast.error('归档失败: ' + archiveSSE.error);
			} else {
				Toast.success('归档成功');
			}
			setArchiveTaskId(null);
			setTasksRefreshKey(k => k + 1);
		}
	}, [archiveSSE.done]);
}
