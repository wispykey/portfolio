import { Note, Progression, VoiceLeading, Voicing } from 'tonal';


export const CustomVoicingDictionary = {
    "openFifth": {
        "M": ["1P 5P 10M"],
        "m": ["1P 5P 10m"]
    },
    "root": {
        "M": ["1P 3M 5P"],
        "m": ["1P 3m 5P"]
    }
}


// Tonal.js roman numerals are case insensitive - add 'm' for minor
export const CustomChordProgression = {
    "Im_bVI_bIII_bVII": ["Im", "bVI", "bIII", "bVII"],

}

const defaultVoicingRange: VoicingRange = {
    minNote: "Gb3",
    maxNote: "Gb5"
};

export function createChordProgression(romanNumerals: string[], voicingDict: Record<string, string[]> = CustomVoicingDictionary.root, range: VoicingRange = defaultVoicingRange): ChordProgression {
    const chordNames = Progression.fromRomanNumerals("Bb", romanNumerals);

    let last: string[] | null = null;

    // TODO: Handle invalid ranges
    const applicableRange = [range.minNote, range.maxNote];

    const voicings = chordNames.map((chordName) => {
        let v: string[] = [];

        if (last !== null) {
            v = Voicing.get(chordName, applicableRange, voicingDict, VoiceLeading.topNoteDiff, last);
        } else {
            v = Voicing.get(chordName, applicableRange, voicingDict);
        }

        last = v;

        return v;
    })

    const frequencies = voicings.map((voicing) => {
        return voicing.map((noteName) => {
            return Note.freq(noteName)!;
        });
    });

    return {
        asNotes: voicings,
        asFrequencies: frequencies
    };
}


export interface ChordProgression {
    asNotes: string[][],
    asFrequencies: number[][]
}

export interface VoicingRange {
    minNote: string,
    maxNote: string,
}