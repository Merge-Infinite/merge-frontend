import {
  MouseSensor as LibMouseSensor,
  TouchSensor as LibTouchSensor,
} from "@dnd-kit/core";
import type { MouseEvent, TouchEvent } from "react";

/**
 * Custom MouseSensor that prevents dragging when right-clicking or when clicking on specified elements
 */
export class CustomMouseSensor extends LibMouseSensor {
  static activators = [
    {
      eventName: "mousedown" as const,
      handler: ({ nativeEvent: event }: MouseEvent): boolean => {
        // Prevent right clicks and clicks on specified elements from being captured
        if (
          event.button !== 0 ||
          (event.target instanceof HTMLElement &&
            (event.target.dataset.nodrag !== undefined ||
              event.target.closest("[data-nodrag]")))
        ) {
          return false;
        }

        return true;
      },
    },
  ];
}

/**
 * Custom TouchSensor that prevents dragging when touching specified elements
 */
export class CustomTouchSensor extends LibTouchSensor {
  static activators = [
    {
      eventName: "touchstart" as const,
      handler: ({ nativeEvent: event }: TouchEvent): boolean => {
        // Prevent touches on specified elements from being captured
        if (
          event.target instanceof HTMLElement &&
          (event.target.dataset.nodrag !== undefined ||
            event.target.closest("[data-nodrag]"))
        ) {
          return false;
        }

        return true;
      },
    },
  ];
}
