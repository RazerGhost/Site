import type { Component } from 'svelte';
import Counter from './Counter.svelte';
import Terminal from './Terminal.svelte';
import TerminalReplay from './TerminalReplay.svelte';
import BeforeAfter from './BeforeAfter.svelte';
import Callout from './Callout.svelte';
import CodeDiff from './CodeDiff.svelte';
import Mermaid from './Mermaid.svelte';

// Components that can be embedded in devlog markdown via
// <div data-embed="Name"></div>. Add new entries here as they're built.
export const embedRegistry: Record<string, Component> = {
	Counter,
	Terminal,
	TerminalReplay,
	BeforeAfter,
	Callout,
	CodeDiff,
	Mermaid
};
