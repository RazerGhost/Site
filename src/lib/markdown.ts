import { Marked } from 'marked';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import python from 'highlight.js/lib/languages/python';
import yaml from 'highlight.js/lib/languages/yaml';
import sql from 'highlight.js/lib/languages/sql';
import markdownLang from 'highlight.js/lib/languages/markdown';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import diff from 'highlight.js/lib/languages/diff';

// A hand-picked subset (not the full ~190-language bundle) — keeps this out
// of the client bundle's weight while covering what's actually likely to
// show up in a personal note.
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('svelte', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('markdown', markdownLang);
hljs.registerLanguage('md', markdownLang);
hljs.registerLanguage('dockerfile', dockerfile);
hljs.registerLanguage('diff', diff);

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function highlight(text: string, lang?: string): { html: string; language?: string } {
	try {
		const known = lang && hljs.getLanguage(lang) ? lang : undefined;
		if (known) return { html: hljs.highlight(text, { language: known }).value, language: known };
		const auto = hljs.highlightAuto(text);
		return { html: auto.value, language: auto.language };
	} catch {
		return { html: escapeHtml(text) };
	}
}

// Own Marked instance rather than mutating the shared/default one — devlog
// and projects have their own marked-based rendering pipeline (footnotes,
// heading anchors) and shouldn't be affected by this renderer.
export const richMarked = new Marked({
	gfm: true,
	renderer: {
		code({ text, lang }) {
			const language = lang?.trim().split(/\s+/)[0];
			const { html, language: detected } = highlight(text, language);
			const cls = detected ? ` language-${detected}` : '';
			return `<pre><code class="hljs${cls}">${html}</code></pre>`;
		}
	}
});

// GFM task-list items render as a plain <li><input type=checkbox> …</li> —
// this tags the <li> so CSS can drop its bullet and align the checkbox,
// instead of showing a bullet and a checkbox side by side.
export function markTaskListItems(html: string): string {
	return html.replace(/<li>(\s*<input[^>]*type="checkbox"[^>]*>)/g, '<li class="task-list-item">$1');
}
