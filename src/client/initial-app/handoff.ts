const databaseName = 'vicoco-handoff';
const storeName = 'transfers';
const transferTtl = 60 * 60 * 1000;

interface ImageTransfer {
  createdAt: number;
  files: File[];
}

const openDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) {
        request.result.createObjectStore(storeName);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const transactionDone = (transaction: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });

const requestResult = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const consumeImageHandoff = async (id: string) => {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const transferPromise = requestResult<ImageTransfer | undefined>(
      store.get(id),
    );
    store.delete(id);

    const expiresBefore = Date.now() - transferTtl;
    const cursorRequest = store.openCursor();
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (!cursor) return;
      const transfer = cursor.value as Partial<ImageTransfer>;
      if (!transfer.createdAt || transfer.createdAt < expiresBefore) {
        cursor.delete();
      }
      cursor.continue();
    };

    const transfer = await transferPromise;
    await transactionDone(transaction);
    if (
      !transfer ||
      transfer.createdAt < expiresBefore ||
      !Array.isArray(transfer.files)
    ) {
      return undefined;
    }
    return transfer.files.filter((file) => file instanceof File);
  } finally {
    database.close();
  }
};
