export async function load() {
    let a = 4;
    const allPostFiles = import.meta.glob(`/src/routes/blog/*.md`);
    const iterablePostFiles = Object.entries(allPostFiles);

    const allPosts = await Promise.all(
        iterablePostFiles.map(async ([path, resolver]) => {
            // How to type this?? Using 'any' to suppress the Promise<unknown>
            const { metadata } = await resolver() as any;
            const postPath = path.slice(11, -3);

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