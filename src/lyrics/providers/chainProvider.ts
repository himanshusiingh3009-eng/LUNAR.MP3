import type { LyricsProvider, LyricsResult } from './types'

// Tries every provider and prefers a real SYNCED result over an
// unsynced one, even if an earlier provider in the list returned an
// unsynced result first. Only falls back to the best unsynced
// result if genuinely no provider has synced timestamps. This is
// itself a LyricsProvider — nothing downstream knows how many real
// sources are behind it.
export function createLyricsProviderChain(providers: LyricsProvider[]): LyricsProvider {
  return {
    name: `chain(${providers.map((p) => p.name).join(' -> ')})`,
    async fetchLyrics(query): Promise<LyricsResult | null> {
      let bestUnsynced: LyricsResult | null = null

      for (const provider of providers) {
        let result: LyricsResult | null
        try {
          result = await provider.fetchLyrics(query)
        } catch {
          continue
        }
        if (!result || result.lines.length === 0) continue

        if (result.synced) return result // real sync wins immediately
        if (!bestUnsynced) bestUnsynced = result
      }

      return bestUnsynced
    },
  }
}
