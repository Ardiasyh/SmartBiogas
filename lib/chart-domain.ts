export function paddedChartDomain(values: readonly number[]): [number, number] {
  const finiteValues = values.filter(Number.isFinite)
  if (finiteValues.length === 0) return [-1, 1]

  let minimum = finiteValues[0]
  let maximum = finiteValues[0]
  for (const value of finiteValues) {
    if (value < minimum) minimum = value
    if (value > maximum) maximum = value
  }

  if (minimum === maximum) {
    const padding = Math.max(Math.abs(minimum) * 0.12, 0.1)
    return [minimum - padding, maximum + padding]
  }

  const span = maximum - minimum
  return [minimum - span * 0.08, maximum + span * 0.12]
}

export const AREA_CHART_MARGIN = {
  top: 12,
  right: 12,
  bottom: 8,
  left: 12,
} as const
