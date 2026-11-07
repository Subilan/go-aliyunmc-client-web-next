export interface ServerQueryRaw {
	game_id: string;
	gametype: string;
	hostip: string;
	hostname: string;
	hostport: string;
	map: string;
	maxplayers: string;
	numplayers: string;
	plugins: string;
	version: string;
}

export interface ServerQuery {
	game_id: string;
	gametype: string;
	hostip: string;
	hostname: string;
	hostport: string;
	map: string;
	maxplayers: number;
	numplayers: number;
	plugins: string[];
	platform: string;
	version: string;
}

export function parseServerQuery(raw: Partial<ServerQueryRaw>): ServerQuery {
	const pluginInfo = raw.plugins ?? '';
	const separator = pluginInfo.indexOf(':');
	const platform = separator >= 0 ? pluginInfo.slice(0, separator) : pluginInfo;
	const pluginList = separator >= 0 ? pluginInfo.slice(separator + 1) : '';
	const plugins = pluginList
		? pluginList.split(';').map(x => x.trim()).filter(Boolean)
		: [];

	return {
		game_id: raw.game_id ?? '',
		gametype: raw.gametype ?? '',
		hostip: raw.hostip ?? '',
		hostname: raw.hostname ?? '',
		hostport: raw.hostport ?? '',
		map: raw.map ?? '',
		maxplayers: Number(raw.maxplayers ?? 0),
		numplayers: Number(raw.numplayers ?? 0),
		platform,
		plugins,
		version: raw.version ?? ''
	};
}
