<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { TempoMarkings } from "./tempo-markings";

    // Loading samples based on Web Audio API docs instead of using <audio> elements
    const METRONOME_HIGH_CLICK_FILE_PATH = "/metronome_click_F4.wav";
    const METRONOME_LOW_CLICK_FILE_PATH = "/metronome_click_F3.wav";
    let metronomeHighClick: AudioBuffer;
    let metronomeLowClick: AudioBuffer;

    // Arbitrary tempo bounds
    const minTempo = 20;
    const maxTempo = 180;
    const MIN_SUBDIVISION = 1;
    const MAX_SUBDIVISION = 4;
    const MIN_BEATS_PER_MEASURE = 1;
    const MAX_BEATS_PER_MEASURE = 8;
    const baseBpm = 60;

    // Web Audio API scheduler variables
    const lookahead = 25.0;

    // Audio context must be regenerated on refresh, so it can't be initialized here
    let audioContext: AudioContext;

    // Metronome state
    let bpm = $state(baseBpm);
    let isPlaying = $state(false);
    let timerID: number;
    let nextNoteTime = 0.0;

    // As tempo gets faster, longer schedule-ahead times begin to feel sluggish; adjust dynamically
    let scheduleAheadTime = $derived(0.1 - 0.0013 * Math.max(0, bpm - baseBpm));

    let tempoMarking = $derived(
        Object.keys(TempoMarkings).findLast(
            (tempoMarking) => bpm >= TempoMarkings[tempoMarking],
        ),
    );

    // Subdivided beat is just the total number of clicks
    let currentSubdividedBeatInMeasure = $state(-1);
    let numBeatsPerMeasure = $state(4);

    let subdivision = $state(1);
    let subdividedTempo = $derived(bpm * subdivision);
    let subdividedBeatsPerMeasure = $derived(numBeatsPerMeasure * subdivision);

    function scheduler() {
        while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
            scheduleNote(nextNoteTime);
            nextNote();
        }

        timerID = setTimeout(scheduler, lookahead);
    }

    function playSample(time: number) {
        const sampleSource = new AudioBufferSourceNode(audioContext, {
            buffer:
                currentSubdividedBeatInMeasure === 0
                    ? metronomeHighClick
                    : metronomeLowClick,
            // playbackRate,
        });
        sampleSource.connect(audioContext.destination);
        sampleSource.start(time);
        return sampleSource;
    }

    function scheduleNote(time: number) {
        currentSubdividedBeatInMeasure =
            (currentSubdividedBeatInMeasure + 1) % subdividedBeatsPerMeasure;

        playSample(time);
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

    onDestroy(() => {
        clearTimeout(timerID);
    });

    $effect(() => {});
</script>

<div class="container">
    <div class="metronome">
        <div class="visualization">
            {#each { length: numBeatsPerMeasure }, i}
                <div class="bar">
                    <div
                        class="beat-bar {i ===
                        Math.floor(currentSubdividedBeatInMeasure / subdivision)
                            ? 'current-beat'
                            : ''}"
                    ></div>
                    <div class="bar-subdivisions">
                        {#each { length: subdivision }}
                            <div class="bar-subdivision-dot"></div>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
        <section class="bpm-display">
            <h2><strong>{bpm}</strong></h2>
            <h3>{tempoMarking}</h3>
        </section>

        <input
            class="bpm"
            type="range"
            min={minTempo}
            max={maxTempo}
            bind:value={bpm}
        />
    </div>
    <div class="settings">
        <form action="">
            <section>
                Beats
                <div class="buttons">
                    {#each { length: MAX_BEATS_PER_MEASURE - MIN_BEATS_PER_MEASURE + 1 }, i}
                        <label>
                            <input
                                type="radio"
                                name="beats"
                                value={i + 1}
                                bind:group={numBeatsPerMeasure}
                            />
                            <span>{i + 1}</span>
                        </label>
                    {/each}
                </div>
            </section>
            <section>
                Subdivision
                <div class="buttons">
                    {#each { length: MAX_SUBDIVISION - MIN_SUBDIVISION + 1 }, i}
                        <label>
                            <input
                                type="radio"
                                name="subdivision"
                                value={i + 1}
                                bind:group={subdivision}
                            />
                            <span>{i + 1}</span>
                        </label>
                    {/each}
                </div>
            </section>
        </form>

        <button aria-label="play-button" onclick={togglePlaying}>
            <svg width="100" height="100">
                <circle
                    r="40"
                    stroke="black"
                    stroke-width="2"
                    fill="black"
                    cx="52"
                    cy="52"
                ></circle>
                <circle r="40" fill="green" cx="50" cy="50"></circle>
                <circle
                    r="40"
                    stroke="black"
                    stroke-width="2"
                    fill="none"
                    cx="50"
                    cy="50"
                ></circle>

                {#if !isPlaying}
                    <path
                        d="M 43 35 v 30 l 20 -15 Z"
                        fill="black"
                        stroke="black"
                        stroke-width="2"
                    />
                {:else}
                    <path d="M 43 40 v 20 h 4 v -20 Z" fill="black"></path>
                    <path d="M 57 40 v 20 h -4 v -20 Z" fill="black"></path>
                {/if}
            </svg>
        </button>
    </div>
</div>

<style>
    .container {
        margin-top: 50px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .metronome {
        text-align: center;
        min-width: 500px;
    }
    .settings {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .bpm-display {
        text-align: center;
    }
    form {
        display: flex;
        flex-direction: column;
        padding: 16px;
        gap: 1rem;
    }

    .buttons {
        display: flex;
        gap: 0.5rem;
    }

    input.bpm {
        width: 300px;
    }

    input[type="radio"] {
        display: none;
    }

    input[type="radio"] + span {
        padding: 8px 16px;
        border-radius: 4px;
        background-color: #364153;
        color: white;
    }

    input[type="radio"]:checked + span {
        background-color: rgb(197, 88, 45);
    }

    form label {
        display: flex;
        gap: 1rem;
    }

    h2 {
        margin-bottom: 0;
        padding: 0;
        font-size: 60px;
    }

    circle {
        transition: r 0.2s ease-out;
    }

    button {
        background: none;
        border: none;
    }

    .visualization {
        display: flex;
        justify-content: space-between;
        margin-bottom: 24px;
        gap: 8px;
    }

    .bar {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .beat-bar {
        background: rgb(70, 57, 131);
        width: 100%;
        height: 30vh;
        border-radius: 8px;
        transition: background 0.1s;
    }

    .current-beat {
        background: rgb(159, 141, 187);
    }

    .bar-subdivision-dot {
        width: 4px;
        height: 4px;
        background-color: grey;
        border-radius: 999px;
    }

    .bar-subdivisions {
        display: flex;
        gap: 2px;
        justify-content: center;
    }
</style>
