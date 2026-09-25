<script lang="ts">
	import { ICON } from '../../iconSizes';
	import { lang, selectedLanguage } from '$lib/core/i18n';
	import { states } from '$lib/core/ha/entities';
	import { connected, services } from '$lib/core/ha/connection';
	import { timer } from '$lib/core/app/clock';
	import { relativeTime } from '$lib/core/i18n/time';
	import { hearthEditMode } from '../../store';
	import { fetchRecentTracks, spotifyPlusEntityFor, type RecentTrack } from '../../media';
	import { SPOTIFY_RECENT_DEFAULT } from '../../model/cards/spotify_recent';
	import { getHearthInteractionMode } from '../../interaction';
	import AnchoredPopover from '../../AnchoredPopover.svelte';
	import Icon from '../../Icon.svelte';
	import PlayOn from './PlayOn.svelte';
	import type { SpotifyRecentCard } from './descriptor';

	let { card }: { card: SpotifyRecentCard } = $props();

	const preview = getHearthInteractionMode() === 'preview';

	// Spotify files a play a little after the track changes, so the lookup waits
	const AFTER_TRACK_CHANGE_MS = 8000;

	let spEntity = $derived(
		card.entity && $services?.spotifyplus ? spotifyPlusEntityFor(card.entity) : undefined
	);
	let limit = $derived(card.limit ?? SPOTIFY_RECENT_DEFAULT);
	// the track playing on the account; a new one means the last one joined the history
	let playing = $derived(
		spEntity ? String($states?.[spEntity]?.attributes?.media_content_id ?? '') : ''
	);

	let tracks = $state<RecentTrack[] | null>(null);
	let failed = $state(false);
	let loaded = false;

	$effect(() => {
		const entity = spEntity;
		const count = limit;
		void playing;
		if (!entity || !$connected) return;
		let cancelled = false;
		const load = () =>
			fetchRecentTracks(entity, count).then((found) => {
				if (cancelled) return;
				failed = found === null;
				if (found) tracks = found;
				loaded = true;
			});
		// the first load is immediate; later ones follow a track change
		const timeout = setTimeout(load, loaded ? AFTER_TRACK_CHANGE_MS : 0);
		return () => {
			cancelled = true;
			clearTimeout(timeout);
		};
	});

	// the track whose device list is open, and the tile it points at; kept
	// after closing, since the popover still reads them while it fades out
	let picked = $state<{ track: RecentTrack; anchor: HTMLElement } | null>(null);
	let pickerOpen = $state(false);

	function pick(track: RecentTrack, anchor: HTMLElement) {
		if ($hearthEditMode && !preview) return;
		const same = pickerOpen && picked?.track.uri === track.uri;
		picked = { track, anchor };
		pickerOpen = !same;
	}

	$effect(() => {
		if ($hearthEditMode && !preview) pickerOpen = false;
	});

	// recomputed as the clock ticks, so "5 minutes ago" keeps up
	let playedWhen = $derived.by(() => {
		void $timer;
		return new Map(
			(tracks ?? [])
				.filter((track) => track.playedAt)
				.map((track) => [track.uri, relativeTime(track.playedAt, $selectedLanguage)])
		);
	});
</script>

<div class="card">
	<div class="header">
		<Icon name="history" size={ICON.tile} color="var(--h-accent-icon)" />
		<div class="title">{card.title || $lang('hearth_card_spotify_recent_name')}</div>
	</div>

	{#if !spEntity}
		<div class="note">{$lang('hearth_spotify_recent_needs_spotifyplus')}</div>
	{:else if tracks === null}
		<div class="note" class:error={failed}>
			{failed ? $lang('hearth_spotify_recent_failed') : $lang('hearth_loading')}
		</div>
	{:else if !tracks.length}
		<div class="note">{$lang('hearth_spotify_recent_empty')}</div>
	{:else}
		<div class="tracks">
			{#each tracks as track (track.uri)}
				<button
					type="button"
					class="track pressable"
					title={track.artist ? `${track.name} · ${track.artist}` : track.name}
					aria-haspopup="dialog"
					aria-expanded={pickerOpen && picked?.track.uri === track.uri}
					onclick={(event) => pick(track, event.currentTarget)}
				>
					<div class="art">
						{#if track.image}
							<img src={track.image} alt="" loading="lazy" />
						{:else}
							<Icon name="music_note" size={ICON.hero} color="var(--h-icon-dim)" />
						{/if}
					</div>
					<span class="name">{track.name}</span>
					{#if track.artist}
						<span class="caption">{track.artist}</span>
					{/if}
					{#if playedWhen.get(track.uri)}
						<span class="caption when">{playedWhen.get(track.uri)}</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

{#if pickerOpen && picked && card.entity && spEntity}
	<AnchoredPopover anchor={picked.anchor} onclose={() => (pickerOpen = false)}>
		<PlayOn
			track={picked.track}
			entity={card.entity}
			{spEntity}
			defaultDevice={card.default_device}
			readonly={preview}
			onplayed={() => (pickerOpen = false)}
		/>
	</AnchoredPopover>
{/if}

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-width: 0;
		padding: var(--h-card-padding);
		border-radius: var(--h-radius-card);
		background: rgb(var(--h-surface-rgb) / calc(0.045 * var(--h-fill-scale)));
		backdrop-filter: var(--h-surface-blur);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.06 * var(--h-line-scale)));
		box-shadow: var(--h-card-shadow);
	}

	.header {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.title {
		font-size: var(--h-type-title);
		font-weight: 600;
		color: var(--h-text-2);
	}

	/* one scrolling row, so the card keeps its height as the history grows */
	.tracks {
		display: flex;
		gap: 12px;
		overflow-x: auto;
		overscroll-behavior-x: contain;
		scrollbar-width: none;
	}

	.track {
		flex: none;
		display: flex;
		flex-direction: column;
		gap: 4px;
		width: 120px;
		min-width: 0;
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	/* the box takes its size from the slot; the image is laid over it */
	.art {
		position: relative;
		display: grid;
		place-items: center;
		width: 100%;
		aspect-ratio: 1;
		border-radius: var(--h-radius-xs);
		overflow: hidden;
		background: rgb(var(--h-surface-rgb) / calc(0.06 * var(--h-fill-scale)));
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.06 * var(--h-line-scale)));
	}

	img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.name,
	.caption {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.name {
		font-size: var(--h-type-secondary);
		color: var(--h-text-2);
	}

	.caption {
		font-size: var(--h-type-small);
		color: var(--h-text-5);
	}

	.when {
		color: var(--h-label);
	}

	.note {
		font-size: var(--h-type-secondary);
		color: var(--h-text-5);
	}

	.note.error {
		color: var(--h-bad-text);
	}
</style>
