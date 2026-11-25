# Theory engine (Phase 1)

Pure TypeScript in `src/theory/`. No UI, no audio, no browser APIs. Import everything from `src/theory`.

## What it can do

| Area | File | Covers |
| --- | --- | --- |
| Pitches | `pitch.ts` | Letter + accidental + octave, MIDI number, parse/format ("F#4", "Bb3"), enharmonic spellings |
| Intervals | `interval.ts` | Number and quality (diminished to augmented, plus doubly), transpose up/down, inversion, names ("major 3rd", "M3") |
| Clefs | `clef.ts` | Treble, bass, alto, tenor: pitch to staff position and back, ledger line count |
| Scales | `scale.ts` | Major, natural/harmonic/melodic minor, major/minor pentatonic, blues; degree names |
| Keys | `key.ts` | Key signatures, relative and parallel keys, circle of fifths, dominant/subdominant, closely related keys |
| Chords | `chord.ts` | 4 triads, 5 sevenths; inversions; open/close voicing; chord symbols (parse and write); figured bass labels |
| Roman numerals | `roman.ts` | Write and read numerals with inversions; diatonic chords; primary chords |
| Cadences | `cadence.ts` | Perfect, imperfect, plagal, interrupted in major and minor; classify two chords |
| Instruments | `instruments.ts` | Viola range (C3 up), guitar sounds an octave below written |

## How correctness is checked

Spelling matters (F# is not Gb), so everything is built from letter names and intervals, not semitone counts.
The tests check each result two ways that do not share code:

- Scales and chords are compared against hand-written tables **and** against a semitone check done with MIDI numbers.
- Every scale is compared with its key signature, which is worked out separately from the circle of fifths.
- Parsing and writing are round-tripped for every root, quality, key and inversion.
- Deliberately breaking the engine (wrong sharp order, wrong 6th size, off-by-one clef, wrong chord spelling) makes the tests fail.

Anything the engine cannot answer correctly throws an error. It never returns a guess.

## Conventions I chose (please review)

These are choices, not facts from the AQA specification. Check them against your teacher's or the exam board's usage.

1. **Octaves:** scientific pitch, middle C = C4 = MIDI 60. The octave number changes at C, so B#3 is the same sound as C4.
2. **Staff positions:** counted in steps from the bottom line (0). Lines are even, spaces odd.
3. **Standard keys:** up to seven sharps or flats (Cb major to C# major). Keys like G# major (eight sharps) are rejected for key signatures.
4. **Intervals:** the engine can name up to doubly augmented and doubly diminished. A diminished unison does not exist (it would go downwards).
5. **Blues scale:** the six-note minor blues (1 b3 4 b5 5 b7).
6. **Melodic minor:** the ascending form is the scale; coming down it is the natural minor.
7. **Degree 7 name:** "leading note" when a semitone below the tonic, "subtonic" in natural minor.
8. **Roman numerals:**
   - Measured against the major scale (major keys) or the **natural** minor scale (minor keys).
   - Upper case = major, augmented, dominant 7th, major 7th. Lower case = minor, diminished, half-diminished.
   - Symbols: ° diminished, ø half-diminished, + augmented, "maj" for major 7th.
   - Inversions use figured bass: I, I6, I6/4, V7, V6/5, V4/3, V4/2.
   - In a minor key a diminished chord on the raised 7th is plain vii°; the natural 7th chord is VII.
   - Chords a semitone off the scale get a ♯ or ♭ prefix, for example ♭VII in a major key.
9. **Primary chords:** I, IV, V in major; i, iv, V in minor, with the **major** V.
10. **Cadences:**
    - perfect: V (or V7) then I
    - imperfect: I, ii or IV then V (minor: i, ii° or iv then V)
    - plagal: IV then I (minor: iv then i)
    - interrupted: V (or V7) then vi (minor: VI)
    - A major tonic at the end of a minor-key perfect cadence (a "Picardy third") is **not** recognised.
    - Other chords before V (for example vi then V) are not listed, so `classifyCadence` returns null for them.
11. **Viola range:** the low end (C3, the open C string) is a fact. The high end (A5) is a limit I chose to keep questions readable. It is easy to change.
12. **Harmonic minor sevenths:** degrees 1 (minor-major 7th) and 3 (augmented major 7th) are left out because those chord types are not supported.

## Added for questions (Phase 3)

- `accidentals.ts`: which sharps, flats and naturals to print on notes, given a key signature and carry-over within a bar.
- `rhythm.ts`: note and rest values (British names), dots, and simple and compound time signatures.
- `describeStaffPosition` in `clef.ts`: plain-words position, e.g. "the 1st ledger line above the staff".

Time signature conventions:
- A top number of 2, 3 or 4 is simple time. 6, 9 or 12 is compound. Other top numbers are not supported.
- In compound time the beat is three of the bottom-number notes, so 6/8 has 2 beats (dotted crotchets).

## Not in this phase

- Where the sharps and flats sit on the staff for each clef. VexFlow draws key signatures, so I did not guess these (see `key-signature-layouts.md` for what it draws, to be checked against real music).
- Anything marked as AQA content. Nothing has been written or tagged yet, so `docs/aqa-coverage.md` is unchanged.
