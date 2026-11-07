const TOAST_ERROR_LIMIT = 120;

const errorSummaries: { pattern: RegExp; message: string }[] = [
	{
		pattern: /FAILED TO BIND TO PORT|Address already in use/i,
		message: '服务器端口已被占用'
	},
	{
		pattern: /eula/i,
		message: '服务器尚未同意 Minecraft EULA'
	},
	{
		pattern: /UnsupportedClassVersionError|Unsupported major\.minor version/i,
		message: 'Java 版本不兼容'
	},
	{
		pattern: /OutOfMemoryError|Could not reserve enough space/i,
		message: '服务器内存不足'
	},
	{
		pattern: /等待服务器就绪超时/,
		message: '服务器启动超时'
	},
	{
		pattern: /SSH连接失败/i,
		message: '无法连接服务器'
	}
];

export function taskErrorToastText(error: string): string {
	const raw = error.trim();
	if (!raw) {
		return '任务执行失败';
	}

	for (const { pattern, message } of errorSummaries) {
		if (pattern.test(raw)) {
			return message;
		}
	}

	const oneLine = raw.replace(/\s+/g, ' ').trim();
	const characters = Array.from(oneLine);
	if (characters.length <= TOAST_ERROR_LIMIT) {
		return oneLine;
	}
	return characters.slice(0, TOAST_ERROR_LIMIT).join('') + '…';
}
