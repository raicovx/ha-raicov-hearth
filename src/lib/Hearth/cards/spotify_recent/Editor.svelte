<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { integerFromInput } from '../../edit/numbers';
	import type { CardEditorProps } from '../types';
	import type { SpotifyRecentCard } from './descriptor';
	import { SPOTIFY_RECENT_DEFAULT, SPOTIFY_RECENT_MAX } from '../../model/cards/spotify_recent';
	import EntityField from '../../edit/EntityField.svelte';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: CardEditorProps<SpotifyRecentCard> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	let entity = $state(initial?.entity ?? '');
	let title = $state(initial?.title ?? '');
	let limit = $state(initial?.limit ? String(initial.limit) : '');
	let defaultDevice = $state(initial?.default_device ?? '');

	let parsedLimit = $derived.by(() => {
		const count = integerFromInput(limit);
		return Number.isFinite(count) && count >= 1 ? Math.min(count, SPOTIFY_RECENT_MAX) : undefined;
	});

	$effect(() => {
		onchange({
			fields: {
				entity: entity.trim() || undefined,
				title: title.trim() || undefined,
				limit: parsedLimit,
				default_device: defaultDevice.trim() || undefined
			}
		});
	});
</script>

<EntityField label={$lang('entity')} bind:value={entity} domains={['media_player']} />
<TextField
	label={$lang('hearth_title')}
	bind:value={title}
	placeholder={$lang('hearth_card_spotify_recent_name')}
/>
<TextField
	label={$lang('hearth_spotify_recent_limit')}
	bind:value={limit}
	placeholder={String(SPOTIFY_RECENT_DEFAULT)}
	hint={$lang('hearth_spotify_recent_limit_hint')}
/>
<TextField
	label={$lang('hearth_default_device')}
	bind:value={defaultDevice}
	placeholder={$lang('hearth_example_speaker')}
/>
<div class="hint">{$lang('hearth_spotify_recent_hint')}</div>
