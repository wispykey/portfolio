<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import {
        createChordProgression,
        i_bVI_bIII_bVII,
    } from "./chord-progressions";
    import { intepretPitch } from "./pitch-detection";

    let audioContext = new AudioContext();
    let analyser = audioContext.createAnalyser();
    let canvas: HTMLCanvasElement;
    let canvasContext: CanvasRenderingContext2D;

    analyser.minDecibels = -110;
    analyser.maxDecibels = -10;
    analyser.smoothingTimeConstant = 0.85;

    const NO_INPUT = "No input detected";
    let displayedValue = $state(NO_INPUT);
    let detectedValue = $state(NO_INPUT);

    let smoothingFrameThreshold = $state(30);
    let currSustainedFrames = 0;

    let animFrameID = 0;

    const activeOscillators: OscillatorNode[] = [];

    // Frequencies, not chord names
    let chordProgression: number[][] = [];
    const lookahead = 25.0;
    const scheduleAheadTime = 0.15;
    const tempo = 60;
    let isChordsPlaying = $state(false);
    let nextChordTime = 0.0;
    let timerID = -1;
    let currentChordInProgression = 0;

    let gainNode: GainNode;

    navigator.mediaDevices
        .getUserMedia({
            video: false,
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
            },
        })
        .then((stream) => {
            const streamNode = audioContext.createMediaStreamSource(stream);
            streamNode.connect(analyser);
            streamNode.connect(audioContext.destination);
        });

    function updatePitch() {
        const buffer = new Float32Array(analyser.fftSize);
        // This writes in-place
        analyser.getFloatTimeDomainData(buffer);

        // Always update the detected value
        const displayValue = intepretPitch(buffer, audioContext.sampleRate);

        detectedValue = displayValue ?? NO_INPUT;
        // But only update the displayed value when
        if (displayedValue !== detectedValue) {
            if (currSustainedFrames < smoothingFrameThreshold) {
                currSustainedFrames++;
                return;
            } else {
                displayedValue = displayValue ?? NO_INPUT;
                currSustainedFrames = 0;
            }
        }
    }

    function visualize() {
        const buffer = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(buffer);

        canvasContext.clearRect(0, 0, canvas.width, canvas.height);

        canvasContext.fillStyle = "rgb(240, 240, 240)";
        canvasContext.fillRect(0, 0, canvas.width, canvas.height);

        canvasContext.lineWidth = 2;
        canvasContext.strokeStyle = "rgb(0, 0, 0)";
        canvasContext.beginPath();

        const sliceWidth = canvas.width / analyser.frequencyBinCount;

        let x = 0;
        for (let i = 0; i < analyser.frequencyBinCount; i++) {
            const v = buffer[i] / 128.0;
            const y = v * (canvas.height / 2);

            if (i === 0) {
                canvasContext.moveTo(x, y);
            } else {
                canvasContext.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasContext.lineTo(canvas.width, canvas.height / 2);
        canvasContext.stroke();
    }

    function draw() {
        animFrameID = requestAnimationFrame(draw);

        updatePitch();
        visualize();
    }

    function scheduler() {
        while (nextChordTime < audioContext.currentTime + scheduleAheadTime) {
            scheduleChord(nextChordTime);
            nextChord();
        }

        timerID = setTimeout(scheduler, lookahead);
    }

    function nextChord() {
        const secondsPerChord = (60.0 / tempo) * 4;

        nextChordTime += secondsPerChord;
    }

    function startOscillator(
        freq: number = 440.0,
        type: OscillatorType = "sine",
    ) {
        const osc = audioContext.createOscillator();

        // Gain node should be connected to destination already
        osc.connect(gainNode);

        osc.type = type;
        osc.frequency.value = freq;

        osc.start();

        return osc;
    }

    function stopAllOscillators() {
        activeOscillators.map((osc) => {
            osc.stop();
        });
    }

    function createOscillators() {
        stopAllOscillators();

        const osc1 = startOscillator(220.0);
        const osc2 = startOscillator(262.0);
        const osc3 = startOscillator(330.0);

        activeOscillators[0] = osc1;
        activeOscillators[1] = osc2;
        activeOscillators[2] = osc3;
    }

    function scheduleChord(time: number) {
        currentChordInProgression =
            (currentChordInProgression + 1) % chordProgression.length;

        const currentChord = chordProgression[currentChordInProgression];

        activeOscillators[0].frequency.setValueAtTime(currentChord[0], time);
        activeOscillators[1].frequency.setValueAtTime(currentChord[1], time);
        activeOscillators[2].frequency.setValueAtTime(currentChord[2], time);
    }

    function toggleChordsPlaying() {
        isChordsPlaying = !isChordsPlaying;
        if (isChordsPlaying) {
            if (audioContext.state === "suspended") {
                audioContext.resume();
            }

            nextChordTime = audioContext.currentTime;

            createOscillators();
            scheduler();
        } else {
            clearTimeout(timerID);
            stopAllOscillators();
        }
    }

    onMount(() => {
        canvasContext = canvas.getContext("2d")!;

        gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
        gainNode.gain.value = 0.1;

        chordProgression = createChordProgression(i_bVI_bIII_bVII);

        draw();
    });

    onDestroy(() => {
        cancelAnimationFrame(animFrameID);
        audioContext.close();
    });
</script>

<!-- 
The MIT License (MIT) Copyright (c) 2014 Chris Wilson Permission is hereby
granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use, copy, modify,
merge, publish, distribute, sublicense, and/or sell copies of the Software, and
to permit persons to whom the Software is furnished to do so, subject to the
following conditions: The above copyright notice and this permission notice
shall be included in all copies or substantial portions of the Software. THE
SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 

Note:
autoCorrelate comes from https://github.com/cwilso/PitchDetect/pull/23 with the
above license.

Note:
The above note comes from https://alexanderell.is/posts/tuner/tuner.js
 -->

<p>{displayedValue}</p>

<div class="controls">
    <label for="sensitivity"
        >Required duration: {smoothingFrameThreshold} frames</label
    >
    <input
        name="sensitivity"
        type="range"
        min="0"
        max="60"
        bind:value={smoothingFrameThreshold}
    />
    <canvas bind:this={canvas} id="visualization" width="500"> </canvas>
    <button onclick={toggleChordsPlaying} type="button">Play chords</button>
</div>

<style>
    p {
        font-size: 60px;
        text-align: center;
    }

    .controls {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }
</style>
