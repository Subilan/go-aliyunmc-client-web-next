import {
	ArchiveIcon,
	DatabaseIcon,
	PlayIcon,
	RocketIcon,
	SquareIcon,
	Trash2Icon
} from 'lucide-react';
import type { FuncListItem } from '~/components/func-list';
import type { UserPermissions } from '~/types/UserPermissions';

interface ServerActionsDeps {
	canStartServer: boolean;
	canStopServer: boolean;
	permissions: UserPermissions | null;
	archiving: boolean;
	handleAction: (name: string) => void;
}

export function buildServerActions({
	canStartServer,
	canStopServer,
	permissions,
	archiving,
	handleAction
}: ServerActionsDeps): FuncListItem[] {
	return [
		{
			name: '启动服务器',
			icon: PlayIcon,
			action: () => handleAction('启动服务器'),
			disabled:
				!canStartServer ||
				(permissions !== null && !permissions.can_trigger_task) ||
				archiving
		},
		{
			name: '停止服务器',
			icon: SquareIcon,
			action: () => handleAction('停止服务器'),
			disabled: !canStopServer || (permissions !== null && !permissions.can_stop_server)
		}
	];
}

interface InstanceActionsDeps {
	canDeploy: boolean;
	canBackup: boolean;
	permissions: UserPermissions | null;
	archiving: boolean;
	setDeployConfirmOpen: (v: boolean) => void;
	handleAction: (name: string) => void;
}

export function buildInstanceActions({
	canDeploy,
	canBackup,
	permissions,
	archiving,
	setDeployConfirmOpen,
	handleAction
}: InstanceActionsDeps): FuncListItem[] {
	return [
		{
			name: '部署',
			icon: RocketIcon,
			action: () => setDeployConfirmOpen(true),
			disabled: !canDeploy || (permissions !== null && !permissions.can_trigger_task)
		},
		{
			name: '删除实例',
			icon: Trash2Icon,
			action: () => handleAction('删除实例'),
			disabled: permissions !== null && !permissions.can_delete_instance
		},
		{
			name: '备份',
			icon: DatabaseIcon,
			action: () => handleAction('备份'),
			disabled:
				!canBackup || archiving || (permissions !== null && !permissions.can_run_backup)
		},
		{
			name: '归档',
			icon: ArchiveIcon,
			action: () => handleAction('归档'),
			disabled:
				!canBackup || archiving || (permissions !== null && !permissions.can_run_archive)
		}
	];
}
