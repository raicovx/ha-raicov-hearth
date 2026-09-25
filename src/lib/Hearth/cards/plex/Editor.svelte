<script lang="ts">
	import { ICON } from '../../iconSizes';
	import { lang } from '$lib/core/i18n';
	import { activateOnKeyboard } from '../../interaction';
	import { fetchSections, type PlexSection } from '../../plex';
	import type { CardEditorProps } from '../types';
	import type { PlexCard } from './descriptor';
	import EntityField from '../../edit/EntityField.svelte';
	import Icon from '../../Icon.svelte';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: CardEditorProps<PlexCard> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	let title = $state(initial?.title ?? '');
	let libraries = $state<string[]>([...(initial?.libraries ?? [])]);
	let players = $state<{ entity: string }[]>(
		(initial?.players ?? []).map((entity) => ({ entity }))
	);

	// the server's libraries, so they can be picked rather than typed
	let available = $state<PlexSection[] | null>(null);
	$effect(() => {
		fetchSections()
			.then((found) => (available = found))
			.catch(() => (available = []));
	});

	// a library named in YAML that the server no longer has still shows, to be removed
	let choices = $derived([
		...(available ?? []).map((section) => section.title),
		...libraries.filter((title) => !available?.some((section) => section.title === title))
	]);

	function toggleLibrary(name: string) {
		libraries = libraries.includes(name)
			? libraries.filter((entry) => entry !== name)
			: [...libraries, name];
	}

	$effect(() => {
		const chosenPlayers = players.map((row) => row.entity.trim()).filter(Boolean);
		onchange({
			fields: {
				title: title.trim() || undefined,
				libraries: libraries.length ? [...libraries] : undefined,
				players: chosenPlayers.length ? chosenPlayers : undefined
			}
		});
	});
</script>

<TextField
	label={$lang('hearth_title')}
	bind:value={title}
	placeholder={$lang('hearth_card_plex_name')}
/>

<div class="group-label">{$lang('hearth_plex_libraries')}</div>
{#if available === null}
	<div class="hint">{$lang('hearth_loading')}</div>
{:else if !choices.length}
	<div class="hint">{$lang('hearth_plex_not_set_up')}</div>
{:else}
	<div class="chips">
		{#each choices as name (name)}
			<div
				class="chip"
				class:active={libraries.includes(name)}
				role="button"
				tabindex="0"
				aria-pressed={libraries.includes(name)}
				onclick={() => toggleLibrary(name)}
				onkeydown={(event) => activateOnKeyboard(event, () => toggleLibrary(name))}
			>
				{name}
			</div>
		{/each}
	</div>
	<div class="hint">{$lang('hearth_plex_libraries_hint')}</div>
{/if}

<div class="group-label">{$lang('hearth_plex_players')}</div>
{#each players as row, index (index)}
	<div class="filter-row">
		<div class="filter-fields">
			<EntityField label={$lang('entity')} bind:value={row.entity} domains={['media_player']} />
		</div>
		<span
			class="remove"
			role="button"
			tabindex="0"
			aria-label={$lang('delete')}
			onclick={() => players.splice(index, 1)}
			onkeydown={(event) => activateOnKeyboard(event, () => players.splice(index, 1))}
		>
			<Icon name="delete" size={ICON.control} />
		</span>
	</div>
{/each}
<div
	class="add-filter"
	role="button"
	tabindex="0"
	onclick={() => players.push({ entity: '' })}
	onkeydown={(event) => activateOnKeyboard(event, () => players.push({ entity: '' }))}
>
	<Icon name="add" size={ICON.control} />
	<span>{$lang('hearth_add_player')}</span>
</div>
<div class="hint">{$lang('hearth_plex_players_hint')}</div>
