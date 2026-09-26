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
