<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import type { CardEditorProps } from '../types';
	import type { TimerCard } from './descriptor';
	import { DEFAULT_TIMER_DURATIONS, normalizeDurations } from '../../model/cards/timer';
	import EntityField from '../../edit/EntityField.svelte';
	import IconField from '../../edit/IconField.svelte';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: CardEditorProps<TimerCard> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	let title = $state(initial?.title ?? '');
	let entity = $state(initial?.entity ?? '');
	let icon = $state(initial?.icon ?? '');
	let durations = $state((initial?.durations ?? DEFAULT_TIMER_DURATIONS).join(', '));

	let parsed = $derived(
		normalizeDurations(
			durations
				.split(/[,\s]+/)
				.map((part) => part.trim())
				.filter(Boolean)
		)
	);

	$effect(() => {
		onchange({
			fields: {
				title: title.trim() || undefined,
				entity: entity.trim() || undefined,
				icon: icon.trim() || undefined,
				durations: parsed
			}
		});
	});
</script>

<TextField
	label={$lang('hearth_title')}
	bind:value={title}
	placeholder={$lang('hearth_example_timer_title')}
/>
<EntityField label={$lang('entity')} bind:value={entity} domains={['timer']} />
<TextField
	label={$lang('hearth_timer_durations')}
	bind:value={durations}
	placeholder="40, 60, 120"
	hint={$lang('hearth_timer_durations_hint')}
	error={durations.trim() && parsed.length === 0 ? $lang('hearth_timer_durations_invalid') : null}
/>
<IconField label={$lang('hearth_icon_optional')} bind:value={icon} />
