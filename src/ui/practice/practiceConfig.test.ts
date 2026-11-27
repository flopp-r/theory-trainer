import { describe, expect, it } from 'vitest'
import { DEFAULT_PRACTICE_CONFIG, PRESETS, type PracticeConfig, TOPIC_GROUPS, describeSetup, presetFor, questionTypeLabel, reviewConfig, parsePracticeConfig, practiceConfigToQuery } from './practiceConfig'

const parse = (text: string) => parsePracticeConfig(new URLSearchParams(text))

describe('parsePracticeConfig', () => {
  it('reads topics, clefs, ledger lines, level and vocabulary', () => {
    expect(parse('topics=notes,keys&clefs=treble,bass&ledger=2&level=3&vocab=tempo,dynamics')).toEqual({
      topics: ['notes', 'keys'],
      clefs: ['treble', 'bass'],
      maxLedgerLines: 2,
      difficulty: 3,
      vocabCategories: ['tempo', 'dynamics'],
    })
  })

  it('puts topics and clefs in a fixed order and ignores duplicates', () => {
    const c = parse('topics=cadences,notes,notes,rhythm&clefs=tenor,alto,treble,alto')
    expect(c.topics).toEqual(['notes', 'rhythm', 'cadences'])
    expect(c.clefs).toEqual(['treble', 'alto', 'tenor'])
  })

  it('falls back to the defaults when parts are missing or invalid', () => {
    expect(parse('')).toEqual(DEFAULT_PRACTICE_CONFIG)
    expect(parse('topics=cooking&clefs=flute&ledger=9&level=7')).toEqual(DEFAULT_PRACTICE_CONFIG)
    expect(parse('topics=&clefs=&ledger=&level=')).toEqual(DEFAULT_PRACTICE_CONFIG)
    expect(parse('ledger=-1').maxLedgerLines).toBe(DEFAULT_PRACTICE_CONFIG.maxLedgerLines)
    expect(parse('ledger=1.5').maxLedgerLines).toBe(DEFAULT_PRACTICE_CONFIG.maxLedgerLines)
    expect(parse('level=0').difficulty).toBe(DEFAULT_PRACTICE_CONFIG.difficulty)
  })

  it('ignores vocabulary names that are not real categories, and keeps the real ones in display order', () => {
    expect(parse('vocab=tempo,<script>,,DYNAMICS,a_b,cooking').vocabCategories).toEqual(['tempo'])
    expect(parse('vocab=tonality,tempo,form,tempo').vocabCategories).toEqual(['tempo', 'form', 'tonality'])
  })

  it('round-trips through the address', () => {
    const configs: PracticeConfig[] = [
      { topics: ['notes'], clefs: ['treble'], maxLedgerLines: 0, difficulty: 1, vocabCategories: [] },
      {
        topics: ['notes', 'rhythm', 'keys', 'scales', 'intervals', 'chords', 'cadences', 'vocabulary', 'ear'],
        clefs: ['treble', 'bass', 'alto', 'tenor'],
        maxLedgerLines: 3,
        difficulty: 3,
        vocabCategories: ['tempo', 'form'],
      },
      { topics: ['chords', 'cadences'], clefs: ['alto', 'tenor'], maxLedgerLines: 2, difficulty: 2, vocabCategories: [] },
    ]
    for (const config of configs) expect(parse(practiceConfigToQuery(config))).toEqual(config)
  })
})

describe('PRESETS', () => {
  it('are all valid setups that survive the page address unchanged', () => {
    expect(PRESETS.length).toBeGreaterThanOrEqual(3)
    for (const preset of PRESETS) {
      expect(parse(practiceConfigToQuery(preset.config))).toEqual(preset.config)
      expect(preset.config.topics.length).toBeGreaterThan(0)
      expect(preset.config.clefs.length).toBeGreaterThan(0)
    }
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length)
  })

  it('keep ear training out of mixed revision, because it needs sound', () => {
    expect(PRESETS.find((p) => p.id === 'mixed')?.config.topics).not.toContain('ear')
  })
})

describe('defaults and describeSetup', () => {
  it('starts a new learner on treble and bass clef', () => {
    expect(DEFAULT_PRACTICE_CONFIG.clefs).toEqual(['treble', 'bass'])
    expect(describeSetup(DEFAULT_PRACTICE_CONFIG)).toBe('Notes · Treble and bass clefs · Medium')
  })

  it('describes topics, clefs and level briefly', () => {
    const base = DEFAULT_PRACTICE_CONFIG
    expect(describeSetup({ ...base, topics: ['notes', 'keys'], clefs: ['alto'], difficulty: 3 })).toBe('Notes, Keys · Alto clef · Hard')
    expect(describeSetup({ ...base, topics: ['notes', 'keys', 'scales', 'chords'], clefs: ['treble', 'bass', 'alto', 'tenor'] })).toBe('4 topics · All clefs · Medium')
    expect(describeSetup({ ...base, topics: ['vocabulary'], difficulty: 1 })).toBe('Vocabulary · Easy')
    expect(describeSetup({ ...base, clefs: ['treble', 'bass', 'alto'] })).toBe('Notes · Treble, bass and alto clefs · Medium')
  })
})

describe('question types in the setup', () => {
  it('reads and writes types, keeping only real ones that belong to the chosen topics', () => {
    const c = parse('topics=notes,keys&types=relative-key,place-note,cooking,ear-cadence')
    expect(c.types).toEqual(['place-note', 'relative-key'])
    expect(practiceConfigToQuery(c)).toContain('&types=place-note,relative-key')
    expect(parse(practiceConfigToQuery(c))).toEqual(c)
  })

  it('leaves types out when none are valid, so every type is used', () => {
    expect(parse('topics=notes&types=relative-key').types).toBeUndefined()
    expect(practiceConfigToQuery(DEFAULT_PRACTICE_CONFIG)).not.toContain('types=')
  })

  it('names a weak area briefly, and puts the topic in front of vocabulary questions', () => {
    expect(questionTypeLabel('place-note')).toBe('Placing notes')
    expect(questionTypeLabel('vocab-meaning')).toBe('Vocabulary: which term?')
    expect(describeSetup({ ...DEFAULT_PRACTICE_CONFIG, types: ['place-note'] })).toBe('Placing notes · Treble and bass clefs · Medium')
  })

  it('does not mention clefs for ear training alone', () => {
    expect(describeSetup({ ...DEFAULT_PRACTICE_CONFIG, topics: ['ear'] })).toBe('Ear training · Medium')
  })
})

describe('presetFor and TOPIC_GROUPS', () => {
  it('recognises a preset, and nothing for a custom mix', () => {
    for (const p of PRESETS) expect(presetFor(p.config)?.id).toBe(p.id)
    expect(presetFor({ ...DEFAULT_PRACTICE_CONFIG, difficulty: 3 })).toBeUndefined()
  })

  it('lists every topic exactly once', () => {
    const grouped = TOPIC_GROUPS.flatMap((g) => g.topics)
    expect([...grouped].sort()).toEqual(['cadences', 'chords', 'ear', 'intervals', 'keys', 'notes', 'rhythm', 'scales', 'vocabulary'])
  })
})

describe('review rounds', () => {
  const item = (id: string, type: string, topic: string) => ({ id, type, topic, label: id, box: 0, due: 0, misses: 1, lastSeen: 0 })
  const weakArea = (type: string, topic: string) => ({ type, topic, answered: 10, correct: 3, recent: Array.from({ length: 10 }, (_, i) => i < 3) })

  it('keeps review=1 in the address', () => {
    const c = parse('topics=notes&review=1')
    expect(c.review).toBe(true)
    expect(practiceConfigToQuery(c)).toContain('&review=1')
    expect(parse('topics=notes').review).toBeUndefined()
  })

  it('covers what is due and weak, in the last-used clefs plus any clef a due item needs', () => {
    const c = reviewConfig({ due: [item('place-note:alto:E4', 'place-note', 'notes')], weak: [weakArea('relative-key', 'keys')] }, DEFAULT_PRACTICE_CONFIG)!
    expect([...c.topics].sort()).toEqual(['keys', 'notes'])
    expect([...c.types!].sort()).toEqual(['place-note', 'relative-key'])
    expect(c.clefs).toEqual(['treble', 'bass', 'alto'])
    expect(c.review).toBe(true)
    expect(parse(practiceConfigToQuery(c))).toEqual(c)
    expect(describeSetup(c)).toBe('Review of your weak spots')
  })

  it('is null when nothing is due or weak', () => {
    expect(reviewConfig({ due: [], weak: [] }, DEFAULT_PRACTICE_CONFIG)).toBeNull()
  })
})
