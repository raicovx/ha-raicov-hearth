import { writable } from 'svelte/store';
import { base } from '$app/paths';
import { callEntityService } from '$lib/core/ha/commands';
import type { PlexCard } from './model/cards/plex';

/*
 * The browser side of the Plex card. Every request goes through Hearth's
 * _api/plex proxy, which holds the token and reaches the server; see
 * $lib/server/plex.ts.
 */

export type PlexItemType = 'movie' | 'show' | 'season' | 'episode';

export interface PlexItem {
	ratingKey: string;
	type: PlexItemType;
	title: string;
	year?: number;
	summary?: string;
	thumb?: string;
	parentThumb?: string;
	grandparentThumb?: string;
	librarySectionTitle?: string;
	parentTitle?: string;
	grandparentTitle?: string;
	/** season number of an episode */
	parentIndex?: number;
	/** season or episode number */
	index?: number;
	/** milliseconds */
	duration?: number;
	addedAt?: number;
	leafCount?: number;
	viewedLeafCount?: number;
	viewCount?: number;
}

export interface PlexSection {
	key: string;
	title: string;
	type: 'movie' | 'show';
}

export interface PlexClient {
	name: string;
	machineIdentifier: string;
	product?: string;
}

const PLAYABLE_TYPES = new Set<string>(['movie', 'show', 'season', 'episode']);

type RawItem = Partial<Omit<PlexItem, 'ratingKey'>> & { ratingKey?: string | number };

/** The parts of Plex's MediaContainer answers the card reads. */
interface PlexContainer {
	Metadata?: RawItem[];
	Directory?: { key: string | number; title: string; type: string }[];
	Hub?: PlexContainer[];
	Server?: { name?: string; product?: string; machineIdentifier?: string }[];
	librarySectionTitle?: string;
	totalSize?: number;
	friendlyName?: string;
}

async function plexGet(
	path: string,
	query: Record<string, string | number> = {}
): Promise<PlexContainer> {
	const search = new URLSearchParams(
		Object.entries(query).map(([key, value]) => [key, String(value)])
	);
	const response = await fetch(`${base}/_api/plex/${path}${search.size ? `?${search}` : ''}`);
	if (!response.ok) throw new Error(`Plex request failed (${response.status})`);
	return (await response.json())?.MediaContainer ?? {};
}

function items(container: PlexContainer | undefined): PlexItem[] {
	const metadata = Array.isArray(container?.Metadata) ? container.Metadata : [];
	// listings name the library once on the container; playback needs it per item
	const library = container?.librarySectionTitle;
	return metadata
		.filter((item) => PLAYABLE_TYPES.has(item?.type ?? '') && item.ratingKey)
		.map(
			(item) =>
				({
					...item,
					ratingKey: String(item.ratingKey),
					librarySectionTitle: item.librarySectionTitle ?? library
				}) as PlexItem
		);
}

/** Video libraries, limited to the card's list of titles when it has one. */
export async function fetchSections(only?: string[]): Promise<PlexSection[]> {
	const directories = (await plexGet('library/sections')).Directory ?? [];
	return directories
		.filter((section) => section.type === 'movie' || section.type === 'show')
		.filter((section) => !only?.length || only.includes(section.title))
		.map((section) => ({
			key: String(section.key),
			title: section.title,
			type: section.type as PlexSection['type']
		}));
}

/** The newest additions across the given libraries, newest first. */
export async function fetchRecentlyAdded(sections: PlexSection[], limit = 20): Promise<PlexItem[]> {
	const perSection = await Promise.all(
		sections.map((section) =>
			plexGet(`library/sections/${section.key}/all`, {
				sort: 'addedAt:desc', // copy ok: a Plex sort key
				'X-Plex-Container-Start': 0,
				'X-Plex-Container-Size': limit
			}).then(items)
		)
	);
	return perSection
		.flat()
		.sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0))
		.slice(0, limit);
}

/** One page of a library, by title. */
export async function fetchSectionPage(
	section: PlexSection,
	start: number,
	size = 60
): Promise<{ items: PlexItem[]; total: number }> {
	const container = await plexGet(`library/sections/${section.key}/all`, {
		sort: 'titleSort:asc', // copy ok: a Plex sort key
		'X-Plex-Container-Start': start,
		'X-Plex-Container-Size': size
	});
	const page = items(container);
	return { items: page, total: Number(container.totalSize ?? start + page.length) };
}

/** Plex's own search, kept to movies, shows and episodes in the given libraries. */
export async function searchPlex(query: string, sections: PlexSection[]): Promise<PlexItem[]> {
	const hubs = (await plexGet('hubs/search', { query, limit: 12 })).Hub ?? [];
	const allowed = new Set(sections.map((section) => section.title));
	return hubs
		.flatMap((hub) => items(hub))
		.filter((item) => item.type !== 'season')
		.filter((item) => !item.librarySectionTitle || allowed.has(item.librarySectionTitle));
}

/** A show's seasons or a season's episodes. */
export async function fetchChildren(ratingKey: string): Promise<PlexItem[]> {
	return items(await plexGet(`library/metadata/${ratingKey}/children`));
}

export async function fetchPlexClients(): Promise<PlexClient[]> {
	const servers = (await plexGet('clients')).Server ?? [];
	return servers.flatMap((client) =>
		client.machineIdentifier
			? [
					{
						name: client.name || client.product || client.machineIdentifier,
						machineIdentifier: client.machineIdentifier,
						product: client.product
					}
				]
			: []
	);
}

export async function fetchServerName(): Promise<string | undefined> {
	return (await plexGet('')).friendlyName;
}

/** The art to show for an item: an episode falls back to its show's poster. */
export function posterOf(item: PlexItem): string | undefined {
	return item.type === 'episode'
		? (item.grandparentThumb ?? item.parentThumb ?? item.thumb)
		: (item.thumb ?? item.parentThumb);
}

export function posterUrl(thumb: string | undefined, width: number, height: number) {
	if (!thumb) return undefined;
	const query = new URLSearchParams({
		url: thumb,
		width: String(width),
		height: String(height),
		minSize: '1',
		upscale: '1'
	});
	return `${base}/_api/plex/photo/:/transcode?${query}`;
}

/** Movies and episodes play directly; a show or season is opened instead. */
export function playable(item: PlexItem): boolean {
	return item.type === 'movie' || item.type === 'episode';
}

export async function playOnPlexClient(client: string, item: PlexItem): Promise<void> {
	const response = await fetch(`${base}/_api/plex_play`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ client, key: item.ratingKey })
	});
	if (!response.ok) {
		const body = await response.json().catch(() => null);
		throw new Error(body?.message ?? `Playback failed (${response.status})`);
	}
}

/**
 * The media_content_id Home Assistant's Plex integration resolves for a
 * cast (or other) media player, as the HACS Plex card builds it.
 */
export function plexContent(
	item: PlexItem,
	serverName?: string
): { media_content_type: string; media_content_id: string } | null {
	const server = serverName ? { plex_server: serverName } : {};
	if (item.type === 'movie') {
		return {
			media_content_type: 'movie',
			media_content_id: `plex://${JSON.stringify({ library_name: item.librarySectionTitle, title: item.title, ...server })}`
		};
	}
	if (item.type === 'episode') {
		return {
			media_content_type: 'EPISODE',
			media_content_id: `plex://${JSON.stringify({
				library_name: item.librarySectionTitle,
				show_name: item.grandparentTitle,
				season_number: item.parentIndex,
				episode_number: item.index,
				...server
			})}`
		};
	}
	return null;
}

export function playOnEntity(entityId: string, item: PlexItem, serverName?: string) {
	const content = plexContent(item, serverName);
	if (content) callEntityService('media_player', 'play_media', entityId, content);
}

/** What the Plex browser popup shows; null when it is closed. */
export type PlexBrowser = {
	card: PlexCard;
	start: { kind: 'library'; section: PlexSection } | { kind: 'item'; item: PlexItem };
};

export const plexBrowser = writable<PlexBrowser | null>(null);
