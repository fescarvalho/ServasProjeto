import { Mass } from "../types/types";

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * Gera link direto para adicionar a missa ao Google Calendar
 */
export function getGoogleCalendarUrl(mass: Mass, roleLabel: string): string {
  const start = new Date(mass.date);
  const end = new Date(start.getTime() + 75 * 60 * 1000); // 1h15 de duração estimada

  const title = encodeURIComponent(
    `Servir na Missa${mass.name ? ` (${mass.name})` : ""} — ${roleLabel}`
  );
  const location = encodeURIComponent(
    mass.local
      ? `${mass.local} - Santuário Diocesano Nossa Senhora da Natividade`
      : "Santuário Diocesano Nossa Senhora da Natividade"
  );
  const details = encodeURIComponent(
    `Escala do Grupo de Servos e Servas Santa Terezinha.\nFunção: ${roleLabel}\nChegar com 20 minutos de antecedência na sacristia.`
  );

  const dates = `${formatICSDate(start)}/${formatICSDate(end)}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

/**
 * Faz o download de um arquivo .ics (compatível com iOS/Apple Calendar, Android e Outlook)
 * já configurado com alarme 1 hora antes da missa.
 */
export function downloadMassICS(mass: Mass, roleLabel: string): void {
  const start = new Date(mass.date);
  const end = new Date(start.getTime() + 75 * 60 * 1000);
  const now = new Date();

  const summary = `Servir na Missa${mass.name ? ` (${mass.name})` : ""} - ${roleLabel}`;
  const location = mass.local
    ? `${mass.local} - Santuario Diocesano N. Sra. da Natividade`
    : "Santuario Diocesano N. Sra. da Natividade";
  const description = `Escala de Servos e Servas do Altar.\\nFuncao: ${roleLabel}.\\nLembre-se de chegar com 20 minutos de antecedencia.`;

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Servos do Altar//Escalas//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:mass-${mass.id}@servasdoaltar.vercel.app`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(start)}`,
    `DTEND:${formatICSDate(end)}`,
    `SUMMARY:${summary}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT60M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Lembrete: Voce serve na Santa Missa em 1 hora!",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const dayStr = start.toISOString().split("T")[0];
  link.setAttribute("download", `escala-missa-${dayStr}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

