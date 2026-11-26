# Vocabulary for review

This list was drafted by me, not taken from the AQA specification. **Please check every term and meaning**,
and tell me what to change, add or remove. Nothing here is confirmed as being on the specification.

How to read it:
- **Level** says when the term appears: 1 = Easy, Medium and Hard; 2 = Medium and Hard; 3 = Hard only.
- **Group** keeps near-synonyms apart. Two terms with the same group are never offered as wrong answers for each other
  (for example rallentando and ritardando).
- The editable data is in `src/content/vocabulary/*.json`. This page is generated from it by `node scripts/vocab-doc.mjs`.

## Tempo (Italian terms)

Question wording: “What does “{term}” mean?” and “Which term means “{meaning}”?”

| Term | Meaning | Level | Group |
| --- | --- | --- | --- |
| Grave | very slow and serious | 3 | slow |
| Largo | very slow and broad | 2 | slow |
| Lento | slow | 1 | slow |
| Adagio | slow and relaxed | 2 | slow |
| Andante | at a walking pace | 1 | walking |
| Moderato | at a moderate speed | 1 | moderate |
| Allegretto | fairly fast, a little slower than allegro | 3 | fast |
| Allegro | fast and lively | 1 | fast |
| Vivace | lively and quick | 2 | fast |
| Presto | very fast | 1 | very fast |
| Prestissimo | as fast as possible | 3 | very fast |
| Accelerando | gradually getting faster | 1 | faster |
| Rallentando | gradually getting slower | 1 | slower |
| Ritardando | gradually getting slower | 2 | slower |
| A tempo | go back to the original speed | 2 | a tempo |
| Rubato | the speed bends a little, with some freedom | 3 | rubato |
| Con moto | with movement | 3 | con moto |
| Meno mosso | less movement: slower | 3 | meno |
| Più mosso | more movement: faster | 3 | piu |

## Dynamics

Question wording: “What does “{term}” mean?” and “Which term means “{meaning}”?”

| Term | Meaning | Level | Group |
| --- | --- | --- | --- |
| piano (p) | quiet | 1 | p |
| forte (f) | loud | 1 | f |
| pianissimo (pp) | very quiet | 1 | pp |
| fortissimo (ff) | very loud | 1 | ff |
| mezzo piano (mp) | moderately quiet | 2 | mp |
| mezzo forte (mf) | moderately loud | 2 | mf |
| crescendo (cresc.) | gradually getting louder | 1 | louder |
| diminuendo (dim.) | gradually getting quieter | 1 | quieter |
| decrescendo (decresc.) | gradually getting quieter | 2 | quieter |
| sforzando (sfz) | a sudden, strong accent | 2 | sfz |
| fortepiano (fp) | loud, then immediately quiet | 3 | fp |
| subito (sub.) | suddenly | 3 | subito |
| pianississimo (ppp) | as quiet as possible | 3 | ppp |
| fortississimo (fff) | as loud as possible | 3 | fff |

## Articulation and playing techniques

Question wording: “What does “{term}” mean?” and “Which term means “{meaning}”?”

| Term | Meaning | Level | Group |
| --- | --- | --- | --- |
| staccato | short and detached | 1 | short |
| staccatissimo | very short and detached | 3 | short |
| legato | smooth and connected | 1 | smooth |
| slur | a curved line over notes to be played smoothly | 2 | smooth |
| accent | play the note with extra emphasis | 1 | accent |
| tenuto | hold the note for its full length | 2 | tenuto |
| marcato | marked: strongly accented | 3 | marcato |
| pizzicato (pizz.) | plucked (on a string instrument) | 1 | pizz |
| arco | played with the bow | 2 | arco |
| con sordino | with a mute | 3 | mute |
| tremolo | very fast repetition of the same note | 3 | tremolo |
| glissando | a slide from one note to another | 2 | gliss |
| vibrato | a slight, fast wobble in the pitch of a note | 3 | vibrato |

## Ornaments

Question wording: “What is the ornament “{term}”?” and “Which ornament is “{meaning}”?”

| Term | Meaning | Level | Group |
| --- | --- | --- | --- |
| trill | a fast alternation between a note and the note above it | 1 | trill |
| mordent | a quick, single decoration: the main note, the note next to it, then the main note again | 1 | mordent |
| turn | a four-note decoration: the note above, the main note, the note below, then the main note again | 1 | turn |
| acciaccatura | a very short grace note played just before the main note (shown with a slash through its stem) | 1 | grace-short |
| appoggiatura | a “leaning” grace note that takes some of the length of the main note | 2 | grace-long |
| grace note | a small note that decorates the main note | 1 | grace |

## Texture

Question wording: “What does “{term}” mean?” and “Which term describes “{meaning}”?”

| Term | Meaning | Level | Group |
| --- | --- | --- | --- |
| monophonic | a single melody line with no accompaniment | 1 | mono |
| unison | everyone plays the same notes at the same time (at the same pitch or in octaves) | 2 | unison |
| homophonic | a melody with chords or other parts supporting it, moving together | 1 | homo |
| melody and accompaniment | a tune supported by chords or other backing parts | 1 | homo |
| polyphonic | several independent melody lines at the same time | 1 | poly |
| counterpoint | two or more independent melodies combined | 2 | poly |
| heterophonic | different versions of the same melody played at the same time | 3 | hetero |
| imitation | a melody that is copied by another part soon after it first appears | 2 | imitate |
| canon | strict imitation: each part plays the same melody, starting at different times | 1 | imitate |
| drone | a long held or repeated note, often low, that continues under the music | 2 | drone |

## Structure and form

Question wording: “What does “{term}” mean?” and “Which term describes “{meaning}”?”

| Term | Meaning | Level | Group |
| --- | --- | --- | --- |
| binary form | two sections, A and B | 1 | binary |
| ternary form | three sections: A B A | 1 | ternary |
| rondo | a main theme (A) that keeps returning between contrasting sections, such as A B A C A | 1 | rondo |
| strophic | the same music repeated for each verse of a song | 1 | strophic |
| through-composed | new music for each verse, with no repeated sections | 2 | through |
| theme and variations | a theme followed by changed versions of it | 1 | variations |
| ground bass | a bass line that repeats over and over while the upper parts change | 2 | ground |
| ostinato | a short pattern that is repeated over and over | 2 | repeat |
| riff | a short repeated pattern, often used in rock and jazz | 3 | repeat |
| call and response | one phrase that is answered by another | 2 | callresp |
| verse and chorus | a song that alternates between verses and a repeating chorus | 2 | verse |
| coda | a closing section added at the end | 2 | coda |
| sonata form | exposition, development and recapitulation | 3 | sonata |

## Instruments and families

Question wording: “Which family does the {term} belong to?” and “Which of these instruments is in the {meaning} family?”

| Term | Meaning | Level | Group |
| --- | --- | --- | --- |
| flute | woodwind | 1 | woodwind |
| oboe | woodwind | 1 | woodwind |
| clarinet | woodwind | 1 | woodwind |
| bassoon | woodwind | 1 | woodwind |
| piccolo | woodwind | 2 | woodwind |
| saxophone | woodwind | 2 | woodwind |
| recorder | woodwind | 2 | woodwind |
| cor anglais | woodwind | 3 | woodwind |
| trumpet | brass | 1 | brass |
| trombone | brass | 1 | brass |
| French horn | brass | 1 | brass |
| tuba | brass | 1 | brass |
| cornet | brass | 3 | brass |
| euphonium | brass | 3 | brass |
| violin | string | 1 | string |
| viola | string | 1 | string |
| cello | string | 1 | string |
| double bass | string | 1 | string |
| harp | string | 2 | string |
| guitar | string | 2 | string |
| timpani | percussion | 1 | percussion |
| snare drum | percussion | 1 | percussion |
| cymbals | percussion | 1 | percussion |
| triangle | percussion | 2 | percussion |
| xylophone | percussion | 2 | percussion |
| glockenspiel | percussion | 3 | percussion |
| tambourine | percussion | 2 | percussion |

## Tonality

Question wording: “What does “{term}” mean?” and “Which term describes “{meaning}”?”

| Term | Meaning | Level | Group |
| --- | --- | --- | --- |
| major | based on a major scale | 1 | major |
| minor | based on a minor scale | 1 | minor |
| modal | based on a mode (such as Dorian) instead of a major or minor key | 3 | modal |
| atonal | music with no key and no home note | 2 | atonal |
| diatonic | using only the notes of the key | 2 | diatonic |
| chromatic | using notes that are not in the key, including the notes between the scale notes | 2 | chromatic |
| pentatonic | based on a scale of five notes | 2 | penta |
| modulation | changing from one key to another | 1 | modulation |
| tonic | the home note or chord of a key: the 1st note of the scale | 1 | tonic |
| dominant | the 5th note of the scale, or the chord built on it | 1 | dominant |
| consonant | notes that sound pleasant and settled together | 2 | consonant |
| dissonant | notes that sound tense and clashing together | 2 | dissonant |

## Left out on purpose

- Keyboard instruments (piano, organ, harpsichord): how they are classed varies, so a "which family?" question could have more than one defensible answer.
