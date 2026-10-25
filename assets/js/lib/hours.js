// Horarios (#16). Todas las horas en Europe/Madrid. La recomendación usa la hora prevista de llegada,
// no «abierto ahora». Sin dato no hay «abierto»: hay «desconocido».
import { toMinutes } from './format.js';

export const SLOTS = ['esmorzar', 'comida', 'merienda', 'cena'];

export function slotOf(time) {
  const m = toMinutes(time);
  if (m < 12 * 60) return 'esmorzar';
  if (m < 16 * 60 + 30) return 'comida';
  if (m < 20 * 60) return 'merienda';
  return 'cena';
}

// Estados: abierto | solo_llevar | probable | cerrado | contradictorio | desconocido
// opts.holiday: true si la fecha es festivo. Un festivo cierra si el local lo declara (hours.holidays = 'cerrado');
// si no hay dato, el horario semanal publicado deja de ser una confirmación y pasa a «probable».
export function statusAt(hours, day, time, opts = {}) {
  const base = weeklyStatus(hours, day, time);
  if (!opts.holiday || !hours) return base;
  if (hours.holidays === 'cerrado') return { state: 'cerrado', reason: 'festivo' };
  if (hours.holidays === 'abierto') return base;
  if (base.state === 'abierto' || base.state === 'solo_llevar') return { ...base, state: 'probable', reason: 'festivo_sin_dato' };
  return base;
}

function weeklyStatus(hours, day, time) {
  if (!hours) return { state: 'desconocido' };
  const t = toMinutes(time);
  const weekly = hours.weekly || null;
  const dayVal = weekly ? weekly[day] : undefined;

  if (Array.isArray(dayVal) && dayVal.length === 0) return { state: 'cerrado', reason: 'dia' };

  if (hours.status === 'contradictorio') return { state: 'contradictorio' };

  if (Array.isArray(dayVal)) {
    for (const [a, b] of dayVal) {
      const start = toMinutes(a);
      const end = toMinutes(b);
      if (t >= start && t < end) {
        const takeaway = hours.takeaway_only_last_min;
        if (takeaway && t >= end - takeaway) return { state: 'solo_llevar', closes: b, partial: hours.status !== 'documentado' };
        return { state: 'abierto', closes: b, minutesLeft: end - t, partial: hours.status !== 'documentado', kitchen: !!hours.kitchen };
      }
    }
    return { state: 'cerrado', reason: 'hora', intervals: dayVal };
  }

  if (dayVal && Array.isArray(dayVal.slots)) {
    const slot = slotOf(time);
    if (slot === 'esmorzar' || slot === 'merienda') return { state: 'desconocido', reason: 'sin_horas' };
    return dayVal.slots.includes(slot) ? { state: 'probable', reason: 'franja_sin_horas' } : { state: 'cerrado', reason: 'franja' };
  }

  if (Array.isArray(hours.service)) {
    for (const [a, b] of hours.service) {
      if (t >= toMinutes(a) && t < toMinutes(b)) return { state: 'probable', reason: 'servicio_sin_dias', closes: b };
    }
    return { state: 'desconocido', reason: 'fuera_servicio_documentado' };
  }

  return { state: 'desconocido' };
}

// ¿Es incompatible (excluir)? Solo cuando sabemos que está cerrado.
export function isClosed(status) {
  return status.state === 'cerrado';
}

// ¿Está confirmado como compatible? Abierto con horario documentado o «solo para llevar» no cuenta como sentarse.
export function isConfirmedOpen(status) {
  return status.state === 'abierto';
}
