<script>
    let { data } = $props();
</script>

<h1>Blog</h1>

<p>
    Here is where I put blog posts. They could be about anything, but will
    typically be about the things I put on this site.
</p>

<ul>
    {#each data.posts as post}
        <li>
            <a href={post.path}>{post.meta.title}</a>
        </li>
    {/each}
</ul>
