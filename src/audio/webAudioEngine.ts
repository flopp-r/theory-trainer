import { scheduleSpec } from './synth'
import type { AudioEngine, AudioSpec } from './types'
import { specDuration } from './types'

/** Highest total level; a compressor after this catches any rare peak that adds up too loud. */
const MASTER_LEVEL = 0.9

/** The synth: plain Web Audio, no files to download, works offline. */
export class WebAudioEngine implements AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private bus: GainNode | null = null
  private finish: (() => void) | null = null
  private timer: ReturnType<typeof setTimeout> | null = null

  get available(): boolean {
    return typeof window !== 'undefined' && typeof window.AudioContext !== 'undefined'
  }

  async unlock(): Promise<boolean> {
    if (!this.available) return false
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext()
        const compressor = this.ctx.createDynamicsCompressor()
        this.master = this.ctx.createGain()
        this.master.gain.value = MASTER_LEVEL
        this.master.connect(compressor)
        compressor.connect(this.ctx.destination)
      }
      if (this.ctx.state === 'suspended') await this.ctx.resume()
      return this.ctx.state === 'running'
    } catch {
      return false
    }
  }

  async play(spec: AudioSpec): Promise<void> {
    this.stop()
    if (!(await this.unlock()) || !this.ctx || !this.master) return
    const ctx = this.ctx
    // Each playback has its own bus, so stopping it cannot affect anything else.
    const bus = ctx.createGain()
    bus.connect(this.master)
    this.bus = bus
    scheduleSpec(ctx, bus, spec, ctx.currentTime + 0.06)
    await new Promise<void>((resolve) => {
      this.finish = resolve
      this.timer = setTimeout(() => this.stop(), (specDuration(spec) + 0.3) * 1000)
    })
  }

  stop(): void {
    if (this.timer !== null) clearTimeout(this.timer)
    this.timer = null
    if (this.bus && this.ctx) {
      const bus = this.bus
      bus.gain.cancelScheduledValues(this.ctx.currentTime)
      bus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02)
      setTimeout(() => bus.disconnect(), 400)
    }
    this.bus = null
    const done = this.finish
    this.finish = null
    done?.()
  }
}

let shared: AudioEngine | null = null

/** The one audio engine the whole app uses. */
export function getAudioEngine(): AudioEngine {
  shared ??= new WebAudioEngine()
  return shared
}
