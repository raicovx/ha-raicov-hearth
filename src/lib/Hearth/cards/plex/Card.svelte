<script lang="ts">
	import { ICON } from '../../iconSizes';
	import { lang } from '$lib/core/i18n';
	import { configuration } from '$lib/core/app/configuration';
	import Icon from '../../Icon.svelte';
	import Poster from './Poster.svelte';
	import {
		fetchRecentlyAdded,
		fetchSections,
		plexBrowser,
		searchPlex,
		type PlexItem,
		type PlexSection
	} from '../../plex';
	import type { PlexCard } from './descriptor';

	let { card }: { card: PlexCard } = $props();

	const SEARCH_DELAY_MS = 300;

	let configured = $derived(!!$configuration?.plex_url && !!$configuration?.plex_token_set);
	let sections = $state<PlexSection[]>([]);
	let recent = $state<PlexItem[] | null>(null);
	let loadError = $state<string | null>(null);

	let query = $state('');
	let results = $state<PlexItem[] | null>(null);
	let searching = $state(false);

	let libraryKey = $derived((card.libraries ?? []).join('\n'));

	$effect(() => {
		const only = libraryKey ? libraryKey.split('\n') : undefined;
		if (!configured) return;
		let cancelled = false;
		loadError = null;
		recent = null;
		fetchSections(only)
			.then(async (found) => {
				if (cancelled) return;
				sections = found;
				const added = await fetchRecentlyAdded(found);
				if (!cancelled) recent = added;
			})
			.catch((failure: Error) => {
				if (!cancelled) loadError = failure.message;
			});
		return () => {
			cancelled = true;
		};
	});

	// searches once typing pauses; a newer query discards an older answer
	$effect(() => {
		const text = query.trim();
		if (!text || !sections.length) {
			results = null;
			searching = false;
			return;
		}
		searching = true;
		let cancelled = false;
		const timer = setTimeout(() => {
			searchPlex(text, sections)
				.then((found) => {
					if (!cancelled) results = found;
				})
				.catch(() => {
					if (!cancelled) results = [];
				})
				.finally(() => {
					if (!cancelled) searching = false;
				});
		}, SEARCH_DELAY_MS);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	});

	function open(item: PlexItem) {
		plexBrowser.set({ card, start: { kind: 'item', item } });
	}

	function browse(section: PlexSection) {
		plexBrowser.set({ card, start: { kind: 'library', section } });
	}

	let shown = $derived(query.trim() ? results : recent);
</script>

<div class="card">
	<div class="header">
		<Icon name="movie" size={ICON.tile} color="var(--h-accent-icon)" />
		<div class="title">{card.title || $lang('hearth_card_plex_name')}</div>
	</div>

	{#if !configured}
		<div class="note">{$lang('hearth_plex_not_set_up')}</div>
	{:else if loadError}
		<div class="note error">{$lang('hearth_plex_unreachable')}: {loadError}</div>
	{:else}
		<label class="search">
			<Icon name="search" size={ICON.control} color="var(--h-icon)" />
			<input
				type="search"
				bind:value={query}
				placeholder={$lang('hearth_plex_search_placeholder')}
				aria-label={$lang('hearth_plex_search_placeholder')}
				spellcheck="false"
				autocomplete="off"
			/>
		</label>

		<div class="row-label">
			{query.trim() ? $lang('hearth_plex_results') : $lang('hearth_plex_recently_added')}
		</div>
		{#if shown === null || (searching && !results)}
			<div class="note">{$lang('hearth_loading')}</div>
		{:else if !shown.length}
			<div class="note">{$lang('hearth_plex_nothing_found')}</div>
		{:else}
			<div class="posters">
				{#each shown as item (item.ratingKey)}
					<div class="slot"><Poster {item} onselect={open} /></div>
				{/each}
			</div>
		{/if}

		{#if sections.length}
			<div class="libraries">
				{#each sections as section (section.key)}
					<button type="button" class="library pressable" onclick={() => browse(section)}>
						<Icon name={section.type === 'movie' ? 'movie' : 'tv'} size={ICON.inline} />
						<span>{section.title}</span>
					</button>
				{/each}
			</div>
		{/if}
	{/if}
</div>

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

	.search {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 14px;
		border-radius: var(--h-radius-sm);
		background: var(--h-inset);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.08 * var(--h-line-scale)));
	}

	.search:focus-within {
		border-color: rgb(var(--h-accent-rgb) / calc(0.4 * var(--h-accent-scale)));
	}

	.search input {
		flex: 1;
		min-width: 0;
		border: 0;
		background: none;
		outline: none;
		color: var(--h-text-2);
		font: inherit;
		font-size: var(--h-type-body);
	}

	.row-label {
		font-family: var(--h-font-mono);
		font-size: var(--h-type-label);
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--h-label);
	}

	/* one scrolling row, so the card keeps its height while results change */
	.posters {
		display: flex;
		gap: 12px;
		overflow-x: auto;
		overscroll-behavior-x: contain;
		scrollbar-width: none;
	}

	.slot {
		flex: none;
		width: 104px;
	}

	.libraries {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.library {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px;
		border-radius: var(--h-radius-pill);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.1 * var(--h-line-scale)));
		background: none;
		color: var(--h-text-3);
		font: inherit;
		font-size: var(--h-type-secondary);
		cursor: pointer;
	}

	.note {
		font-size: var(--h-type-secondary);
		color: var(--h-text-5);
	}

	.note.error {
		color: var(--h-bad-text);
	}
</style>
