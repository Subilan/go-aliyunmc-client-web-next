import type { Model } from './Model';

export interface Instance extends Model {
	instanceId: string;
	instanceType: string;
	regionId: string;
	zoneId: string;
	vSwitchId: string;
	ip: string;
	isDeployed: boolean;
}

