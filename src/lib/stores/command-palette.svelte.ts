// Shared open/closed state for the Cmd+K command palette — a plain runes
// object rather than a Svelte store, so Nav's trigger button and
// CommandPalette.svelte (siblings under +layout.svelte) can both read and
// write it without prop drilling through the layout.
export const commandPalette = $state({ open: false });
