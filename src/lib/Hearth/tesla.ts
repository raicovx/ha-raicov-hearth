import type { HassEntity } from 'home-assistant-js-websocket';
import { sensorNumber, UNAVAILABLE_STATES } from '$lib/core/ha/entities';
import { isTimestamp, relativeTime } from '$lib/core/i18n/time';
import { formatReading } from './format';

/**
 * A car sensor as one short reading: a timestamp as "3 hours ago" (how the
 * car integrations report a charge finishing), a number with its unit, other
 * text as Home Assistant sends it, and null when there is nothing to show.
 */
export function carReading(entity: HassEntity | undefined, language: string | undefined) {
	const state = entity?.state;
	if (!state || UNAVAILABLE_STATES.includes(state)) return null;
	if (isTimestamp(state)) return relativeTime(state, language);
	const value = sensorNumber(state);
	if (value === null) return state;
	return formatReading(value, entity?.attributes?.unit_of_measurement ?? '');
}

/** The battery as a whole percentage, or null while unknown. */
export function carBattery(entity: HassEntity | undefined): number | null {
	const value = sensorNumber(entity?.state);
	return value === null ? null : Math.round(Math.max(0, Math.min(100, value)));
}
