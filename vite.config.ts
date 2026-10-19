import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { mdsvex } from 'mdsvex';

export default defineConfig({

	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true

			},

			extensions: ['.svelte', '.md'],

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter(),
			preprocess: [
				mdsvex({
					extensions: ['.md'],
				}),
				{
					name: 'mdsvex-script-module-fix',
					markup: ({ content, filename }) => {
						if (!filename?.endsWith('.md')) return;
						return { code: content.replace('<script context="module">', '<script module>') };
					}
				}
			],
			paths: {
				base: '/portfolio',
				relative: false
			}
		})
	]
});
