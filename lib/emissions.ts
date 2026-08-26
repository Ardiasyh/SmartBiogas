export const BIOGAS_LHV_KWH_PER_M3 = 5.568
export const LPG_NCV_MJ_PER_KG = 47.3
export const LPG_LHV_KWH_PER_KG = LPG_NCV_MJ_PER_KG / 3.6
export const LPG_CO2_EF_KG_PER_TJ = 63_100

export const LPG_CO2_KG_PER_KG =
  (LPG_CO2_EF_KG_PER_TJ * LPG_NCV_MJ_PER_KG) / 1_000_000

function nonNegative(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0
}

export function calculateLpgComparisonFromFlow(flowM3h: number) {
  const biogasFlowM3h = nonNegative(flowM3h)
  const biogasEnergyKWhPerHour = biogasFlowM3h * BIOGAS_LHV_KWH_PER_M3
  const lpgEquivalentKgPerHour = biogasEnergyKWhPerHour / LPG_LHV_KWH_PER_KG
  const avoidedCo2KgPerHour = lpgEquivalentKgPerHour * LPG_CO2_KG_PER_KG

  return {
    biogasFlowM3h,
    biogasEnergyKWhPerHour,
    lpgEquivalentKgPerHour,
    avoidedCo2KgPerHour,
  }
}

export function calculateLpgComparisonFromVolume(volumeM3: number) {
  const biogasVolumeM3 = nonNegative(volumeM3)
  const biogasEnergyKWh = biogasVolumeM3 * BIOGAS_LHV_KWH_PER_M3
  const lpgEquivalentKg = biogasEnergyKWh / LPG_LHV_KWH_PER_KG
  const avoidedCo2Kg = lpgEquivalentKg * LPG_CO2_KG_PER_KG

  return {
    biogasVolumeM3,
    biogasEnergyKWh,
    lpgEquivalentKg,
    avoidedCo2Kg,
  }
}
