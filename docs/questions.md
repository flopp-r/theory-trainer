# Question types (Phase 3)

Every question comes from a generator in `src/questions/`. This page lists them and what each level means.
Levels are Easy (1), Medium (2) and Hard (3), chosen in Practice.

| Topic | Type | What it asks | Easy | Medium | Hard |
| --- | --- | --- | --- | --- | --- |
| Notes | `note-name` | Name the note on the staff | natural notes, your ledger-line setting | same | same |
| Notes | `note-accidental` | Name a note with a sharp or flat | ♯ and ♭ | same | adds double ♯ and ♭ |
| Notes | `clef-compare` | Are two notes in different clefs the same pitch? | all levels | | |
| Notes | `place-note` | Tap where a named note goes | your ledger-line setting | | |
| Rhythm | `note-value` | Name a note (semibreve ... semiquaver) | undotted | adds dotted minim, crotchet, quaver | adds more dotted and double-dotted |
| Rhythm | `rest-value` | Name a rest | undotted | undotted | adds dotted rests |
| Rhythm | `note-beats` | Crotchet beats a note is worth | undotted | dotted | double-dotted |
| Rhythm | `time-sig-beats` | Main beats in a bar | 2/4 3/4 4/4 | adds 6/8 9/8 12/8 2/2 3/8 | adds 3/2 6/4 |
| Rhythm | `time-sig-type` | Simple or compound, duple/triple/quadruple | 2/4 3/4 4/4 6/8 | adds 2/2 3/8 9/8 12/8 | adds 3/2 6/4 |
| Keys | `key-from-signature` | Which key has this signature (major or minor asked) | up to 2 sharps/flats | up to 4 | up to 7 |
| Keys | `signature-from-key` | How many / which sharps or flats | count only | adds "which ones" | up to 7 |
| Keys | `relative-key` | Relative (and parallel) major/minor | relative only | adds parallel | up to 7 |
| Scales | `scale-spelling` | Which notes make up a scale | major | adds natural minor, pentatonics | adds harmonic and melodic minor, blues |
| Scales | `scale-degree` | Degree names (tonic, supertonic ...) | major | major | adds natural minor (subtonic) |
| Intervals | `interval-on-staff` | Name the interval between two notes | number only | number and quality (natural notes) | adds ♯/♭ notes, augmented 4th, diminished 5th |
| Intervals | `interval-above` | What note is a given interval above (or below) a note? | M2 M3 P4 P5 | adds more intervals and ♯/♭ start notes | adds A4, d5 and intervals below |
| Chords | `triad-on-staff` | Major, minor, diminished, augmented | major, minor | adds diminished | adds augmented |
| Chords | `seventh-on-staff` | Dominant, major, minor, half-diminished, diminished 7th | first three | adds half-diminished | adds diminished 7th |
| Chords | `chord-notes` | Which notes make up a chord symbol | major, minor | all triads | adds 7ths |
| Chords | `chord-symbol` | Chord symbol for a chord on the staff | major, minor | all triads | adds 7ths and slash chords |
| Chords | `inversion` | Root position / first / second inversion | triads | triads | adds 7th chords and third inversion |
| Chords | `roman-numeral` | Numeral for a chord, or chord for a numeral | I ii IV V vi in major | all degrees, minor keys | adds 7ths |
| Cadences | `cadence-on-staff` | Name the cadence shown | major keys | adds minor keys | adds V7 versions |
| Cadences | `cadence-by-name` | Which chord pair makes this cadence | major keys | adds minor keys | adds V7 versions |
| Vocabulary | `vocab-term` | What does a term mean | core terms | adds further terms | adds extra terms |
| Vocabulary | `vocab-meaning` | Which term means this | core terms | adds further terms | adds extra terms |

## Rules every type follows
- **Item ids are stable.** The same item always has the same id and the same answer, so statistics stay meaningful.
  The id includes anything that changes the answer's format (for example interval questions at Easy ask for a number, later levels for number and quality).
- **Wrong answers are real mistakes.** Examples: C♯ offered with D♭, the undotted value of a dotted note,
  the parallel key when asking for the relative key, the root-position symbol for an inverted chord.
  A wrong answer is never also correct.
- **Only the 30 standard keys appear** (up to seven sharps or flats). Chord roots B♯, E♯, C♭ and F♭ are not used.
- **Tags:** `aqa-candidate` means it might be on the specification and needs checking against it; `extra` means added for the app's own purposes.
  Both are listed in `docs/aqa-coverage.md`.

## Wording conventions to check
- **Beats per bar.** The prompt says "main beats (the beats you would tap)", so 6/8 has 2. Some teachers count 6 quaver beats instead.
- **Compound time.** Top number 6, 9 or 12 (a multiple of 3 above 3). 3/8 is treated as simple triple.
- **Key signatures.** The question says whether it wants the major or the minor key, because one signature belongs to both.
