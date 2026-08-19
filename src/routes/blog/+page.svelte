<script lang="ts">
    let { data } = $props();

    $effect(() => {
        $inspect(data);
    });
</script>

<p>
    Here is where I put blog posts. They could be about anything, but will
    typically be about the things I put on this site.
</p>

<ul>
    {#each data.summaries as summary}
        <li>
            <a href={summary.slug}>{summary.title}</a>
        </li>
    {/each}
</ul>
