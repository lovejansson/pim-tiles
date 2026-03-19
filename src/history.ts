import {
  projectState,
  projectStateEvents,
  ProjectStateEventType,
} from "./projectState.svelte";
import type { HistoryEntry } from "./types";

export const HistoryStack = (() => {
  // History management
  // Each action consists of two entries, the previous state and the next state after the action
  // When undoing, currIdx is first decremented once to move to the precious state which is repainted, then it is moved once more to get to the "next" of the previous state.
  // When redoing, we increment the currIdx by two to point to the next action and repaint that state
  // The stack listens to project state change events to build the history via the projectStateChangeEvents emitter

  const history: HistoryEntry[] = [];
  let currIdx = -1;

  projectStateEvents.on(ProjectStateEventType.PAINT, (e) => {
    if (currIdx !== history.length - 1) {
      history.splice(currIdx + 1);
    }

    history.push(e.detail.prev);
    history.push(e.detail.next);

    currIdx = history.length - 1;
  });

  const repaint = () => {
    const entry = history[currIdx];

    if (!entry) return;

    for (const i of entry.items) {
      projectState.setTile(entry.layerId, i.pos.row, i.pos.col, i.data);
    }
    return entry.items.map((i) => i.pos);
  };

  return {
    undo() {
      if (currIdx <= 0) return;
      currIdx--; // First repaint what was previously done
      const tiles = repaint();
      currIdx--; // Move to the previous state
      return tiles;
    },

    redo() {
      if (currIdx === history.length - 1) return;
      currIdx += 2; // Advance by two to redo the next action
      const tiles = repaint();
      return tiles;
    },
  };
})();
