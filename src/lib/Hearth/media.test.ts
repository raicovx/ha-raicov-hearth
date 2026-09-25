import { describe, expect, it } from 'vitest';
import { recentTracksFrom, spotifyDevicesFrom } from './media';

const album = { type: 'album', uri: 'spotify:album:a' };

describe('recentTracksFrom', () => {
	it('lists each track once, newest play first', () => {
		const tracks = recentTracksFrom({
			items: [
				{ played_at: '2026-09-25T10:00:00Z', track: { name: 'Old', uri: 'spotify:track:1' } },
				{ played_at: '2026-09-25T12:00:00Z', track: { name: 'New', uri: 'spotify:track:2' } },
				{ played_at: '2026-09-25T11:00:00Z', track: { name: 'Old', uri: 'spotify:track:1' } }
			]
		});
		expect(tracks?.map((track) => [track.name, track.playedAt])).toEqual([
			['New', '2026-09-25T12:00:00Z'],
			['Old', '2026-09-25T11:00:00Z']
		]);
	});

	it('keeps album and playlist contexts to resume from, but not artists', () => {
		const [fromAlbum, fromArtist] = recentTracksFrom({
			items: [
				{
					played_at: '2026-09-25T12:00:00Z',
					context: album,
					track: {
						name: 'So What',
						uri: 'spotify:track:1',
						artists: [{ name: 'Miles Davis' }, { name: 'John Coltrane' }],
						album: { images: [{ url: 'https://i/1.jpg' }] }
					}
				},
				{
					played_at: '2026-09-25T11:00:00Z',
					context: { type: 'artist', uri: 'spotify:artist:x' },
					track: { name: 'Blue', uri: 'spotify:track:2', image_url: 'https://i/2.jpg' }
				}
			]
		})!;
		expect(fromAlbum).toMatchObject({
			artist: 'Miles Davis, John Coltrane',
			image: 'https://i/1.jpg',
			contextUri: 'spotify:album:a'
		});
		expect(fromArtist).toMatchObject({ artist: '', image: 'https://i/2.jpg', contextUri: null });
	});

	it('skips entries without a track and answers null for a shapeless result', () => {
		expect(recentTracksFrom({ items: [{ played_at: 'x' }, { track: {} }] })).toEqual([]);
		expect(recentTracksFrom(null)).toBeNull();
		expect(recentTracksFrom({ items: 'nope' })).toBeNull();
	});
});

describe('spotifyDevicesFrom', () => {
	const items = [
		{ Id: 'a', Name: 'Kitchen', DiscoveryResult: { DeviceType: 'Speaker' } },
		{ Id: 'b', Name: 'Laptop', IsActiveDevice: true, DeviceInfo: { DeviceType: 'Computer' } },
		{ Id: 'c', Name: 'Gone', DeviceInfo: { IsAvailable: false } },
		{ Name: 'No id' }
	];

	it('lists the available devices, the active one first', () => {
		expect(spotifyDevicesFrom({ Items: items })).toEqual([
			{ id: 'b', name: 'Laptop', kind: 'Computer', active: true },
			{ id: 'a', name: 'Kitchen', kind: 'Speaker', active: false }
		]);
	});

	it("trusts the entity's active device over the list's flag", () => {
		expect(spotifyDevicesFrom({ Items: items }, 'a')?.map((device) => device.active)).toEqual([
			true,
			false
		]);
	});

	it('answers null for a shapeless result', () => {
		expect(spotifyDevicesFrom(null)).toBeNull();
		expect(spotifyDevicesFrom({ Items: {} })).toBeNull();
	});
});
