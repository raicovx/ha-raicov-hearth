import { describe, expect, it } from 'vitest';
import { plexContent, posterOf, type PlexItem } from './plex';

describe('plexContent', () => {
	it('names a movie by library and title for the Home Assistant Plex integration', () => {
		const movie: PlexItem = {
			ratingKey: '1',
			type: 'movie',
			title: 'Up',
			librarySectionTitle: 'Movies'
		};
		const content = plexContent(movie, 'Basement');
		expect(content?.media_content_type).toBe('movie');
		expect(JSON.parse(content!.media_content_id.replace('plex://', ''))).toEqual({
			library_name: 'Movies',
			title: 'Up',
			plex_server: 'Basement'
		});
	});

	it('names an episode by show, season and number, and leaves shows to be opened', () => {
		const episode: PlexItem = {
			ratingKey: '2',
			type: 'episode',
			title: 'Pilot',
			librarySectionTitle: 'TV',
			grandparentTitle: 'Bluey',
			parentIndex: 1,
			index: 3
		};
		expect(JSON.parse(plexContent(episode)!.media_content_id.slice('plex://'.length))).toEqual({
			library_name: 'TV',
			show_name: 'Bluey',
			season_number: 1,
			episode_number: 3
		});
		expect(plexContent({ ratingKey: '3', type: 'show', title: 'Bluey' })).toBeNull();
	});

	it("draws an episode with its show's poster", () => {
		expect(
			posterOf({
				ratingKey: '2',
				type: 'episode',
				title: 'Pilot',
				thumb: '/e',
				grandparentThumb: '/s'
			})
		).toBe('/s');
	});
});
