<svelte:options customElement={{ tag: "my-app", shadow: "none" }} />

<script lang="ts">
    let { data } = $props();
</script>

<article>
    <h1>{data.title}</h1>
    <p>Published: {data.date}</p>
    {@render data.content()}
</article>

<style>
    :root {
        --code-background-color: rgb(36, 36, 36);
    }

    :global(pre[class^="language"]) {
        padding: 1rem;
        background: var(--code-background-color);
    }

    :global(code) {
        background: var(--code-background-color);
        color: rgb(32, 243, 225);
    }
</style>
