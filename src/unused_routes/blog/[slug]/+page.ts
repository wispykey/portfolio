import { error } from '@sveltejs/kit';

export async function load({ params }) {
    /* 
    We load n entries into the Record, but we only request the file contents of one (lazy loaded)

    Previously tried dynamic import, i.e. `../../../../src/lib/blog/{params.slug}.md`
    but since I want to organize posts separate from code, I couldn't do so without violating the format's one-level-deep rule
    */
    const allPostFiles = import.meta.glob('/src/lib/blog/*.md');

    const postResolver = allPostFiles[`/src/lib/blog/${params.slug}.md`];

    if (!postResolver) {
        error(404, `Could not find ${params.slug}`);
    }

    const postContents = await postResolver() as any;
    const { metadata, default: content } = postContents;

    return {
        content,
        title: metadata.title,
        date: metadata.created
    }
}
