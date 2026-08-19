export async function load() {
    let a = 4;
    const allPostFiles = import.meta.glob(`/src/lib/blog/*.md`);
    const iterablePostFiles = Object.entries(allPostFiles);

    const allPosts = await Promise.all(
        iterablePostFiles.map(async ([path, resolver]) => {
            // How to type this?? Using 'any' to suppress the Promise<unknown>
            const { metadata } = await resolver() as any;
            // This match guarantee depends on the glob being correct
            const fileNameMatch = path.match(/\/[^/]*$/)!;
            const slugName = fileNameMatch[0].slice(0, -3);
            const postPath = `/blog${slugName}`;

            return {
                meta: metadata,
                path: postPath
            };
        })
    );

    return {
        posts:
            allPosts
    };
};