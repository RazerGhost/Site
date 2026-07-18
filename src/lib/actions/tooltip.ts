let idCounter = 0;

export function tooltip(node: HTMLElement, text: string) {
	let label = text;
	let el: HTMLDivElement | null = null;

	function position() {
		if (!el) return;
		const trigger = node.getBoundingClientRect();
		const tip = el.getBoundingClientRect();
		const left = Math.max(8, Math.min(trigger.left + trigger.width / 2 - tip.width / 2, window.innerWidth - tip.width - 8));
		// Prefer above the trigger; flip below if there isn't room (e.g. a nav bar near the top of the screen).
		const top = trigger.top - tip.height - 8 < 8 ? trigger.bottom + 8 : trigger.top - tip.height - 8;
		el.style.left = `${left}px`;
		el.style.top = `${top}px`;
	}

	function hide() {
		el?.remove();
		el = null;
		node.removeAttribute('aria-describedby');
		document.removeEventListener('pointerdown', hide, true);
	}

	function show() {
		if (!label) return;
		const id = `tooltip-${++idCounter}`;
		el = document.createElement('div');
		el.id = id;
		el.setAttribute('role', 'tooltip');
		el.textContent = label;
		el.className =
			'pointer-events-none fixed z-50 w-64 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-white shadow-[var(--shadow-card-hover)]';
		document.body.appendChild(el);
		node.setAttribute('aria-describedby', id);
		position();
		// Dragging (e.g. panning the canvas) can suppress the mouseleave this
		// button would otherwise get once the pointer moves off it — browsers
		// pause hover-transition events for other elements while a mouse
		// button is held down. Dismiss on the earliest reliable signal that a
		// drag has started instead of waiting on mouseleave.
		document.addEventListener('pointerdown', hide, true);
	}

	node.addEventListener('mouseenter', show);
	node.addEventListener('mouseleave', hide);
	node.addEventListener('focus', show);
	node.addEventListener('blur', hide);
	node.addEventListener('click', hide);

	return {
		update(newText: string) {
			label = newText;
		},
		destroy() {
			node.removeEventListener('mouseenter', show);
			node.removeEventListener('mouseleave', hide);
			node.removeEventListener('focus', show);
			node.removeEventListener('blur', hide);
			node.removeEventListener('click', hide);
			hide();
		}
	};
}
