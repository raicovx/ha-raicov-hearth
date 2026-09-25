import { describe, expect, it } from 'vitest';
import { hassEntity } from '$lib/core/ha/testing';
import { carBattery, carReading } from './tesla';

describe('carReading', () => {
	it('shows a number with its unit', () => {
		const tire = hassEntity('sensor.tire', '42.06', { unit_of_measurement: 'psi' });
		expect(carReading(tire, 'en')).toBe('42.1 psi');
	});

	it('shows a timestamp as time ago', () => {
		const at = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
		expect(carReading(hassEntity('sensor.charged', at, {}), 'en')).toBe('3 hours ago');
	});

	it('has nothing for an unavailable sensor', () => {
		expect(carReading(hassEntity('sensor.tire', 'unavailable', {}), 'en')).toBeNull();
		expect(carReading(undefined, 'en')).toBeNull();
	});
});

describe('carBattery', () => {
	it('rounds and clamps to a percentage', () => {
		expect(carBattery(hassEntity('sensor.battery', '76.6', {}))).toBe(77);
		expect(carBattery(hassEntity('sensor.battery', '104', {}))).toBe(100);
		expect(carBattery(hassEntity('sensor.battery', 'unknown', {}))).toBeNull();
	});
});
