export interface BoxItem {
  id: string;
  instanceId?: string;
  title: string;
  emoji: string;
  left?: number;
  top?: number;
  originalId?: string;
  amount?: number;
  isFromInventory?: boolean;
  isHidden?: boolean;
  isNew?: boolean;
}

export interface InventoryItem {
  id: number;
  itemId: string;
  handle: string;
  emoji: string;
  amount: number;
  isBasic: boolean;
}

// Type for coordinates
export interface Coordinates {
  x: number;
  y: number;
}

export interface DraggedItem extends BoxItem {
  isFromInventory: boolean;
}
