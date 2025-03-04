export interface WebStorage {
  /**
   * @desc Fetches key and returns item in a promise.
   */
  getItem: (key: string) => Promise<string | null>;
  /**
   * @desc Sets value for key and returns item in a promise.
   */
  setItem: (key: string, item: string | null) => Promise<void>;
  /**
   * @desc Removes value for key.
   */
  removeItem: (key: string) => Promise<void>;
}

export class ChromeStorage implements WebStorage {
  async getItem(key: string) {
    const results = await localStorage.getItem(key);
    return results ?? null;
  }

  async removeItem(key: string): Promise<void> {
    return localStorage.removeItem(key);
  }

  async setItem(key: string, item: string | null): Promise<void> {
    return localStorage.setItem(key, item ?? '');
  }

  async clear() {
    return localStorage.clear();
  }
}

export default new ChromeStorage();
