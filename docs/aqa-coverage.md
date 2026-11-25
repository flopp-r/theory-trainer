# AQA GCSE Music (8271) coverage

Every piece of content that is meant to cover the AQA GCSE Music specification is tagged in the code and listed here
so it can be checked against the official specification.

**Status:** candidates only. Nothing below has been checked against the official specification.
Nothing here is taken from memory of the specification: each row must be confirmed against the
current official AQA document before it is relied on.

Tags used in the code:
- `aqa-candidate`: might be on the specification; needs checking.
- `extra`: added for the app's own purposes (viola and guitar reading, extra clefs), not claimed to be on the specification.

For each row, please write "yes", "no" or "partly" in the last column and tell me.
Question wording and levels are in `docs/questions.md`. Vocabulary terms are in `docs/vocabulary-review.md`.

## Notation

| Topic | Question type | Tag | On the spec? |
| --- | --- | --- | --- |
| Note names in treble clef | `note-name`, `note-accidental`, `interval-on-staff`, `triad-on-staff`, `seventh-on-staff`, `chord-symbol`, `inversion`, `roman-numeral`, `cadence-on-staff`, `key-from-signature` (treble) | `aqa-candidate` | |
| Note names in bass clef | the same types, bass clef | `aqa-candidate` | |
| Note names using ledger lines | `note-name` with the ledger-line setting | `aqa-candidate` | |
| Sharps and flats on notes | `note-accidental` | `aqa-candidate` (treble, bass) | |
| Double sharps and double flats | `note-accidental` at Hard | `aqa-candidate` | probably not |
| Alto clef | all types that draw a staff | `extra` | |
| Tenor clef | all types that draw a staff | `extra` | |
| Comparing notes in different clefs | `clef-compare` | `extra` | |
| Placing a note on the staff by tapping | `place-note` | `extra` | |

## Rhythm

| Topic | Question type | Tag | On the spec? |
| --- | --- | --- | --- |
| Note values (semibreve to semiquaver) | `note-value` | `aqa-candidate` | |
| Rest values | `rest-value` | `aqa-candidate` | |
| Dotted notes, double-dotted notes | `note-value`, `note-beats` | `aqa-candidate` | double dots: probably not |
| Beats per bar, simple time (2/4, 3/4, 4/4) | `time-sig-beats` | `aqa-candidate` | |
| Compound time (6/8, 9/8, 12/8) | `time-sig-beats`, `time-sig-type` | `aqa-candidate` | |
| 2/2, 3/8, 3/2, 6/4 | `time-sig-beats`, `time-sig-type` at Medium and Hard | `aqa-candidate` | |

## Keys and scales

| Topic | Question type | Tag | On the spec? |
| --- | --- | --- | --- |
| Key signatures: reading them and writing them | `key-from-signature`, `signature-from-key` | `aqa-candidate` | how many sharps/flats the spec expects: |
| Relative keys | `relative-key` | `aqa-candidate` | |
| Parallel keys | `relative-key` at Medium and Hard | `aqa-candidate` | |
| Major and natural minor scales | `scale-spelling` | `aqa-candidate` | |
| Harmonic and melodic minor scales | `scale-spelling` at Hard | `aqa-candidate` | |
| Pentatonic and blues scales | `scale-spelling` | `aqa-candidate` | |
| Scale degree names (tonic, supertonic ...) | `scale-degree` | `aqa-candidate` | |

## Intervals and chords

| Topic | Question type | Tag | On the spec? |
| --- | --- | --- | --- |
| Naming intervals | `interval-on-staff` | `aqa-candidate` | |
| Building intervals | `interval-above` | `aqa-candidate` | |
| Triads (major, minor, diminished, augmented) | `triad-on-staff`, `chord-notes`, `chord-symbol` | `aqa-candidate` | |
| 7th chords | `seventh-on-staff`, `chord-notes`, `chord-symbol` | `aqa-candidate` | |
| Inversions | `inversion`, `chord-symbol` (slash chords) | `aqa-candidate` | |
| Chord symbols | `chord-symbol`, `chord-notes` | `aqa-candidate` | |
| Roman numerals | `roman-numeral` | `aqa-candidate` | |
| Primary chords (I, IV, V) | `roman-numeral` | `aqa-candidate` | |

## Cadences

| Topic | Question type | Tag | On the spec? |
| --- | --- | --- | --- |
| Perfect, imperfect, plagal, interrupted cadences | `cadence-on-staff`, `cadence-by-name` | `aqa-candidate` | |
| Cadences in minor keys | same, Medium and Hard | `aqa-candidate` | |
| The exact definitions used | see `docs/theory-engine.md` (items 9 and 10) | | |

## Vocabulary

All eight categories are `aqa-candidate`: tempo, dynamics, articulation and playing techniques, ornaments, texture,
structure and form, instruments and families, tonality. Every term is listed in `docs/vocabulary-review.md`.
