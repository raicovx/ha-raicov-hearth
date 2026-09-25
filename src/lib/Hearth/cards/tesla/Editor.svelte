<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import type { CardEditorProps } from '../types';
	import type { TeslaCard } from './descriptor';
	import EntityField from '../../edit/EntityField.svelte';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: CardEditorProps<TeslaCard> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	let title = $state(initial?.title ?? '');
	let batteryEntity = $state(initial?.battery_entity ?? '');
	let lastChargeEntity = $state(initial?.last_charge_entity ?? '');
	let frontLeft = $state(initial?.tire_front_left_entity ?? '');
	let frontRight = $state(initial?.tire_front_right_entity ?? '');
	let rearLeft = $state(initial?.tire_rear_left_entity ?? '');
	let rearRight = $state(initial?.tire_rear_right_entity ?? '');
	let climateEntity = $state(initial?.climate_entity ?? '');

	$effect(() => {
		onchange({
			fields: {
				title: title.trim() || undefined,
				battery_entity: batteryEntity.trim() || undefined,
				last_charge_entity: lastChargeEntity.trim() || undefined,
				tire_front_left_entity: frontLeft.trim() || undefined,
				tire_front_right_entity: frontRight.trim() || undefined,
				tire_rear_left_entity: rearLeft.trim() || undefined,
				tire_rear_right_entity: rearRight.trim() || undefined,
				climate_entity: climateEntity.trim() || undefined
			}
		});
	});
</script>

<TextField label={$lang('hearth_title_optional')} bind:value={title} />
<EntityField
	label={$lang('hearth_battery_entity_optional')}
	bind:value={batteryEntity}
	domains={['sensor']}
/>
<EntityField
	label={$lang('hearth_tesla_last_charge_entity')}
	bind:value={lastChargeEntity}
	domains={['sensor']}
	hint={$lang('hearth_tesla_last_charge_hint')}
/>
<div class="group-label">{$lang('hearth_tesla_tire_pressure')}</div>
<EntityField label={$lang('hearth_tesla_front_left')} bind:value={frontLeft} domains={['sensor']} />
<EntityField
	label={$lang('hearth_tesla_front_right')}
	bind:value={frontRight}
	domains={['sensor']}
/>
<EntityField label={$lang('hearth_tesla_rear_left')} bind:value={rearLeft} domains={['sensor']} />
<EntityField label={$lang('hearth_tesla_rear_right')} bind:value={rearRight} domains={['sensor']} />
<div class="group-label">{$lang('hearth_tesla_climate')}</div>
<EntityField
	label={$lang('hearth_tesla_climate_entity')}
	bind:value={climateEntity}
	domains={['climate', 'switch']}
	hint={$lang('hearth_tesla_climate_hint')}
/>
