<script lang="ts">
    import { onMount } from "svelte";

    // Loading samples based on Web Audio API docs instead of using <audio> elements
    const METRONOME_HIGH_CLICK_FILE_PATH = "/metronome_click_F4.wav";
    const METRONOME_LOW_CLICK_FILE_PATH = "/metronome_click_F3.wav";
    let metronomeHighClick: AudioBuffer;
    let metronomeLowClick: AudioBuffer;

    // Arbitrary tempo bounds
    const minTempo = 20;
    const maxTempo = 300;

    // Web Audio API scheduler variables
    const audioContext = new AudioContext();
    const noteQueue = [];
    const lookahead = 25.0;
    const scheduleAheadTime = 0.1;
    let nextNoteTime = 0.0;

    // Metronome state
    let tempo = $state(60);
    let isPlaying = $state(false);
    let timerID: number;

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
        noteQueue.push(time);

        playSample(metronomeHighClick, time);
    }

    function nextNote() {
        const secondsPerBeat = 60.0 / tempo;

        nextNoteTime += secondsPerBeat;
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
        }
    }

    onMount(async () => {
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

<p>{tempo}</p>

<input type="range" min={minTempo} max={maxTempo} bind:value={tempo} />

<button onclick={togglePlaying}>
    Play/Pause
    <!-- <img src="l" width="50" height="50" alt="the play button" /> -->
</button>
