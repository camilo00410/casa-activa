/**
 * Lógica de seguimiento de hábitos (RF5).
 * Las fechas se manejan como cadenas locales 'AAAA-MM-DD'. Nunca se usa toISOString(),
 * porque convierte a UTC: en Colombia (UTC-5) un hábito marcado después de las 7 p. m.
 * quedaría registrado en el día siguiente.
 */

const dosDigitos = (n) => String(n).padStart(2, '0');

export const fechaLocal = (fecha = new Date()) => `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;

const aFecha = (texto) => {
  const [a, m, d] = texto.split('-').map(Number);
  return new Date(a, m - 1, d);
};

export const sumarDias = (texto, dias) => {
  const f = aFecha(texto);
  f.setDate(f.getDate() + dias);
  return fechaLocal(f);
};

/** Lunes de la semana a la que pertenece la fecha. */
export const inicioSemana = (texto) => sumarDias(texto, -((aFecha(texto).getDay() + 6) % 7));

export function rachaActual(fechas, hoy) {
  const marcadas = new Set(fechas);
  // Si hoy aún no se ha marcado, la racha sigue viva desde ayer.
  let cursor = marcadas.has(hoy) ? hoy : sumarDias(hoy, -1);
  let racha = 0;
  while (marcadas.has(cursor)) {
    racha += 1;
    cursor = sumarDias(cursor, -1);
  }
  return racha;
}

export function mejorRacha(fechas) {
  const ordenadas = [...new Set(fechas)].sort();
  let mejor = 0;
  let actual = 0;
  let anterior = null;
  for (const f of ordenadas) {
    actual = anterior && sumarDias(anterior, 1) === f ? actual + 1 : 1;
    mejor = Math.max(mejor, actual);
    anterior = f;
  }
  return mejor;
}

export function progresoSemana(fechas, metaSemanal, hoy) {
  const lunes = inicioSemana(hoy);
  const domingo = sumarDias(lunes, 6);
  const hechos = new Set(fechas.filter((f) => f >= lunes && f <= domingo)).size;
  return { hechos, meta: metaSemanal, cumplida: hechos >= metaSemanal };
}

/** '2026-11-06' → '6 de noviembre de 2026', sin desfases por zona horaria. */
export const fechaLegible = (texto) => new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(aFecha(texto));

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

export function ultimosDias(fechas, hoy, cantidad = 7) {
  const marcadas = new Set(fechas);
  return Array.from({ length: cantidad }, (_, i) => {
    const fecha = sumarDias(hoy, i - cantidad + 1);
    return { fecha, hecho: marcadas.has(fecha), dia: DIAS[aFecha(fecha).getDay()], esHoy: fecha === hoy };
  });
}

/**
 * Porcentaje de cumplimiento de las últimas semanas, de la más antigua a la actual.
 * En cada hábito cuenta como máximo su meta semanal, para que cumplir de más en uno
 * no oculte lo que falta en otro.
 */
export function cumplimientoSemanal(habitos, registrosPorHabito, hoy, semanas = 8) {
  const semanaActual = inicioSemana(hoy);
  return Array.from({ length: semanas }, (_, i) => {
    const lunes = sumarDias(semanaActual, (i - semanas + 1) * 7);
    const domingo = sumarDias(lunes, 6);
    let hechos = 0;
    let meta = 0;
    for (const habito of habitos) {
      if (habito.creado > domingo) continue;
      const fechas = (registrosPorHabito[habito.id] ?? []).filter((f) => f >= lunes && f <= domingo);
      hechos += Math.min(new Set(fechas).size, habito.metaSemanal);
      meta += habito.metaSemanal;
    }
    return { semana: lunes, hechos, meta, porcentaje: meta ? Math.round((hechos / meta) * 100) : 0 };
  });
}
