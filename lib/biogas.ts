
const F_CH4 = 0.56;
const LHV_CH4 = 35.8; // MJ/m3
const MJ_TO_KWH = 1 / 3.6;
const ETA_GEN = 0.08;

export function calculateEnergyKwh(flow_m3_per_hour: number): number {
  // Volume CH4
  const V_CH4 = flow_m3_per_hour * F_CH4;

  // LHV biogas (kWh/m3)
  const LHV_biogas = LHV_CH4 * F_CH4 * MJ_TO_KWH;

  // Energi masuk per jam
  const Ein = V_CH4 * LHV_biogas;

  // Energi listrik keluar
  return Ein * ETA_GEN;
}
