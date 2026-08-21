<script>
    let { data } = $props();
</script>

<h1>Blog</h1>

<p>
    Here is where I put blog posts. They could be about anything, but will
    typically be about the things I put on this site.
</p>

<nav>
    <ul>
        {#each data.posts as post}
            <li>
                <a href={post.path}>{post.meta.title}</a>
            </li>
        {/each}
    </ul>
</nav>

<style>
    ul {
        list-style: none;
        padding: 0;
    }

    nav {
        margin-top: 1rem;
    }
</style>
