import { get } from 'svelte/store';
import { services } from '$lib/core/ha/connection';
import { states } from '$lib/core/ha/entities';
import { callEntityService } from '$lib/core/ha/commands';
import { callServiceForResult } from '$lib/core/ha/history';

export interface QueueTrack {
	name: string;
	artist: string;
	duration: number;
	uri: string;
}

export interface MediaPlaylist {
	name: string;
	uri: string;
	image: string | null;
	trackCount: number | null;
}

/** Whether the entity is backed by the SpotifyPlus integration, which exposes
 * queue and playlist data through response-returning services. */
export function hasSpotifyPlus(attributes: Record<string, unknown>): boolean {
	return typeof attributes.sp_user_id === 'string';
}

/** A SpotifyPlus lookup; the integration answers with a loosely shaped mapping. */
function spotifyPlusCall(name: string, data: Record<string, unknown>): Promise<any> {
	return callServiceForResult('spotifyplus', name, data);
}

export async function fetchMediaQueue(entityId: string): Promise<QueueTrack[] | null> {
	try {
		const result = await spotifyPlusCall('get_player_queue_info', { entity_id: entityId });
		if (!Array.isArray(result?.queue)) return null;

		return result.queue.map((track: any) => ({
			name: String(track?.name ?? ''),
			artist: Array.isArray(track?.artists)
				? track.artists

						.map((artist: any) => artist?.name)
						.filter(Boolean)
						.join(', ')
				: '',
			duration: Math.round((track?.duration_ms ?? 0) / 1000),
			uri: String(track?.uri ?? '')
		}));
	} catch (error) {
		console.error(error);
		return null;
	}
}

export async function fetchMediaPlaylists(entityId: string): Promise<MediaPlaylist[] | null> {
	try {
		const result = await spotifyPlusCall('get_playlist_favorites', {
			entity_id: entityId,
			limit_total: 50
		});
		if (!Array.isArray(result?.items)) return null;

		return result.items.map((playlist: any) => ({
			name: String(playlist?.name ?? ''),
			uri: String(playlist?.uri ?? ''),
			image: playlist?.image_url ?? null,
			trackCount: playlist?.tracks?.total ?? null
		}));
	} catch (error) {
		console.error(error);
		return null;
	}
}

export interface MediaShortcut {
	name: string;
	uri: string;
	image_url?: string;
}

export interface LibraryItem {
	name: string;
	sub: string;
	uri: string;
	image: string | null;
}

export type LibraryKind = 'albums' | 'tracks' | 'artists';

/**
 * The SpotifyPlus entity that pairs with a Spotify media player: itself when
 * it already is one, the same account's twin otherwise, any SpotifyPlus
 * entity as a last resort.
 */
export function spotifyPlusEntityFor(entityId: string): string | undefined {
	const $states = get(states) ?? {};
	if (entityId.startsWith('media_player.spotifyplus_')) return entityId;
	const candidate = `media_player.spotifyplus_${entityId.replace('media_player.spotify_', '')}`;
	if ($states[candidate]) return candidate;
	return Object.keys($states).find((id) => id.startsWith('media_player.spotifyplus_'));
}

export interface SpotifyDevice {
	id: string;
	name: string;
	/** Spotify's device kind, such as Speaker, Computer or TV, when it says */
	kind: string;
	active: boolean;
}

/** One device in a SpotifyPlus device list, as loosely as the integration sends it. */
interface ConnectDeviceEntry {
	Id?: string;
	Name?: string;
	IsActiveDevice?: boolean;
	DeviceInfo?: { IsAvailable?: boolean; DeviceType?: string };
	DiscoveryResult?: { DeviceType?: string };
}

/**
 * The Connect devices that can take playback, the active one first. activeId
 * is the entity's sp_device_id, which is fresher than the list's own flag.
 */
export function spotifyDevicesFrom(result: unknown, activeId?: string): SpotifyDevice[] | null {
	const items = (result as { Items?: unknown } | null)?.Items;
	if (!Array.isArray(items)) return null;
	const devices = (items as (ConnectDeviceEntry | null)[])
		.filter((device) => typeof device?.Id === 'string' && device.Id)
		.filter((device) => device?.DeviceInfo?.IsAvailable !== false)
		.map((device) => ({
			id: device!.Id!,
			name: String(device!.Name ?? device!.Id),
			kind: String(device!.DiscoveryResult?.DeviceType ?? device!.DeviceInfo?.DeviceType ?? ''),
			active: activeId ? device!.Id === activeId : device!.IsActiveDevice === true
		}));
	return devices.sort((a, b) => Number(b.active) - Number(a.active));
}

/** The Spotify Connect devices for a SpotifyPlus entity; null when the lookup failed. */
export async function fetchSpotifyDevices(spEntity: string): Promise<SpotifyDevice[] | null> {
	try {
		const active = get(states)?.[spEntity]?.attributes?.sp_device_id;
		const result = await spotifyPlusCall('get_spotify_connect_devices', { entity_id: spEntity });
		return spotifyDevicesFrom(result, typeof active === 'string' ? active : undefined);
	} catch (error) {
		console.error(error);
		return null;
	}
}

/** The Spotify Connect device to play on: the active one, the preferred name, or the first usable. */
async function resolveSpotifyDevice(
	spEntity: string,
	defaultDevice?: string
): Promise<string | undefined> {
	const active = get(states)?.[spEntity]?.attributes?.sp_device_id;
	if (typeof active === 'string' && active) return active;
	const result = await spotifyPlusCall('get_spotify_connect_devices', { entity_id: spEntity });
	const items: any[] = Array.isArray(result?.Items) ? result.Items : [];
	if (!items.length) return undefined;
	const usable = items.filter(
		(device) => device.DeviceInfo?.IsAvailable !== false && device.IsInDeviceList
	);
	if (defaultDevice) {
		const match =
			usable.find((d) => d.Name === defaultDevice) ?? items.find((d) => d.Name === defaultDevice);
		if (match) return match.Id;
	}
	return usable[0]?.Id ?? items[0]?.Id;
}

/**
 * Starts a Spotify URI on a player: through SpotifyPlus with device
 * resolution when the integration is present, else media_player.play_media.
 */
export async function playSpotifyUri(
	entityId: string,
	uri: string,
	defaultDevice?: string,
	options: {
		/** a track to start the context at, for album and playlist URIs */
		offsetUri?: string;
		/** a Connect device picked by the user, which skips choosing one */
		deviceId?: string;
	} = {}
) {
	const { offsetUri } = options;
	const spEntity = spotifyPlusEntityFor(entityId);
	const isTrack = uri.startsWith('spotify:track:');
	if (spEntity && get(services)?.spotifyplus) {
		const deviceId =
			options.deviceId ??
			(await resolveSpotifyDevice(spEntity, defaultDevice).catch(() => undefined));
		callEntityService(
			'spotifyplus',
			isTrack ? 'player_media_play_tracks' : 'player_media_play_context',
			spEntity,
			{
				...(isTrack ? { uris: uri } : { context_uri: uri }),
				...(!isTrack && offsetUri ? { offset_uri: offsetUri } : {}),
				delay: 0.5,
				...(deviceId ? { device_id: deviceId } : {})
			}
		);
		return;
	}
	callEntityService('media_player', 'play_media', entityId, {
		media_content_id: uri,
		media_content_type: 'spotify'
	});
}

/** The user's saved albums, tracks or followed artists from SpotifyPlus. */
/** null means the request failed; the popup offers a retry rather than a spinner. */
export async function fetchSpotifyLibrary(
	entityId: string,
	kind: LibraryKind
): Promise<LibraryItem[] | null> {
	const service =
		kind === 'albums'
			? 'get_album_favorites'
			: kind === 'tracks'
				? 'get_track_favorites'
				: 'get_artists_followed';
	try {
		const result = await spotifyPlusCall(service, { entity_id: entityId, limit_total: 50 });
		const raw = result?.items;
		const items: any[] = Array.isArray(raw)
			? raw
			: raw && typeof raw === 'object'
				? Object.values(raw)
				: [];
		return items.map((entry) => {
			const item = entry?.album ?? entry?.track ?? entry;
			const artists = Array.isArray(item?.artists)
				? item.artists
						.map((artist: any) => artist?.name)
						.filter(Boolean)
						.join(', ')
				: '';
			return {
				name: String(item?.name ?? ''),
				sub:
					artists || (typeof item?.followers?.total === 'number' ? `${item.followers.total}` : ''),
				uri: String(item?.uri ?? ''),
				image: item?.image_url ?? item?.images?.[0]?.url ?? item?.album?.images?.[0]?.url ?? null
			};
		});
	} catch (error) {
		console.error(error);
		return null;
	}
}

export interface RecentTrack {
	name: string;
	artist: string;
	uri: string;
	image: string | null;
	playedAt: string;
	/** the album or playlist it was played from, which can be resumed at this track */
	contextUri: string | null;
}

/** One play in a SpotifyPlus history page, as loosely as the integration sends it. */
interface PlayHistoryEntry {
	played_at?: string;
	context?: { type?: string; uri?: string } | null;
	track?: {
		name?: string;
		uri?: string;
		image_url?: string;
		artists?: { name?: string }[];
		album?: { image_url?: string; images?: { url?: string }[] };
	};
}

/**
 * The tracks in a SpotifyPlus play history, newest first, each once: a song
 * on repeat would otherwise fill the whole row.
 */
export function recentTracksFrom(result: unknown): RecentTrack[] | null {
	const items = (result as { items?: unknown } | null)?.items;
	if (!Array.isArray(items)) return null;
	const seen = new Set<string>();
	const tracks: RecentTrack[] = [];
	const newestFirst = ([...items] as (PlayHistoryEntry | null)[]).sort((a, b) =>
		String(b?.played_at ?? '').localeCompare(String(a?.played_at ?? ''))
	);
	for (const entry of newestFirst) {
		const track = entry?.track;
		const uri = typeof track?.uri === 'string' ? track.uri : '';
		if (!uri || seen.has(uri)) continue;
		seen.add(uri);
		const contextType = entry?.context?.type;
		tracks.push({
			name: String(track?.name ?? ''),
			artist: Array.isArray(track?.artists)
				? track.artists
						.map((artist) => artist?.name)
						.filter(Boolean)
						.join(', ')
				: '',
			uri,
			image: track?.image_url ?? track?.album?.image_url ?? track?.album?.images?.[0]?.url ?? null,
			playedAt: String(entry?.played_at ?? ''),
			// Spotify cannot start an artist or show context at a given track
			contextUri:
				(contextType === 'album' || contextType === 'playlist') &&
				typeof entry?.context?.uri === 'string'
					? entry.context.uri
					: null
		});
	}
	return tracks;
}

/** The account's recently played tracks from SpotifyPlus; null when the lookup failed. */
export async function fetchRecentTracks(
	entityId: string,
	limit: number
): Promise<RecentTrack[] | null> {
	try {
		const result = await spotifyPlusCall('get_player_recent_tracks', {
			entity_id: entityId,
			limit: 50,
			limit_total: 50
		});
		return recentTracksFrom(result)?.slice(0, limit) ?? null;
	} catch (error) {
		console.error(error);
		return null;
	}
}
