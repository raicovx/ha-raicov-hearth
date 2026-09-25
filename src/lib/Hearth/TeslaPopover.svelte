<script lang="ts">
	import { ICON } from './iconSizes';
	import { lang, selectedLanguage } from '$lib/core/i18n';
	import Ripple from '$lib/ui/actions/ripple';
	import { config } from '$lib/core/ha/connection';
	import { entityActiveFor, getDomain, states } from '$lib/core/ha/entities';
	import { controlOverrides } from '$lib/core/ha/commands';
	import { setClimatePower } from '$lib/core/domains/climate';
	import { PRESS_RIPPLE } from './config';
	import { getHearthInteractionMode } from './interaction';
	import { formatReading } from './format';
	import { TESLA_TIRE_FIELDS, type TeslaCard } from './model/cards/tesla';
	import { carBattery, carReading } from './tesla';
	import Icon from './Icon.svelte';

	let { card }: { card: TeslaCard } = $props();

	const readonly = getHearthInteractionMode() !== 'runtime';

	const TIRE_LABELS: Record<(typeof TESLA_TIRE_FIELDS)[number], string> = {
		tire_front_left_entity: 'hearth_tesla_front_left',
		tire_front_right_entity: 'hearth_tesla_front_right',
		tire_rear_left_entity: 'hearth_tesla_rear_left',
		tire_rear_right_entity: 'hearth_tesla_rear_right'
	};

	let battery = $derived(card.battery_entity ? carBattery($states?.[card.battery_entity]) : null);
	let lastCharge = $derived(
		card.last_charge_entity
			? carReading($states?.[card.last_charge_entity], $selectedLanguage)
			: null
	);
	let tires = $derived(
		TESLA_TIRE_FIELDS.filter((field) => card[field]).map((field) => ({
			field,
			label: TIRE_LABELS[field],
			reading: carReading($states?.[card[field] as string], $selectedLanguage) ?? '-'
		}))
	);

	let climate = $derived(card.climate_entity ? $states?.[card.climate_entity] : undefined);
	let climateOn = $derived(
		card.climate_entity ? entityActiveFor(card.climate_entity, climate, $controlOverrides) : false
	);
	let unit = $derived($config?.unit_system?.temperature ?? '°');
	// a climate entity knows the cabin temperature; a switch knows nothing more
	let cabin = $derived(
		getDomain(card.climate_entity) === 'climate' &&
			typeof climate?.attributes?.current_temperature === 'number'
			? formatReading(climate.attributes.current_temperature, unit)
			: null
	);
	let target = $derived(
		getDomain(card.climate_entity) === 'climate' &&
			typeof climate?.attributes?.temperature === 'number'
			? formatReading(climate.attributes.temperature, unit)
			: null
	);

	function toggleClimate() {
		if (readonly || !card.climate_entity) return;
		setClimatePower(card.climate_entity, !climateOn);
	}
</script>

<div class="header">
	<div class="title">{card.title || $lang('hearth_card_tesla_name')}</div>
</div>

{#if card.battery_entity || card.last_charge_entity}
	<div class="stats">
		{#if card.battery_entity}
			<div class="stat">
				<div class="label">
					<Icon name="battery_charging_full" size={ICON.control} color="var(--h-accent-dim-text)" />
					{$lang('battery')}
				</div>
				<div class="value">{battery === null ? '-' : `${battery}%`}</div>
				<div class="bar" aria-hidden="true">
					<div
						class="level"
						class:low={battery !== null && battery <= 20}
						style:width="{battery ?? 0}%"
					></div>
				</div>
			</div>
		{/if}
		{#if card.last_charge_entity}
			<div class="stat">
				<div class="label">
					<Icon name="ev_station" size={ICON.control} color="var(--h-accent-dim-text)" />
					{$lang('hearth_tesla_last_charge')}
				</div>
				<div class="value">{lastCharge ?? '-'}</div>
			</div>
		{/if}
	</div>
{/if}

{#if tires.length}
	<div class="section-label">{$lang('hearth_tesla_tire_pressure')}</div>
	<div class="tires">
		{#each tires as tire (tire.field)}
			<div class="tire" style:grid-area={tire.field}>
				<div class="tire-value">{tire.reading}</div>
				<div class="tire-label">{$lang(tire.label)}</div>
			</div>
		{/each}
		<div class="car" aria-hidden="true">
			<Icon name="directions_car" size={ICON.tile} color="var(--h-icon)" />
		</div>
	</div>
{/if}

{#if card.climate_entity}
	<div class="climate" class:on={climateOn}>
		<div class="climate-text">
			<div class="climate-title">
				{$lang(climateOn ? 'hearth_tesla_climate_on' : 'hearth_tesla_climate_off')}
			</div>
			{#if cabin || target}
				<div class="climate-detail">
					{[
						cabin ? `${$lang('hearth_tesla_cabin')} ${cabin}` : null,
						target ? `${$lang('hearth_tesla_set_to')} ${target}` : null
					]
						.filter(Boolean)
						.join(' · ')}
				</div>
			{/if}
		</div>
		<button
			type="button"
			class="control pressable"
			class:primary={!climateOn}
			use:Ripple={PRESS_RIPPLE}
			onclick={toggleClimate}
		>
			<Icon name={climateOn ? 'power_settings_new' : 'mode_fan'} size={ICON.control} />
			{$lang(climateOn ? 'hearth_tesla_stop_climate' : 'hearth_tesla_start_climate')}
		</button>
	</div>
{/if}

<style>
	.header {
		padding: 2px 2px 0;
	}

	.title {
		color: var(--h-text-1);
		font-size: var(--h-type-title);
		font-weight: 600;
		letter-spacing: -0.2px;
	}

	.stats {
		display: grid;
		grid-auto-columns: minmax(0, 1fr);
		grid-auto-flow: column;
		gap: 8px;
		margin-top: 16px;
	}

	.stat,
	.tire,
	.climate {
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.085 * var(--h-line-scale)));
		border-radius: var(--h-radius-sm);
		background: rgb(var(--h-surface-rgb) / calc(0.045 * var(--h-fill-scale)));
	}

	.stat {
		min-width: 0;
		padding: 14px;
	}

	.label {
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--h-text-4);
		font-size: var(--h-type-label);
	}

	.value {
		margin-top: 8px;
		overflow: hidden;
		color: var(--h-text-2);
		font-size: var(--h-type-emphasis);
		font-weight: 600;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.bar {
		height: 4px;
		margin-top: 8px;
		overflow: hidden;
		border-radius: var(--h-radius-pill);
		background: rgb(var(--h-surface-rgb) / calc(0.12 * var(--h-fill-scale)));
	}

	.level {
		height: 100%;
		background: var(--h-good);
	}

	.level.low {
		background: var(--h-bad-text);
	}

	.section-label {
		margin-top: 16px;
		color: var(--h-text-4);
		font-family: var(--h-font-mono);
		font-size: var(--h-type-caption);
		letter-spacing: 1.2px;
		text-transform: uppercase;
	}

	/* the tyres sit at the car's corners, seen from above */
	.tires {
		display: grid;
		grid-template-areas:
			'tire_front_left_entity car tire_front_right_entity'
			'tire_rear_left_entity car tire_rear_right_entity';
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
		gap: 8px;
		margin-top: 8px;
	}

	.tire {
		min-width: 0;
		padding: 10px 12px;
		text-align: center;
	}

	.tire-value {
		color: var(--h-text-2);
		font-family: var(--h-font-mono);
		font-size: var(--h-type-body);
		font-weight: 600;
	}

	.tire-label {
		margin-top: 2px;
		overflow: hidden;
		color: var(--h-text-5);
		font-size: var(--h-type-label);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.car {
		display: flex;
		grid-area: car;
		align-items: center;
		justify-content: center;
		padding: 0 6px;
		transform: rotate(-90deg);
	}

	.climate {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-top: 12px;
		padding: 14px 16px;
	}

	.climate.on {
		border-color: rgb(var(--h-accent-rgb) / calc(0.35 * var(--h-accent-scale)));
		background: rgb(var(--h-accent-rgb) / calc(0.1 * var(--h-accent-scale)));
	}

	.climate-text {
		flex: 1;
		min-width: 0;
	}

	.climate-title {
		color: var(--h-text-2);
		font-size: var(--h-type-body);
		font-weight: 600;
	}

	.climate-detail {
		margin-top: 2px;
		color: var(--h-text-5);
		font-size: var(--h-type-small);
	}

	.control {
		display: flex;
		flex: none;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
		overflow: hidden;
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.085 * var(--h-line-scale)));
		border-radius: var(--h-radius-sm);
		background: rgb(var(--h-surface-rgb) / calc(0.045 * var(--h-fill-scale)));
		color: var(--h-text-3);
		font: inherit;
		font-size: var(--h-type-body);
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}

	.control.primary {
		border-color: rgb(var(--h-accent-rgb) / calc(0.35 * var(--h-accent-scale)));
		background: rgb(var(--h-accent-rgb) / calc(0.16 * var(--h-accent-scale)));
		color: var(--h-accent-text);
	}
</style>
