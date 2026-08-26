<script lang="ts">
    import SoundCloudEmbed from "./SoundCloudEmbed.svelte";

    let a = 2;

    const tracks: TrackData[] = [
        {
            songTitle: "phoning home",
            trackHref: "https://soundcloud.com/wispykey/phoning-home",
            embedSrc:
                "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2354561732&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true",
        },
        {
            songTitle: "rising upon fallen snow",
            trackHref:
                "https://soundcloud.com/wispykey/rising-behind-fallen-snow",
            embedSrc:
                "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A1699849266&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true",
        },
    ];

    interface TrackData {
        songTitle: string;
        trackHref: string;
        embedSrc: string;
    }
</script>

<h1>Music</h1>

{#each tracks as track}
    <SoundCloudEmbed {...track} />
{/each}
