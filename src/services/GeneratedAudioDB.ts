/**
 * GeneratedAudioDB - A service for storing and managing generated audio in IndexedDB.
 */

const DB_NAME = 'GeneratedAudioDB';
const STORE_NAME = 'generated_audio';
const DB_VERSION = 1;

export interface GeneratedAudio {
  id: string;
  name: string;
  data: ArrayBuffer;
  createdAt: Date;
}

let db: IDBDatabase;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject('Error opening IndexedDB');
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export const GeneratedAudioDB = {
  async saveAudio(audio: Omit<GeneratedAudio, 'createdAt'>): Promise<void> {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const newAudio: GeneratedAudio = { ...audio, createdAt: new Date() };
    store.put(newAudio);
  },

  async getAllAudio(): Promise<GeneratedAudio[]> {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      };
      request.onerror = () => {
        console.error('Error getting all audio:', request.error);
        reject('Error getting all audio');
      };
    });
  },

  async deleteAudio(id: string): Promise<void> {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        console.error('Error deleting audio:', request.error);
        reject('Error deleting audio');
      };
    });
  },

  async updateAudioName(id: string, name: string): Promise<void> {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const audio = request.result;
        if (audio) {
          audio.name = name;
          const updateRequest = store.put(audio);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => {
            console.error('Error updating audio name:', updateRequest.error);
            reject('Error updating audio name');
          };
        } else {
          reject('Audio not found');
        }
      };
      request.onerror = () => {
        console.error('Error getting audio to update:', request.error);
        reject('Error getting audio to update');
      };
    });
  },
};
