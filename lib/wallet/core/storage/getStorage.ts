import { IndexedDBStorage } from "./indexeddb";
import IStorage from "./IStorage";

export default function getStorage(): IStorage | undefined {
  return new IndexedDBStorage();
}
