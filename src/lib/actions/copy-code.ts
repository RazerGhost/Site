export function attachCopyButtons(container: HTMLElement): () => void {
	const buttons: HTMLButtonElement[] = [];

	container.querySelectorAll('pre').forEach((pre) => {
		if (pre.querySelector('.copy-code-btn')) return;

		const button = document.createElement('button');
		button.textContent = 'Copy';
		button.className = 'copy-code-btn';
		button.addEventListener('click', async () => {
			const code = pre.querySelector('code')?.textContent ?? '';
			try {
				await navigator.clipboard.writeText(code);
				button.textContent = 'Copied';
			} catch {
				button.textContent = 'Copy failed';
			}
			setTimeout(() => (button.textContent = 'Copy'), 1500);
		});

		pre.style.position = 'relative';
		pre.appendChild(button);
		buttons.push(button);
	});

	return () => {
		buttons.forEach((button) => button.remove());
	};
}
