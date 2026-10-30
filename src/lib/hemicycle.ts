export interface Seat {
  x: number
  y: number
  r: number
}

export interface Layout {
  seats: Seat[]
  width: number
  height: number
}

/**
 * Computes `count` seats spread over concentric arcs on a half circle.
 * Seats are returned sorted from left to right (by angle), so that deputies
 * sorted by group form contiguous wedges. With `rows = 1`, a single arc: for a small field, such as candidates.
 */
export function hemicycleLayout(count: number, rows = 12, outerRadius = 100, innerRatio = 0.38): Layout {
  const innerRadius = outerRadius * innerRatio
  const rowGap = rows > 1 ? (outerRadius - innerRadius) / (rows - 1) : 0
  const radii = rows > 1 ? Array.from({ length: rows }, (_, i) => innerRadius + i * rowGap) : [outerRadius]
  const totalRadius = radii.reduce((a, b) => a + b, 0)

  // Seats per row, proportional to the arc length
  const perRow = radii.map((r) => Math.floor((count * r) / totalRadius))
  let missing = count - perRow.reduce((a, b) => a + b, 0)
  for (let i = rows - 1; missing > 0; i = (i - 1 + rows) % rows, missing--) perRow[i]++

  // One row: as wide as the gap between neighbours allows, capped so that a handful of seats stay seats
  const seatRadius = rows > 1 ? rowGap * 0.4 : Math.min((Math.PI * outerRadius * 0.42) / Math.max(count - 1, 1), 8)
  const raw: { angle: number; row: number; seat: Seat }[] = []
  radii.forEach((radius, row) => {
    const n = perRow[row]
    for (let k = 0; k < n; k++) {
      const angle = n === 1 ? Math.PI / 2 : Math.PI - (k * Math.PI) / (n - 1)
      raw.push({
        angle,
        row,
        seat: {
          x: outerRadius + radius * Math.cos(angle),
          y: outerRadius - radius * Math.sin(angle),
          r: seatRadius,
        },
      })
    }
  })

  raw.sort((a, b) => b.angle - a.angle || a.row - b.row)
  const pad = seatRadius * 1.5
  return {
    seats: raw.map(({ seat }) => ({ ...seat, x: seat.x + pad, y: seat.y + pad })),
    width: outerRadius * 2 + pad * 2,
    height: outerRadius + pad * 2,
  }
}
