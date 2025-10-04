import { DateTime } from "luxon";

// Horario laboral en Colombia
const WORK_START_HOUR = 8;
const LUNCH_START_HOUR = 12;
const LUNCH_END_HOUR = 13;
const WORK_END_HOUR = 17;

// Zona horaria
const COLOMBIA_ZONE = "America/Bogota";

// URL de festivos
const HOLIDAYS_URL = "https://content.capta.co/Recruitment/WorkingDays.json";

export interface BusinessTimeInput {
  days?: number;
  hours?: number;
  date?: string; // Fecha inicial en formato ISO UTC
}

export interface BusinessTimeResult {
  date: string; // Fecha final en UTC
}

async function getHolidays(): Promise<string[]> {
  const response = await fetch(HOLIDAYS_URL);
  return await response.json();
}

function isWeekend(date: DateTime): boolean {
  return date.weekday === 6 || date.weekday === 7;
}

function isHoliday(date: DateTime, holidays: string[]): boolean {
  return holidays.includes(date.toISODate() || "");
}

function isBusinessDay(date: DateTime, holidays: string[]): boolean {
  return !isWeekend(date) && !isHoliday(date, holidays);
}

function nextBusinessDay(date: DateTime, holidays: string[]): DateTime {
  let next = date.plus({ days: 1 }).set({ hour: WORK_START_HOUR, minute: 0 });
  while (!isBusinessDay(next, holidays)) {
    next = next.plus({ days: 1 }).set({ hour: WORK_START_HOUR, minute: 0 });
  }
  return next;
}

function adjustToWorkingHours(date: DateTime): DateTime {
  if (date.hour < WORK_START_HOUR) {
    return date.set({ hour: WORK_START_HOUR, minute: 0 });
  }
  if (date.hour >= LUNCH_START_HOUR && date.hour < LUNCH_END_HOUR) {
    return date.set({ hour: LUNCH_END_HOUR, minute: 0 });
  }
  if (date.hour >= WORK_END_HOUR) {
    return date.plus({ days: 1 }).set({ hour: WORK_START_HOUR, minute: 0 });
  }
  return date;
}

export async function addBusinessTime(
  input: BusinessTimeInput,
): Promise<BusinessTimeResult> {
  if (!input.days && !input.hours) {
    throw new Error("Debe enviar al menos uno de los parámetros: days u hours");
  }

  const holidays = await getHolidays();

  // Determinar fecha inicial en zona Colombia
  let current = input.date
    ? DateTime.fromISO(input.date, { zone: "utc" }).setZone(COLOMBIA_ZONE)
    : DateTime.now().setZone(COLOMBIA_ZONE);

  // Ajuste inicial
  while (!isBusinessDay(current, holidays)) {
    current = current
      .plus({ days: 1 })
      .set({ hour: WORK_START_HOUR, minute: 0 });
  }
  current = adjustToWorkingHours(current);

  // Convertir días y horas en minutos hábiles
  let minutesToAdd = (input.days ?? 0) * 8 * 60 + (input.hours ?? 0) * 60;

  while (minutesToAdd > 0) {
    let blockEnd = current;
    let minutesAvailable = 0;

    // Determinar bloque laboral actual (antes, durante o después del almuerzo)
    if (current.hour < LUNCH_START_HOUR) {
      blockEnd = current.set({ hour: LUNCH_START_HOUR, minute: 0 });
    } else if (current.hour >= LUNCH_END_HOUR && current.hour < WORK_END_HOUR) {
      blockEnd = current.set({ hour: WORK_END_HOUR, minute: 0 });
    } else {
      // fuera de horario -> siguiente día laboral
      current = nextBusinessDay(current, holidays);
      continue;
    }

    minutesAvailable = Math.floor(blockEnd.diff(current, "minutes").minutes);

    if (minutesToAdd <= minutesAvailable) {
      // Termina dentro del bloque actual
      current = current.plus({ minutes: minutesToAdd });
      minutesToAdd = 0;
    } else {
      // Consumir el bloque completo
      current = blockEnd;
      minutesToAdd -= minutesAvailable;

      // Saltar almuerzo si aplica
      if (current.hour === LUNCH_START_HOUR) {
        current = current.set({ hour: LUNCH_END_HOUR, minute: 0 });
      } else if (current.hour === WORK_END_HOUR) {
        current = nextBusinessDay(current, holidays);
      }
    }
  }

  const finalDate = current
    .setZone("utc")
    .toISO({ suppressMilliseconds: true });
  return { date: finalDate || "" };
}
