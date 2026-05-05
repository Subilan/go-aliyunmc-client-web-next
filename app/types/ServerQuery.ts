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

export function parseServerQuery(raw: ServerQueryRaw): ServerQuery {
	const pluginsSplit = raw.plugins.split(':');
	const platform = pluginsSplit[0];
	const plugins = pluginsSplit[1].split('; ').map(x => x.trim());

	return {
		...raw,
		maxplayers: +raw.maxplayers,
		numplayers: +raw.numplayers,
		platform,
		plugins
	};
}
