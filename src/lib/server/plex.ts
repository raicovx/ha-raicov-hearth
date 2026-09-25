import { readFile } from 'fs/promises';
import * as yaml from 'js-yaml';

/*
 * The Plex server Hearth talks to on the browser's behalf. The URL and token
 * live in data/configuration.yaml. The page load strips the token, so the
 * browser reaches Plex only through the _api/plex routes, which add it here.
 * That also spares the browser Plex's CORS, mixed-content and certificate
 * rules: only this server has to reach the Plex URL.
 */

export interface PlexSettings {
	url: string;
	token: string;
}

const CONFIGURATION_FILE = './data/configuration.yaml';
const CLIENT_IDENTIFIER = 'hearth-dashboard';
const TIMEOUT_MS = 10_000;

export async function readPlexSettings(): Promise<PlexSettings | null> {
	let loaded: unknown;
	try {
		loaded = yaml.load(await readFile(CONFIGURATION_FILE, 'utf8'));
	} catch {
		return null;
	}
	if (!loaded || typeof loaded !== 'object') return null;
	const { plex_url: url, plex_token: token } = loaded as Record<string, unknown>;
	if (typeof url !== 'string' || !url || typeof token !== 'string' || !token) return null;
	return { url: url.replace(/\/+$/, ''), token };
}

/** Calls the Plex server with the token and a JSON answer asked for. */
export async function plexFetch(
	settings: PlexSettings,
	path: string,
	init: { method?: string; headers?: Record<string, string>; accept?: string } = {}
): Promise<Response> {
	const url = new URL(`${settings.url}${path.startsWith('/') ? path : `/${path}`}`);
	return fetch(url, {
		method: init.method ?? 'GET',
		headers: {
			Accept: init.accept ?? 'application/json',
			'X-Plex-Token': settings.token,
			'X-Plex-Client-Identifier': CLIENT_IDENTIFIER,
			'X-Plex-Product': 'Hearth',
			...init.headers
		},
		signal: AbortSignal.timeout(TIMEOUT_MS)
	});
}

export async function plexJson<T = any>(
	settings: PlexSettings,
	path: string,
	method = 'GET'
): Promise<T> {
	const response = await plexFetch(settings, path, { method });
	if (!response.ok) throw new Error(`Plex answered ${response.status} for ${path}`);
	return (await response.json()) as T;
}

export { CLIENT_IDENTIFIER as PLEX_CLIENT_IDENTIFIER };
