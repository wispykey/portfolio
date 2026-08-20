---
title: "Creating blog posts from markdown using mdsvex"
created: "Weds, Aug 19 2026"
---


Spoiler: I mostly just followed [this post](https://joshcollinsworth.com/blog/build-static-sveltekit-markdown-blog) by Josh Collinsworth.

Since  I am using Svelte 5, I had to express a few things different when using Approach #2 (dynamic routes), just in `+page.ts`:

The original `+page.ts` provided in Josh's tutorial:
```svelte
<script>
	export let data;
</script>

<article>
	<h1>{data.title}</h1>
	<p>Published: {data.date}</p>
	<svelte:component this={data.content} />
</article>
```

Adapted for Svelte 5:
```svelte
<script>
    let { data } = $props();
</script>

<article>
	<h1>{data.title}</h1>
	<p>Published: {data.date}</p>
	{@render data.content()}
</article>
```


Some SvelteKit framework-specific things I stumbled over:
- Creating a folder named `[slug]` (i.e. with square brackets) felt very wrong, but makes sense given the directory-based routing model
- The `load` function in `+page.ts` or `+page.server.ts` must return an object at the top level
- The `data` prop is specially named


### Dynamic import violations in Vite

While I got everything working at first, Vite was not happy.

```
10 |    const post = import(`/src/lib/blog/${params.slug}.md`);
   |                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
The above dynamic import cannot be analyzed by Vite.
See https://vite.dev/guide/features#dynamic-import for supported dynamic import formats. If this is intended to be left as-is, you can use the /* @vite-ignore */ comment inside the import() call to suppress this warning.
```

It seems that dynamic imports have a few rules, and I violated the rule that the specified path must begin with `./` or `../`; I started with an absolute path `/`.

So then I changed my path to start with `../`, fine. It didn't feel great, but I just wanted to see if it worked:


See [docs](https://vite.dev/guide/features#dynamic-import)
- My import is `import(/src/lib/blog/${params.slug}.md` which violates the import needing to start with a relative directory path, i.e. `./` or `../`

