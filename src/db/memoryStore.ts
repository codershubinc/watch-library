import { MediaItem } from '../models';

declare global {
  var _localStore: MediaItem[] | undefined;
}

export let localStore: MediaItem[] = global._localStore || (global._localStore = []);

export function setLocalStore(newStore: MediaItem[]): void {
  localStore = newStore;
  global._localStore = newStore;
}
