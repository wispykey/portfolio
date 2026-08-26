<script lang="ts">
    let { songTitle, trackHref, embedSrc } = $props();
</script>

<div class="soundcloud-embed">
    <iframe
        title={songTitle}
        width="100%"
        height="166"
        scrolling="no"
        frameborder="no"
        allow="autoplay; encrypted-media"
        src={embedSrc}
    ></iframe>
    <div
        style="font-size: 10px; color: #cccccc;line-break: anywhere;word-break: normal;overflow: hidden;white-space: nowrap;text-overflow: ellipsis; font-family: Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif;font-weight: 100;"
    >
        <a
            href="https://soundcloud.com/wispykey"
            title="wispykey"
            target="_blank"
            style="color: #cccccc; text-decoration: none;">wispykey</a
        >
        <a
            href={trackHref}
            title={songTitle}
            target="_blank"
            style="color: #cccccc; text-decoration: none;">{songTitle}</a
        >
    </div>
</div>

<style>
    .soundcloud-embed {
        margin-top: 1rem;
    }
</style>
