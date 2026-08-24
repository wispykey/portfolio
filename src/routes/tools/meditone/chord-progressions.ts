import { Chord, Note, Progression, VoiceLeading, Voicing } from 'tonal';

const customTriadVoicings = {
    "M": ["1P 5P 10M"],
    "m": ["1P 5P 10m"]
}

// Tonal.js does not use lowercase roman numerals - add 'm' for minor
export const i_bVI_bIII_bVII = ["Im", "bVI", "bIII", "bVII"];


export function createChordProgression(romanNumerals: string[]): number[][] {
    const chordNames = Progression.fromRomanNumerals("Bb", romanNumerals);

    let last: string[] | null = null;

    const dummyRange = ["Gb2", "Gb4"];

    const voicings = chordNames.map((chordName) => {
        let v: string[] = [];

        if (last !== null) {
            v = Voicing.get(chordName, dummyRange, customTriadVoicings, VoiceLeading.topNoteDiff, last);
        } else {
            v = Voicing.get(chordName, dummyRange, customTriadVoicings);
        }

        last = v;

        return v;
    })

    const notes = voicings.map((voicing) => {
        return voicing.map((noteName) => {
            return Note.freq(noteName)!;
        });
    });

    return notes;
}