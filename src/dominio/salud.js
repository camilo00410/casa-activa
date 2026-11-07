/** Cálculos de salud. Funciones puras e informativas: no constituyen un diagnóstico. */

const redondear = (x) => Math.round(x * 10) / 10;

/**
 * Índice de masa corporal: peso (kg) / talla² (m).
 * @returns {number|null} IMC con un decimal, o null si los datos no permiten calcularlo.
 */
export function calcularIMC(pesoKg, tallaCm) {
  const peso = Number(pesoKg);
  const talla = Number(tallaCm) / 100;
  if (!Number.isFinite(peso) || !Number.isFinite(talla) || peso <= 0 || talla <= 0) return null;
  return redondear(peso / (talla * talla));
}

/** Clasificación de la OMS para personas adultas. */
export function clasificarIMC(imc) {
  if (imc === null || imc === undefined) return null;
  if (imc < 18.5) return 'Bajo peso';
  if (imc < 25) return 'Peso normal';
  if (imc < 30) return 'Sobrepeso';
  return 'Obesidad';
}
