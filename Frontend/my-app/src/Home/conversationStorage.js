const DATABASE_NAME = "easylearn-local-data";
const DATABASE_VERSION = 1;
const STORE_NAME = "conversations";
const ACTIVE_CONVERSATION_KEY = "active";

function openDatabase() {
  if (!globalThis.indexedDB) {
    return Promise.reject(new Error("Browser storage is unavailable."));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open browser storage."));
    request.onblocked = () => reject(new Error("Browser storage is busy in another tab."));
  });
}

function runTransaction(mode, action) {
  return openDatabase().then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    let result;

    try {
      result = action(store);
    } catch (error) {
      database.close();
      reject(error);
      return;
    }

    transaction.oncomplete = () => {
      database.close();
      resolve(result?.result);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error || new Error("Could not update browser storage."));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error || new Error("Browser storage update was interrupted."));
    };
  }));
}

export function readConversation() {
  return runTransaction("readonly", (store) => store.get(ACTIVE_CONVERSATION_KEY));
}

export function writeConversation(messages) {
  return runTransaction("readwrite", (store) => store.put({
    version: 1,
    updatedAt: new Date().toISOString(),
    messages,
  }, ACTIVE_CONVERSATION_KEY));
}

export function clearConversation() {
  return runTransaction("readwrite", (store) => store.delete(ACTIVE_CONVERSATION_KEY));
}
