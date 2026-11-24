import { uploadMassPhoto } from "../api/mass.service";

const OFFLINE_PHOTO_QUEUE_KEY = "servas_offline_photo_queue_v1";

export interface OfflinePhotoItem {
  massId: string;
  userId: string;
  userName: string;
  imageDataUrl: string;
  capturedAt: string;
  massLabel?: string;
}

let isSyncingQueue = false;

function readAllQueueItems(): OfflinePhotoItem[] {
  try {
    const raw = localStorage.getItem(OFFLINE_PHOTO_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAllQueueItems(items: OfflinePhotoItem[]): boolean {
  try {
    localStorage.setItem(OFFLINE_PHOTO_QUEUE_KEY, JSON.stringify(items));
    return true;
  } catch {
    // Se faltar espaço no armazenamento do navegador, tenta liberar removendo o item mais antigo
    if (items.length > 1) {
      try {
        localStorage.setItem(OFFLINE_PHOTO_QUEUE_KEY, JSON.stringify(items.slice(1)));
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

export function getOfflinePhotoQueue(userId?: string): OfflinePhotoItem[] {
  const all = readAllQueueItems();
  if (!userId) return all;
  return all.filter((item) => item.userId === userId);
}

export function getOfflinePhotoForMass(massId: string, userId?: string): OfflinePhotoItem | undefined {
  return readAllQueueItems().find(
    (item) => item.massId === massId && (!userId || item.userId === userId)
  );
}

export function enqueueOfflinePhoto(item: OfflinePhotoItem): boolean {
  const current = readAllQueueItems();
  const filtered = current.filter(
    (x) => !(x.massId === item.massId && x.userId === item.userId)
  );
  filtered.push(item);
  return writeAllQueueItems(filtered);
}

export function removeOfflinePhoto(massId: string, userId?: string): void {
  const current = readAllQueueItems();
  const next = current.filter(
    (x) => !(x.massId === massId && (!userId || x.userId === userId))
  );
  writeAllQueueItems(next);
}

/**
 * Tenta enviar todas as fotos da equipe salvas offline para o servidor assim que houver conexão.
 */
export async function syncOfflinePhotos(userId?: string): Promise<{
  syncedCount: number;
  failedMessages: string[];
  remainingCount: number;
}> {
  const userItems = getOfflinePhotoQueue(userId);
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { syncedCount: 0, failedMessages: [], remainingCount: userItems.length };
  }

  if (userItems.length === 0 || isSyncingQueue) {
    return { syncedCount: 0, failedMessages: [], remainingCount: userItems.length };
  }

  isSyncingQueue = true;
  let syncedCount = 0;
  const failedMessages: string[] = [];

  try {
    for (const item of userItems) {
      try {
        await uploadMassPhoto(item.massId, item.imageDataUrl, item.capturedAt);
        removeOfflinePhoto(item.massId, item.userId);
        syncedCount += 1;
      } catch (err: any) {
        const status = err?.response?.status;
        if (!err?.response || status >= 500 || status === 401) {
          // Sem internet, oscilação de rede, erro temporário do servidor ou sessão expirada: mantém na fila
        } else {
          // Rejeição definitiva de regra de negócio (400/403/404): remove da fila e reporta o motivo
          removeOfflinePhoto(item.massId, item.userId);
          const msg = err?.response?.data?.error || "Não foi possível enviar a foto salva offline.";
          failedMessages.push(msg);
        }
      }
    }
  } finally {
    isSyncingQueue = false;
  }

  return {
    syncedCount,
    failedMessages,
    remainingCount: getOfflinePhotoQueue(userId).length,
  };
}
