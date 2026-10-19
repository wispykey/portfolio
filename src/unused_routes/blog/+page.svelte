<script>
    let { data } = $props();
</script>

<h1>Blog</h1>

<nav>
    <ul>
        {#each data.posts as post}
            <li>
                <article>
                    <time datetime="">{post.meta.created}</time>
                    <h2><a href={post.path}>{post.meta.title}</a></h2>
                    <p>{post.meta.description}</p>
                </article>
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

    article {
        display: flex;
        flex-direction: column;
        margin-bottom: 2rem;
        transition: 0.1s all;
    }

    article:hover {
        padding-left: 12px;
    }

    a {
        text-decoration: none;
        color: black;
    }

    p {
        margin-top: 0;
    }
</style>
