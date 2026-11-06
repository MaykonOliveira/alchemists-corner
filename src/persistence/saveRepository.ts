import Dexie, { type Table } from 'dexie';
import type { GameSave } from '../domain/models/types';
import { migrateSave } from './migrations';

interface SaveRow {
  slot: string;
  data: GameSave;
}

class SaveDb extends Dexie {
  saves!: Table<SaveRow, string>;
  constructor() {
    super('alchemists-corner');
    this.version(1).stores({ saves: 'slot' });
  }
}

const DEFAULT_SLOT = 'auto';
let db: SaveDb | null = null;
const getDb = () => (db ??= new SaveDb());

export const saveRepository = {
  async load(slot = DEFAULT_SLOT): Promise<GameSave | null> {
    const row = await getDb().saves.get(slot);
    return row ? migrateSave(row.data) : null;
  },
  async save(data: GameSave, slot = DEFAULT_SLOT): Promise<void> {
    await getDb().saves.put({ slot, data });
  },
  async clear(slot = DEFAULT_SLOT): Promise<void> {
    await getDb().saves.delete(slot);
  },
};
