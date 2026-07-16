import type { Component } from 'svelte';
import Counter from './Counter.svelte';

// Components that can be embedded in devlog markdown via
// <div data-embed="Name"></div>. Add new entries here as they're built.
export const embedRegistry: Record<string, Component> = {
	Counter
};
