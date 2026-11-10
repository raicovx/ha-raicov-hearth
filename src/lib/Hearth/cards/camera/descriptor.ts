import type { CardDescriptor } from '../types';
import { cameraCard as definition, type CameraCard } from '../../model/cards/camera';
export type { CameraCard } from '../../model/cards/camera';

export const cameraCard: CardDescriptor<CameraCard> = {
	...definition,
	load: () => import('./Card.svelte'),
	editor: () => import('./Editor.svelte')
};
