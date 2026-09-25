<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { ICON } from '../../iconSizes';
	import { activateOnKeyboard } from '../../interaction';
	import type { CardEditorProps } from '../types';
	import type { TemperatureCard } from './descriptor';
	import EntityField from '../../edit/EntityField.svelte';
	import Icon from '../../Icon.svelte';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: CardEditorProps<TemperatureCard> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	let label = $state(initial?.label ?? '');
	let entity = $state(initial?.entity ?? '');
	let extraSensors = $state<{ entity: string }[]>(
		(initial?.entities ?? []).map((entity) => ({ entity }))
	);
	let unit = $state(initial?.unit ?? '°C');
	let climateEntity = $state(initial?.climate_entity ?? '');
	let verdict = $state(initial?.verdict !== false);
	// custom verdict bands have no form fields; a YAML-authored object survives
	// form edits as long as the verdict stays enabled
	const initialBands = typeof initial?.verdict === 'object' ? initial.verdict : undefined;

	$effect(() => {
		onchange({
			fields: {
				label: label.trim() || undefined,
				entity: entity.trim() || undefined,
				entities: extraSensors.length
					? extraSensors.map((row) => row.entity.trim()).filter(Boolean)
					: undefined,
				unit: unit.trim() || undefined,
				climate_entity: climateEntity.trim() || undefined,
				verdict: verdict ? initialBands : false
			}
		});
	});
</script>

<TextField
	label={$lang('hearth_label')}
	bind:value={label}
	placeholder={$lang('hearth_example_temperature_label')}
/>
<EntityField label={$lang('entity')} bind:value={entity} domains={['sensor']} />
{#each extraSensors as row, index (index)}
	<div class="filter-row">
		<div class="filter-fields">
			<EntityField
				label={$lang('hearth_average_with')}
				bind:value={row.entity}
				domains={['sensor']}
			/>
		</div>
		<span
			class="remove"
			role="button"
			tabindex="0"
			aria-label={$lang('delete')}
			onclick={() => extraSensors.splice(index, 1)}
			onkeydown={(event) => activateOnKeyboard(event, () => extraSensors.splice(index, 1))}
		>
			<Icon name="delete" size={ICON.control} />
		</span>
	</div>
{/each}
<div
	class="add-filter"
	role="button"
	tabindex="0"
	onclick={() => extraSensors.push({ entity: '' })}
	onkeydown={(event) => activateOnKeyboard(event, () => extraSensors.push({ entity: '' }))}
>
	<Icon name="add" size={ICON.control} />
	<span>{$lang('hearth_add_sensor_to_average')}</span>
</div>
<div class="hint">{$lang('hearth_average_sensors_hint')}</div>
<TextField label={$lang('hearth_unit')} bind:value={unit} placeholder="°C" />
<EntityField
	label={$lang('hearth_thermostat_optional')}
	bind:value={climateEntity}
	domains={['climate']}
/>
<div class="hint">{$lang('hearth_adds_a_target_readout_with_controls')}</div>
<label class="check">
	<input type="checkbox" bind:checked={verdict} />
	<span>{$lang('hearth_verdict_pill_for_air_sensors_good')}</span>
</label>
<div class="hint">
	{$lang('hearth_judged_by_device_class_custom_thresholds')}
</div>
