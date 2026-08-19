<script lang="ts">
    let { data } = $props();
</script>

<article>
    <h1>{data.title}</h1>
    <p>Published: {data.date}</p>
    {@render data.content()}
</article>
