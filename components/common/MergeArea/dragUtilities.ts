import { Coordinates } from "./types";

/**
 * Calculates the center position of an element
 */
export function getElementCenter(element: HTMLElement): Coordinates {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

/**
 * Calculates the distance between two points
 */
export function calculateDistance(
  pointA: Coordinates,
  pointB: Coordinates
): number {
  return Math.sqrt(
    Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2)
  );
}

/**
 * Adjusts a position to ensure the element stays within the container boundaries
 */
export function adjustPositionWithinBounds(
  position: Coordinates,
  elementWidth: number,
  elementHeight: number,
  containerWidth: number,
  containerHeight: number,
  padding: number = 0
): Coordinates {
  return {
    x: Math.max(
      padding,
      Math.min(position.x, containerWidth - elementWidth - padding)
    ),
    y: Math.max(
      padding,
      Math.min(position.y, containerHeight - elementHeight - padding)
    ),
  };
}

/**
 * Creates a unique ID for new elements
 */
export function createUniqueId(baseId: string, counter: number): string {
  return `${baseId}_${Date.now()}_${counter}`;
}

/**
 * Extracts the original ID from an instance ID
 */
export function extractOriginalId(instanceId: string): string {
  // Assuming instance IDs are formatted as "originalId_timestamp_counter"
  const parts = instanceId.split("_");
  if (parts.length >= 1) {
    return parts[0];
  }
  return instanceId;
}
