<script lang="ts">
    import { onDestroy, onMount } from "svelte";

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
    const chordProgression = [
        [220.0, 262.0, 330.0],
        [233.0, 277.0, 349.0],
    ];
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

    function detectPitch() {
        const buffer = new Float32Array(analyser.fftSize);
        // This writes in-place
        analyser.getFloatTimeDomainData(buffer);

        let pitchDetectionValue = autoCorrelate(
            buffer,
            audioContext.sampleRate,
        );

        let displayValue =
            noteStrings[noteFromPitch(pitchDetectionValue) % 12] ?? NO_INPUT;

        // Always update the detected value
        detectedValue = displayValue;
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

        detectPitch();
        visualize();
    }

    // From PitchDetect: https://github.com/cwilso/PitchDetect/blob/master/js/pitchdetect.js
    var noteStrings = [
        "C",
        "C#",
        "D",
        "D#",
        "E",
        "F",
        "F#",
        "G",
        "G#",
        "A",
        "A#",
        "B",
    ];
    function noteFromPitch(frequency: number) {
        var noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
        return Math.round(noteNum) + 69;
    }

    // From https://github.com/cwilso/PitchDetect/pull/23
    function autoCorrelate(buffer: Float32Array, sampleRate: number) {
        // Perform a quick root-mean-square to see if we have enough signal
        var SIZE = buffer.length;
        var sumOfSquares = 0;

        for (var i = 0; i < SIZE; i++) {
            var val = buffer[i];
            sumOfSquares += val * val;
        }

        var rootMeanSquare = Math.sqrt(sumOfSquares / SIZE);
        if (rootMeanSquare < 0.01) {
            return -1;
        }

        // Find a range in the buffer where the values are below a given threshold.
        var r1 = 0;
        var r2 = SIZE - 1;
        var threshold = 0.2;

        // Walk up for r1
        for (var i = 0; i < SIZE / 2; i++) {
            if (Math.abs(buffer[i]) < threshold) {
                r1 = i;
                break;
            }
        }

        // Walk down for r2
        for (var i = 1; i < SIZE / 2; i++) {
            if (Math.abs(buffer[SIZE - i]) < threshold) {
                r2 = SIZE - i;
                break;
            }
        }

        // Trim the buffer to these ranges and update SIZE.
        buffer = buffer.slice(r1, r2);
        SIZE = buffer.length;

        // Create a new array of the sums of offsets to do the autocorrelation
        var c = new Array(SIZE).fill(0);
        // For each potential offset, calculate the sum of each buffer value times its offset value
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE - i; j++) {
                c[i] = c[i] + buffer[j] * buffer[j + i];
            }
        }

        // Find the last index where that value is greater than the next one (the dip)
        var d = 0;
        while (c[d] > c[d + 1]) {
            d++;
        }

        // Iterate from that index through the end and find the maximum sum
        var maxValue = -1;
        var maxIndex = -1;
        for (var i = d; i < SIZE; i++) {
            if (c[i] > maxValue) {
                maxValue = c[i];
                maxIndex = i;
            }
        }

        var T0 = maxIndex;

        // Not as sure about this part, don't @ me
        // From the original author:
        // interpolation is parabolic interpolation. It helps with precision. We suppose that a parabola pass through the
        // three points that comprise the peak. 'a' and 'b' are the unknowns from the linear equation system and b/(2a) is
        // the "error" in the abscissa. Well x1,x2,x3 should be y1,y2,y3 because they are the ordinates.
        var x1 = c[T0 - 1];
        var x2 = c[T0];
        var x3 = c[T0 + 1];

        var a = (x1 + x3 - 2 * x2) / 2;
        var b = (x3 - x1) / 2;
        if (a) {
            T0 = T0 - b / (2 * a);
        }

        return sampleRate / T0;
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
</div>

<button onclick={toggleChordsPlaying} type="button">Play chords</button>

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
