import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { site } from '$lib/config';

const FONT_DIR = path.resolve(process.cwd(), 'src/lib/server/fonts');

const WIDTH = 1200;
const HEIGHT = 630;

// satori's TypeScript signature types its element tree as React's
// `ReactNode`, but this project doesn't depend on react — cast our own
// minimal, structurally-equivalent tree at the call site below rather than
// pull in @types/react just for a type satori never actually needs at runtime.
interface OgNode {
	type: 'div';
	props: {
		style?: Record<string, string | number>;
		children?: OgNode | OgNode[] | string;
	};
}

let fontsCache: { name: string; data: Buffer; weight: 400 | 700; style: 'normal' }[] | null = null;

function loadFonts() {
	if (!fontsCache) {
		fontsCache = [
			{
				name: 'Inter',
				data: fs.readFileSync(path.join(FONT_DIR, 'Inter-Regular.woff')),
				weight: 400,
				style: 'normal'
			},
			{
				name: 'Inter',
				data: fs.readFileSync(path.join(FONT_DIR, 'Inter-Bold.woff')),
				weight: 700,
				style: 'normal'
			}
		];
	}
	return fontsCache;
}

export interface OgImageOptions {
	title: string;
	tags: string[];
	eyebrow?: string;
}

// satori + resvg cost real CPU per render, and crawlers re-fetch og.png
// liberally — cache finished PNGs keyed on the exact inputs, so a changed
// title/tags naturally becomes a new entry. Bounded FIFO: at a few posts
// per site this never evicts in practice, the cap just keeps a scraper
// probing bogus slugs from growing the map unboundedly (404s never render,
// so only real pages land here — the cap is pure belt-and-braces).
const MAX_CACHED_IMAGES = 100;
const imageCache = new Map<string, Buffer>();

export async function renderOgImage(options: OgImageOptions): Promise<Buffer> {
	const key = JSON.stringify(options);
	const cached = imageCache.get(key);
	if (cached) return cached;

	const png = await renderOgImageUncached(options);
	if (imageCache.size >= MAX_CACHED_IMAGES) {
		const oldest = imageCache.keys().next().value;
		if (oldest !== undefined) imageCache.delete(oldest);
	}
	imageCache.set(key, png);
	return png;
}

async function renderOgImageUncached({ title, tags, eyebrow }: OgImageOptions): Promise<Buffer> {
	const tree: OgNode = {
		type: 'div',
		props: {
			style: {
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
				width: `${WIDTH}px`,
				height: `${HEIGHT}px`,
				padding: '64px',
				backgroundColor: '#0a0a0a',
				backgroundImage:
					'radial-gradient(circle at 50% -10%, rgba(34,211,238,0.16), rgba(10,10,10,0) 60%)',
				fontFamily: 'Inter'
			},
			children: [
				{
					type: 'div',
					props: {
						style: { display: 'flex', alignItems: 'center', gap: '12px' },
						children: [
							{
								type: 'div',
								props: {
									style: {
										display: 'flex',
										width: '16px',
										height: '16px',
										borderRadius: '9999px',
										backgroundColor: '#22d3ee'
									}
								}
							},
							{
								type: 'div',
								props: {
									style: {
										display: 'flex',
										fontSize: '28px',
										fontWeight: 700,
										color: '#ffffff',
										letterSpacing: '-1px'
									},
									children: eyebrow ? `RazerGhost · ${eyebrow}` : 'RazerGhost'
								}
							}
						]
					}
				},
				{
					type: 'div',
					props: {
						style: {
							display: 'flex',
							fontSize: title.length > 60 ? '52px' : '64px',
							// 700 is the heaviest face actually loaded (loadFonts above)
							// — asking for more makes satori silently fall back anyway.
							fontWeight: 700,
							color: '#ffffff',
							lineHeight: 1.15,
							letterSpacing: '-1.5px'
						},
						children: title
					}
				},
				{
					type: 'div',
					props: {
						style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
						children: [
							{
								type: 'div',
								props: {
									style: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
									children: tags.slice(0, 4).map((tag) => ({
										type: 'div',
										props: {
											style: {
												display: 'flex',
												fontSize: '22px',
												color: '#22d3ee',
												border: '2px solid rgba(34,211,238,0.4)',
												borderRadius: '9999px',
												padding: '6px 20px'
											},
											children: tag
										}
									}))
								}
							},
							{
								type: 'div',
								props: {
									style: { display: 'flex', fontSize: '22px', color: '#6b6b6b' },
									children: new URL(site.url).host
								}
							}
						]
					}
				}
			]
		}
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see OgNode comment above
	const svg = await satori(tree as any, { width: WIDTH, height: HEIGHT, fonts: loadFonts() });

	const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } });
	return resvg.render().asPng();
}
