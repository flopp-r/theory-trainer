# Key signature layouts (please check against real music)

These are where the app draws each sharp and flat in a key signature, in every clef.
They come from VexFlow (the drawing library). The test suite proves that every sharp and flat is on a position
that is the right *letter* in that clef, but it cannot prove that the *layout* matches printed music.
Please compare the alto and tenor lists with a real viola part (alto clef) and tell me what differs.

Accidentals are listed in the order they are written, left to right.

## Treble clef

**Sharps (C# major, 7 sharps)**

| # | Note | Where it is drawn |
| --- | --- | --- |
| 1 | F♯ | the top line |
| 2 | C♯ | the 3rd space |
| 3 | G♯ | the space above the top line |
| 4 | D♯ | the 4th line |
| 5 | A♯ | the 2nd space |
| 6 | E♯ | the top space |
| 7 | B♯ | the middle line |

**Flats (Cb major, 7 flats)**

| # | Note | Where it is drawn |
| --- | --- | --- |
| 1 | B♭ | the middle line |
| 2 | E♭ | the top space |
| 3 | A♭ | the 2nd space |
| 4 | D♭ | the 4th line |
| 5 | G♭ | the 2nd line |
| 6 | C♭ | the 3rd space |
| 7 | F♭ | the bottom space |

## Bass clef

**Sharps (C# major, 7 sharps)**

| # | Note | Where it is drawn |
| --- | --- | --- |
| 1 | F♯ | the 4th line |
| 2 | C♯ | the 2nd space |
| 3 | G♯ | the top space |
| 4 | D♯ | the middle line |
| 5 | A♯ | the bottom space |
| 6 | E♯ | the 3rd space |
| 7 | B♯ | the 2nd line |

**Flats (Cb major, 7 flats)**

| # | Note | Where it is drawn |
| --- | --- | --- |
| 1 | B♭ | the 2nd line |
| 2 | E♭ | the 3rd space |
| 3 | A♭ | the bottom space |
| 4 | D♭ | the middle line |
| 5 | G♭ | the bottom line |
| 6 | C♭ | the 2nd space |
| 7 | F♭ | the space below the bottom line |

## Alto clef

**Sharps (C# major, 7 sharps)**

| # | Note | Where it is drawn |
| --- | --- | --- |
| 1 | F♯ | the top space |
| 2 | C♯ | the middle line |
| 3 | G♯ | the top line |
| 4 | D♯ | the 3rd space |
| 5 | A♯ | the 2nd line |
| 6 | E♯ | the 4th line |
| 7 | B♯ | the 2nd space |

**Flats (Cb major, 7 flats)**

| # | Note | Where it is drawn |
| --- | --- | --- |
| 1 | B♭ | the 2nd space |
| 2 | E♭ | the 4th line |
| 3 | A♭ | the 2nd line |
| 4 | D♭ | the 3rd space |
| 5 | G♭ | the bottom space |
| 6 | C♭ | the middle line |
| 7 | F♭ | the bottom line |

## Tenor clef

**Sharps (C# major, 7 sharps)**

| # | Note | Where it is drawn |
| --- | --- | --- |
| 1 | F♯ | the 2nd line |
| 2 | C♯ | the 4th line |
| 3 | G♯ | the 2nd space |
| 4 | D♯ | the top space |
| 5 | A♯ | the middle line |
| 6 | E♯ | the top line |
| 7 | B♯ | the 3rd space |

**Flats (Cb major, 7 flats)**

| # | Note | Where it is drawn |
| --- | --- | --- |
| 1 | B♭ | the 3rd space |
| 2 | E♭ | the top line |
| 3 | A♭ | the middle line |
| 4 | D♭ | the top space |
| 5 | G♭ | the 2nd space |
| 6 | C♭ | the 4th line |
| 7 | F♭ | the 2nd line |
