/**
 * ストレージ管理モジュール (Storage Service)
 * ブラウザ完結型モックのため localStorage のみを用いて永続化する。
 */

export function loadFromLocalStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`LocalStorage read error for key "${key}":`, err);
    return fallback;
  }
}

export function saveToLocalStorage<T>(key: string, data: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`LocalStorage write error for key "${key}":`, err);
  }
}

export function removeFromLocalStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch (err) {
    console.warn(`LocalStorage remove error for key "${key}":`, err);
  }
}
