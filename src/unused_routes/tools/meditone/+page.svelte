<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import {
        createChordProgression,
        type ChordProgression,
        CustomChordProgression,
        CustomVoicingDictionary,
    } from "./chord-progressions";
    import { intepretPitch } from "./pitch-detection";
    import { BarlineType, Factory } from "vexflow";

    let audioContext: AudioContext;
    let analyser: AnalyserNode;
    let canvas: HTMLCanvasElement;
    let canvasContext: CanvasRenderingContext2D;

    const NO_INPUT = "No input detected";
    let displayedValue = $state(NO_INPUT);
    let detectedValue = $state(NO_INPUT);

    const smoothingFrameThreshold = 20;
    let currSustainedFrames = 0;
    let animFrameID = 0;

    const activeOscillators: OscillatorNode[] = [];

    let chordProgressionAsRomanNumerals: string[] = $state([]);
    let voicingDictionary: Record<string, string[]> = $state(
        CustomVoicingDictionary.openFifth,
    );

    // Root positions for compact, predictable display
    let rootChordProgression: ChordProgression = $derived(
        createChordProgression(chordProgressionAsRomanNumerals),
    );
    // Voiced for better listening experience
    let voicedChordProgression: ChordProgression = $derived(
        createChordProgression(
            chordProgressionAsRomanNumerals,
            voicingDictionary,
            {
                minNote: "Gb2",
                maxNote: "Gb4",
            },
        ),
    );

    const lookahead = 25.0;
    const scheduleAheadTime = 0.15;
    const tempo = 60;
    let isChordsPlaying = $state(false);
    let nextChordTime = 0.0;
    let timerID = -1;
    let currentChordInProgression = 0;

    let gainNode: GainNode;

    let vexflowOutputElementId = "vexflow";
    let vexFlowOutputWidth = 800;
    // For time signature and key signature, approximately
    const FIRST_MEASURE_EXTRA_WIDTH = 50;

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

    function renderScore() {
        let x = 0;
        let y = 0;
        // Must subtract 1 to reserve space for end bar line
        const measureWidth =
            (vexFlowOutputWidth - FIRST_MEASURE_EXTRA_WIDTH - 1) / 4;

        const factory = new Factory({
            renderer: {
                elementId: vexflowOutputElementId,
                width: vexFlowOutputWidth,
                height: 200,
            },
        });
        const formatter = factory.Formatter();

        function makeStave(width: number) {
            let stave = factory.Stave({
                x: x,
                y: y,
                width: width,
            });
            x += width;
            return stave;
        }

        const score = factory.EasyScore();
        rootChordProgression.asNotes.map((chord, i) => {
            /* Very simplified
            Assume voice leading is OK, always first note as bottom voice, second note as middle, etc.
            Only 4/4, all whole notes.
            */

            // makeStave (which wraps a call to factory.Stave()) is picky about timing!
            // It MUST be called immediately before each score.voice(score.notes(...)), or else the voices won't bind to the measures in sequence
            // Previously tried creating all voices before creating any staves, which resulted in MissingStave errors
            // Think of the stave as a pointer, which is moved forward every time factory.Stave() is called
            const stave = makeStave(
                i === 0
                    ? measureWidth + FIRST_MEASURE_EXTRA_WIDTH
                    : measureWidth,
            );

            // const staveVoices = chord.map((note, i) => {
            //     return score.voice(score.notes(`${note}/w`));
            // });

            // Putting all notes in a single voice improves rendering output
            // and is OK since, using whole notes, we won't need stems in different directions
            const noteString =
                "(" +
                chord.reduce((acc, note, i) => {
                    return acc + (i > 0 ? " " : "") + `${note}`;
                }, "") +
                ")/w";

            console.log(noteString);
            const staveVoices = [score.voice(score.notes(noteString))];

            if (i === 0) {
                stave.addTimeSignature("4/4");
                stave.addClef("treble");
            }

            if (i === rootChordProgression.asNotes.length - 1) {
                stave.setEndBarType(BarlineType.SINGLE);
            }

            formatter.joinVoices(staveVoices).formatToStave(staveVoices, stave);
        });

        factory.draw();
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
            (currentChordInProgression + 1) %
            voicedChordProgression.asFrequencies.length;

        const currentChord =
            voicedChordProgression.asFrequencies[currentChordInProgression];

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

        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();

        analyser.minDecibels = -110;
        analyser.maxDecibels = -10;
        analyser.smoothingTimeConstant = 0.85;

        gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
        gainNode.gain.value = 0.1;

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

        chordProgressionAsRomanNumerals =
            CustomChordProgression.Im_bVI_bIII_bVII;

        draw();

        return () => {
            cancelAnimationFrame(animFrameID);
            audioContext.close();
        };
    });

    $effect(() => {
        // Re-render when chord progression changes
        renderScore();
    });
</script>

<p>{displayedValue}</p>

<div class="controls">
    <canvas bind:this={canvas} id="visualization" width="500"> </canvas>
    <svg id={vexflowOutputElementId} width={vexFlowOutputWidth}></svg>
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

    canvas {
        margin: 2rem;
    }
</style>
