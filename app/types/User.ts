import type { Model } from "./Model"

export interface User extends Model {
	username: string;
	role: string;
	whitelist_uuid?: string;
}
