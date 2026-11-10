import { get } from 'svelte/store';
import { states } from '$lib/core/ha/entities';
import { spotifyPlusCall } from './media';

/*
 * The Spotify Connect device list and play history behind the recently played
 * card. Kept apart from media.ts, which the media popup loads with the
 * dashboard, so this loads with the card.
 */

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
