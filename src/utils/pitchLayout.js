/**
 * Maps backend lineup `position` strings (GK, ST, snake_case, etc.)
 * to one of five pitch slots for absolute CSS placement.
 * @param {string} position
 * @param {number} ambiguousDefOrdinal — for short "DEF"/"CB" labels, alternates L/R on the pitch
 */
export function normalizePitchSlot(position, ambiguousDefOrdinal = 0) {
  const raw = (position || "").toString().toLowerCase().replace(/[_\s]+/g, "")
  if (raw.includes("goal") || raw === "gk" || raw === "por")
    return "goalkeeper"
  if (raw.includes("defenderleft") || raw === "dl" || raw.includes("leftback"))
    return "defender_left"
  if (raw.includes("defenderright") || raw === "dr" || raw.includes("rightback"))
    return "defender_right"
  if (raw === "def" || raw === "cb" || raw === "defensa")
    return ambiguousDefOrdinal % 2 === 0 ? "defender_left" : "defender_right"
  if (
    raw.includes("mid") ||
    raw === "mf" ||
    raw === "cm" ||
    raw === "dm" ||
    raw === "am"
  )
    return "midfielder"
  if (
    raw.includes("forward") ||
    raw.includes("striker") ||
    raw === "st" ||
    raw === "fw" ||
    raw === "cf"
  )
    return "forward"
  return "midfielder"
}

/** Percent positions within full field (team local = left side). */
export const SLOT_STYLE_LOCAL = {
  goalkeeper: { left: "8%", top: "50%" },
  defender_left: { left: "17%", top: "28%" },
  defender_right: { left: "17%", top: "72%" },
  midfielder: { left: "28%", top: "50%" },
  forward: { left: "41%", top: "50%" },
}

/** Mirrored for visitor (right side). */
export const SLOT_STYLE_VISITOR = {
  goalkeeper: { left: "92%", top: "50%" },
  defender_left: { left: "83%", top: "28%" },
  defender_right: { left: "83%", top: "72%" },
  midfielder: { left: "72%", top: "50%" },
  forward: { left: "59%", top: "50%" },
}
