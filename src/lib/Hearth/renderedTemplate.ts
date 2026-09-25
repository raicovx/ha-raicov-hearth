import { derived, type Readable } from 'svelte/store';
import { connected } from '$lib/core/ha/connection';
import { subscribeTemplate } from '$lib/core/ha/history';
import { loadMarkdownRenderer } from './markdown';

export interface RenderedTemplate {
	/** Sanitized HTML of the latest render; empty until the first one arrives. */
	html: string;
	error: string | null;
}

/**
 * Renders a Jinja template through Home Assistant as Markdown. Home Assistant
 * pushes a new render whenever a referenced state changes; the last render is
 * kept while the connection is down.
 */
export function renderedTemplate(template: string | undefined): Readable<RenderedTemplate> {
	let latest: RenderedTemplate = { html: '', error: null };
	return derived(
		connected,
		($connected, set) => {
			if (!template || !$connected) return;
			let unsubscribe: (() => void) | undefined;
			let cancelled = false;
			subscribeTemplate(template, async (result) => {
				const render = await loadMarkdownRenderer();
				if (cancelled) return;
				set((latest = { html: render(result), error: null }));
			})
				.then((stop) => {
					if (cancelled) stop();
					else unsubscribe = stop;
				})
				.catch((failure: { message?: string }) => {
					if (!cancelled)
						set((latest = { ...latest, error: failure?.message ?? 'template_error' }));
				});
			return () => {
				cancelled = true;
				unsubscribe?.();
			};
		},
		latest
	);
}
