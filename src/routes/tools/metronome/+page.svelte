<script lang="ts">
    import { onMount } from "svelte";

    // Loading samples based on Web Audio API docs instead of using <audio> elements
    const METRONOME_HIGH_CLICK_FILE_PATH = "/metronome_click_F4.wav";
    const METRONOME_LOW_CLICK_FILE_PATH = "/metronome_click_F3.wav";
    let metronomeHighClick: AudioBuffer;
    let metronomeLowClick: AudioBuffer;

    // Arbitrary tempo bounds
    const minTempo = 20;
    const maxTempo = 180;
    const maxSubdivision = 4;
    const maxBeatsPerMeasure = 8;
    const baseTempo = 60;

    // Web Audio API scheduler variables
    const lookahead = 25.0;

    // Audio context must be regenerated on refresh, so it can't be initialized here
    let audioContext: AudioContext;

    // Metronome state
    let tempo = $state(baseTempo);
    let isPlaying = $state(false);
    let timerID: number;
    let nextNoteTime = 0.0;

    // As tempo gets faster, longer schedule-ahead times begin to feel sluggish; adjust dynamically
    let scheduleAheadTime = $derived(
        0.1 - 0.0013 * Math.max(0, tempo - baseTempo),
    );

    // Subdivided beat is just the total number of clicks
    let currentSubdividedBeatInMeasure = $state(-1);
    let numBeatsPerMeasure = $state(4);

    let subdivision = $state(1);
    let subdividedTempo = $derived(tempo * subdivision);
    let subdividedBeatsPerMeasure = $derived(numBeatsPerMeasure * subdivision);

    let subdividedBeatMarkers = $derived(
        Array(subdividedBeatsPerMeasure)
            .fill(false)
            .map((_, i) => i === currentSubdividedBeatInMeasure),
    );

    function scheduler() {
        while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
            scheduleNote(nextNoteTime);
            nextNote();
        }

        timerID = setTimeout(scheduler, lookahead);
    }

    function playSample(audioBuffer: AudioBuffer, time: number) {
        const sampleSource = new AudioBufferSourceNode(audioContext, {
            buffer: audioBuffer,
            // playbackRate,
        });
        sampleSource.connect(audioContext.destination);
        sampleSource.start(time);
        return sampleSource;
    }

    function scheduleNote(time: number) {
        playSample(metronomeHighClick, time);

        currentSubdividedBeatInMeasure =
            (currentSubdividedBeatInMeasure + 1) % subdividedBeatsPerMeasure;
    }

    function nextNote() {
        const secondsPerSubdividedBeat = 60.0 / subdividedTempo;

        nextNoteTime += secondsPerSubdividedBeat;
    }

    function togglePlaying() {
        isPlaying = !isPlaying;
        if (isPlaying) {
            if (audioContext.state === "suspended") {
                audioContext.resume();
            }

            nextNoteTime = audioContext.currentTime;

            scheduler();
        } else {
            clearTimeout(timerID);
            currentSubdividedBeatInMeasure = -1;
        }
    }

    onMount(async () => {
        audioContext = new AudioContext();

        async function getFile(filepath: string) {
            const response = await fetch(filepath);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            return audioBuffer;
        }

        metronomeHighClick = await getFile(METRONOME_HIGH_CLICK_FILE_PATH);
        metronomeLowClick = await getFile(METRONOME_LOW_CLICK_FILE_PATH);
    });
</script>

<p><img src="" alt="quarter note equals" /> {tempo} <strong>BPM</strong></p>

<input type="range" min={minTempo} max={maxTempo} bind:value={tempo} />

<label for="subdivision">Subdivision</label>
<input
    name="subdivision"
    type="number"
    min={1}
    max={maxSubdivision}
    bind:value={subdivision}
/>

<label for="numBeatsPerMeasure">Beats Per Measure</label>
<input
    name="numBeatsPerMeasure"
    type="number"
    min={1}
    max={maxBeatsPerMeasure}
    bind:value={numBeatsPerMeasure}
/>

<button onclick={togglePlaying}>
    Play/Pause
    <!-- <img src="l" width="50" height="50" alt="the play button" /> -->
</button>

<div class="beat-visualization">
    <svg width="600">
        {#each subdividedBeatMarkers as marker, i}
            <circle
                r={marker ? 8 : 3}
                cx={(50 - subdividedBeatsPerMeasure) * (i + 1)}
                cy="100"
            ></circle>
        {/each}
    </svg>
</div>
