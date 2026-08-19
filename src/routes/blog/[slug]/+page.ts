export async function load({ params }) {
    const post = await import(`/src/lib/blog/${params.slug}.md`)
    const { title, date } = post.metadata;
    const content = post.default;

    return {
        content, title, date
    }
}
