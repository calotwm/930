// Pure evidence-based derivation of the additive `playedAscenso` runtime field. `EVIDENCE` tags
// record *why* a player is known to have played an ascenso (lower-division) competition; club
// membership alone is intentionally not a tag source (see design's "Club Membership Alone Is Not
// Evidence" requirement) — only division and explicit source-contribution evidence set the flag.

export const EVIDENCE = {
  TM_ARG2: 'tm-arg2',
  WIKI_EDITIONS: 'wiki-ascenso-editions',
  SOLOASCENSO: 'soloascenso',
  RSSSF_ARG2: 'rsssf-arg2',
  BDFA: 'bdfa',
}

export function addAscensoEvidence(player, tag) {
  player.ascensoEvidence ??= []
  if (!player.ascensoEvidence.includes(tag)) player.ascensoEvidence.push(tag)
}

export function derivePlayedAscenso(player) {
  return player.division === 'Primera Nacional' || player.division === 'Ascenso' || (player.ascensoEvidence?.length ?? 0) > 0
}

// Review tags a `resolveAscensoEntry` merge/flag outcome should push onto the target player.
// `baseTag` (e.g. 'soloascenso-partial', 'rsssf-arg2-partial') marks the total as a lower bound —
// only correct when goals were actually raised (a `merge`). A `flag` never touches goals (the
// player's total was already fully covered by another source), so tagging it "partial" would be
// misleading; `ascenso-era-match` is added independently whenever corroboration was era-only,
// regardless of merge/flag, since era-only corroboration is inherently weaker evidence.
export function partialTagsFor(result, baseTag) {
  const tags = []
  if (result.action === 'merge') tags.push(baseTag)
  if (result.eraOnly) tags.push('ascenso-era-match')
  return tags
}
