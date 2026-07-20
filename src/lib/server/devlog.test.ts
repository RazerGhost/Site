import { describe, expect, it } from 'vitest';
import {
	addHeadingAnchors,
	decodeHtmlEntities,
	slugifyHeading,
	applyFootnotes,
	toSearchText
} from './content';

describe('applyFootnotes', () => {
	it('leaves body untouched when there are no footnote definitions', () => {
		const body = 'Just a paragraph with no footnotes.';
		expect(applyFootnotes(body)).toEqual({ body, footnotes: [] });
	});

	it('links a ref to its definition and renders the definition as inline html', () => {
		const body = 'A claim.[^1]\n\n[^1]: The source.';
		const { body: out, footnotes } = applyFootnotes(body);

		expect(out).toContain('<sup id="fnref-1"><a href="#fn-1" class="footnote-ref">1</a></sup>');
		expect(out).not.toContain('[^1]');
		expect(footnotes).toEqual([
			{ refId: 'fnref-1', noteId: 'fn-1', html: expect.stringContaining('The source.') }
		]);
	});

	it('numbers footnotes by order of first appearance in the body, not definition order', () => {
		const body = ['First[^second], then[^first].', '', '[^second]: two', '[^first]: one'].join(
			'\n'
		);
		const { footnotes } = applyFootnotes(body);

		expect(footnotes.map((f) => f.html)).toEqual([
			expect.stringContaining('two'),
			expect.stringContaining('one')
		]);
	});

	it('leaves a ref with no matching definition untouched', () => {
		const body = 'Defined[^known] and undefined[^missing].\n\n[^known]: text';
		const { body: out } = applyFootnotes(body);

		expect(out).toContain('[^missing]');
		expect(out).not.toContain('[^known]');
	});
});

describe('addHeadingAnchors', () => {
	it('assigns a slugified id and records a toc entry', () => {
		const { html, toc } = addHeadingAnchors('<h2>Hello World</h2>');
		expect(html).toBe('<h2 id="hello-world">Hello World</h2>');
		expect(toc).toEqual([{ id: 'hello-world', text: 'Hello World', level: 2 }]);
	});

	it('disambiguates duplicate heading text with a numeric suffix', () => {
		const { toc } = addHeadingAnchors('<h2>Same</h2><h3>Same</h3>');
		expect(toc.map((t) => t.id)).toEqual(['same', 'same-1']);
	});

	it('decodes html entities for the toc label, matching the id derived from decoded text', () => {
		const { toc } = addHeadingAnchors('<h2>--prod doesn&#39;t mean it</h2>');
		expect(toc[0].text).toBe("--prod doesn't mean it");
		expect(toc[0].id).toBe(slugifyHeading("--prod doesn't mean it"));
	});

	it('strips inline markup from the toc label but keeps it in the rendered heading', () => {
		const { html, toc } = addHeadingAnchors('<h2>Using <code>--prod</code></h2>');
		expect(toc[0].text).toBe('Using --prod');
		expect(html).toContain('<code>--prod</code>');
	});
});

describe('decodeHtmlEntities', () => {
	it('decodes all five entities marked escapes', () => {
		expect(decodeHtmlEntities('&amp;&lt;&gt;&quot;&#39;')).toBe(`&<>"'`);
	});
});

describe('slugifyHeading', () => {
	it('falls back to "section" when nothing alphanumeric survives', () => {
		expect(slugifyHeading('!!!')).toBe('section');
	});
});

describe('toSearchText', () => {
	it('strips markdown syntax down to plain lowercased text', () => {
		const body = [
			'# Heading',
			'',
			'A [link](https://example.com) and an ![image](https://example.com/a.png).',
			'',
			'```ts',
			'const shouldBeGone = true;',
			'```',
			'',
			'Inline `code stays` here, plus a note.[^1]',
			'',
			'[^1]: This definition line should be gone.'
		].join('\n');

		const text = toSearchText(body);

		expect(text).not.toMatch(/shouldbegone/);
		expect(text).not.toContain('[^1]');
		expect(text).not.toContain('this definition line should be gone');
		expect(text).not.toContain('](');
		expect(text).toContain('link');
		expect(text).toContain('code stays');
	});
});
