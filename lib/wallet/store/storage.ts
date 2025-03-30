"use client";

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
  private isClient(): boolean {
    return typeof window !== "undefined";
  }

  async getItem(key: string) {
    if (!this.isClient()) return null;
    const results = localStorage.getItem(key);
    return results ?? null;
  }

  async removeItem(key: string): Promise<void> {
    if (!this.isClient()) return;
    localStorage.removeItem(key);
  }

  async setItem(key: string, item: string | null): Promise<void> {
    if (!this.isClient()) return;
    localStorage.setItem(key, item ?? "");
  }

  async clear(): Promise<void> {
    if (!this.isClient()) return;
    localStorage.clear();
  }
}

export default new ChromeStorage();
