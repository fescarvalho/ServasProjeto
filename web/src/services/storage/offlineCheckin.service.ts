import { selfCheckIn } from "../api/signup.service";

const OFFLINE_CHECKIN_QUEUE_KEY = "servas_offline_checkin_queue_v1";
const SANTUARIO_LAT = -21.0422;
const SANTUARIO_LNG = -41.9732;
const MAX_DISTANCE_METERS = 300;

export interface OfflineCheckinItem {
  signupId: string;
  token: string;
  lat: number;
  lng: number;
  scannedAt: string;
  massName?: string;
}

export function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isWithinSantuarioRadius(lat: number, lng: number): boolean {
  return getDistanceMeters(lat, lng, SANTUARIO_LAT, SANTUARIO_LNG) <= MAX_DISTANCE_METERS;
}

export function getOfflineCheckinQueue(): OfflineCheckinItem[] {
  try {
    const raw = localStorage.getItem(OFFLINE_CHECKIN_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveOfflineCheckinQueue(items: OfflineCheckinItem[]): void {
  try {
    localStorage.setItem(OFFLINE_CHECKIN_QUEUE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage quota errors
  }
}

export function hasPendingOfflineCheckin(signupId: string): boolean {
  return getOfflineCheckinQueue().some((item) => item.signupId === signupId);
}

export function enqueueOfflineCheckin(item: OfflineCheckinItem): void {
  const current = getOfflineCheckinQueue();
  const filtered = current.filter((x) => x.signupId !== item.signupId);
  filtered.push(item);
  saveOfflineCheckinQueue(filtered);
}

/**
 * Tenta sincronizar todos os check-ins pendentes salvos em modo offline.
 */
export async function syncOfflineCheckins(): Promise<{ syncedCount: number; failedMessages: string[] }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { syncedCount: 0, failedMessages: [] };
  }

  const queue = getOfflineCheckinQueue();
  if (queue.length === 0) {
    return { syncedCount: 0, failedMessages: [] };
  }

  let syncedCount = 0;
  const remaining: OfflineCheckinItem[] = [];
  const failedMessages: string[] = [];

  for (const item of queue) {
    try {
      await selfCheckIn(item.signupId, item.token, item.lat, item.lng, item.scannedAt);
      syncedCount += 1;
    } catch (err: any) {
      if (!err?.response) {
        // Ainda sem conexão com o servidor: mantém na fila
        remaining.push(item);
      } else {
        // Erro definitivo do servidor (ex: 400 fora do raio/horário ou 401/403): descarta e informa
        const msg = err?.response?.data?.error || "Erro ao sincronizar check-in offline.";
        failedMessages.push(msg);
      }
    }
  }

  saveOfflineCheckinQueue(remaining);
  return { syncedCount, failedMessages };
}
