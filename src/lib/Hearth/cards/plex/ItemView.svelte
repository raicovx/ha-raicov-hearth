<script lang="ts">
	import { ICON } from '../../iconSizes';
	import { lang } from '$lib/core/i18n';
	import Icon from '../../Icon.svelte';
	import Poster from './Poster.svelte';
	import PlayOn from './PlayOn.svelte';
	import {
		fetchChildren,
		playable,
		posterOf,
		posterUrl,
		type PlexClient,
		type PlexItem
	} from '../../plex';

	let {
		item,
		players,
		clients,
		serverName,
		onopen
	}: {
		item: PlexItem;
		players: string[];
		clients: PlexClient[] | null;
		serverName?: string;
		onopen: (item: PlexItem) => void;
	} = $props();

	let children = $state<PlexItem[] | null>(null);
	let childrenError = $state(false);

	$effect(() => {
		if (playable(item)) return;
		let cancelled = false;
		fetchChildren(item.ratingKey)
			.then((found) => {
				if (!cancelled) children = found;
			})
			.catch(() => {
				if (!cancelled) childrenError = true;
			});
		return () => {
			cancelled = true;
		};
	});

	function minutes(ms: number | undefined) {
		if (!ms) return undefined;
		const total = Math.round(ms / 60_000);
		return total >= 60 ? `${Math.floor(total / 60)}h ${total % 60}m` : `${total}m`;
	}

	let meta = $derived(
		[
			item.type === 'episode'
				? `${item.grandparentTitle} · S${item.parentIndex}E${item.index}`
				: item.type === 'season'
					? item.parentTitle
					: undefined,
			item.year,
			minutes(item.duration),
			item.leafCount ? `${item.leafCount} ${$lang('hearth_plex_episodes')}` : undefined
		]
			.filter(Boolean)
			.join(' · ')
	);
	let art = $derived(posterUrl(posterOf(item), 240, 360));
</script>

<div class="summary-row">
	<div class="art">
		{#if art}
			<img src={art} alt="" />
		{:else}
			<Icon name="movie" size={ICON.hero} color="var(--h-icon-dim)" />
		{/if}
	</div>
	<div class="copy">
		<div class="name">{item.title}</div>
		{#if meta}<div class="meta">{meta}</div>{/if}
		{#if item.summary}<p class="summary">{item.summary}</p>{/if}
	</div>
</div>

{#if playable(item)}
	<PlayOn {item} {players} {clients} {serverName} />
{:else if childrenError}
	<div class="note">{$lang('hearth_plex_unreachable')}</div>
{:else if children === null}
	<div class="note">{$lang('hearth_loading')}</div>
{:else if item.type === 'show'}
	<div class="grid">
		{#each children as season (season.ratingKey)}
			<Poster item={season} onselect={onopen} />
		{/each}
	</div>
{:else}
	<div class="episodes">
		{#each children as episode (episode.ratingKey)}
			<button type="button" class="episode pressable" onclick={() => onopen(episode)}>
				<span class="number">{episode.index ?? ''}</span>
				<span class="episode-title">{episode.title}</span>
				<span class="length">{minutes(episode.duration) ?? ''}</span>
				{#if episode.viewCount}
					<Icon name="check_circle" size={ICON.inline} color="var(--h-good)" />
				{/if}
			</button>
		{/each}
	</div>
{/if}

<style>
	.summary-row {
		display: flex;
		gap: 16px;
		align-items: flex-start;
	}

	.art {
		position: relative;
		flex: none;
		display: grid;
		place-items: center;
		width: 112px;
		aspect-ratio: 2 / 3;
		border-radius: var(--h-radius-xs);
		overflow: hidden;
		background: rgb(var(--h-surface-rgb) / calc(0.06 * var(--h-fill-scale)));
	}

	.art img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.copy {
		min-width: 0;
	}

	.name {
		font-size: var(--h-type-subtitle);
		font-weight: 600;
		color: var(--h-text-1);
	}

	.meta {
		margin-top: 4px;
		font-size: var(--h-type-secondary);
		color: var(--h-text-5);
	}

	.summary {
		margin: 10px 0 0;
		font-size: var(--h-type-secondary);
		color: var(--h-text-3);
		display: -webkit-box;
		-webkit-line-clamp: 5;
		line-clamp: 5;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
		gap: 14px 12px;
	}

	.episodes {
		display: flex;
		flex-direction: column;
	}

	.episode {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 4px;
		border: 0;
		border-top: 1px solid rgb(var(--h-line-rgb) / calc(0.07 * var(--h-line-scale)));
		background: none;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.episode:first-child {
		border-top: 0;
	}

	.number {
		width: 24px;
		flex: none;
		font-family: var(--h-font-mono);
		font-size: var(--h-type-small);
		color: var(--h-text-5);
	}

	.episode-title {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: var(--h-type-body);
		color: var(--h-text-2);
	}

	.length {
		font-size: var(--h-type-small);
		color: var(--h-text-5);
	}

	.note {
		font-size: var(--h-type-secondary);
		color: var(--h-text-5);
	}
</style>
