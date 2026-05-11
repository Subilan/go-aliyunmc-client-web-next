export function instanceStatusColor(status: string) {
	switch (status) {
		case 'Running':
			return 'bg-green-500';
		case 'Starting':
		case 'Stopping':
			return 'bg-yellow-500';
		case 'Stopped':
			return 'bg-red-500';
		default:
			return 'bg-neutral-500';
	}
}

export function instanceStatusText(status: string) {
	switch (status) {
		case 'Running':
			return '运行中';
		case 'Starting':
			return '启动中';
		case 'Stopping':
			return '关闭中';
		case 'Stopped':
			return '已关闭';
		case 'Pending':
			return '初始化中';
		default:
			return '未知状态';
	}
}

export function taskTypeLabel(type: string) {
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
