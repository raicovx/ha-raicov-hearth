import { callEntityService, markPending, service, setControlOverride } from '../ha/commands';
import { getDomain } from '../ha/entities';

export function setClimateTemperature(entity: string, temperature: number) {
	setControlOverride(`climate:${entity}`, temperature, 5000);
	markPending(entity);
	service('climate', 'set_temperature', { entity_id: entity, temperature });
}

export function setClimateHvacMode(entity: string, mode: string) {
	markPending(entity);
	service('climate', 'set_hvac_mode', { entity_id: entity, hvac_mode: mode });
}

/**
 * Starts or stops a climate the way a car app does: a climate entity turns on
 * in its last mode, and a switch (some car integrations expose preconditioning
 * as one) is flipped.
 */
export function setClimatePower(entity: string, on: boolean) {
	setControlOverride(`active:${entity}`, on ? 1 : 0);
	callEntityService(getDomain(entity) ?? 'climate', on ? 'turn_on' : 'turn_off', entity);
}
