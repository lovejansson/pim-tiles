import {
  projectState,
  projectStateEvents,
  ProjectStateEventType,
} from "./projectState.svelte";
import type { HistoryEntry, HistoryStackPop } from "./types";

export const HistoryStack = (() => {
  // History management
  // Each action consists of two entries, the previous state and the next state after the action
  // When undoing, currIdx is first decremented once to move to the precious state which is repainted, then it is moved once more to get to the "next" of the previous state.
  // When redoing, we increment the currIdx by two to point to the next action and repaint that state
  // The stack listens to project state change events to build the history via the projectStateChangeEvents emitter

  let history: HistoryEntry[] = [];
  let currIdx = -1;

  projectStateEvents.on(ProjectStateEventType.PAINT, (e) => {
    if (currIdx !== history.length - 1) {
      history.splice(currIdx + 1);
    }

    history.push(e.detail.prev);
    history.push(e.detail.next);

    // History stack limit since it is wasteful to store too large history stacks, user's don't need to go back to far usually anyway
    const MAX_ACTIONS = 250;
    if (history.length > MAX_ACTIONS * 2) {
      const excess = history.length - MAX_ACTIONS * 2;
      history.splice(0, excess);
    }

    currIdx = history.length - 1;
  });

  projectStateEvents.on(ProjectStateEventType.LAYERS_UPDATE, () => {
    const hasEntriesForDeletedLayers =
      history.find((e) => projectState.getLayerSafe(e.layerId) === null) !==
      undefined;
    if (!hasEntriesForDeletedLayers) return;

    let nextCurrIdx = currIdx;
    let nextCurrEntry = history[nextCurrIdx];

    while (
      projectState.getLayerSafe(nextCurrEntry.layerId) === null &&
      nextCurrIdx > 0
    ) {
      --nextCurrIdx;
      nextCurrEntry = history[nextCurrIdx];
    }

    history = history.filter(
      (e) => projectState.getLayerSafe(e.layerId) !== null,
    );

    if (history.length === 0) {
      currIdx = -1;
    } else {
      currIdx = history.findIndex((e) => e.id === nextCurrEntry.id);

      if (currIdx === -1)
        throw new Error("currId should be able to be -1 here");
    }
  });

  const repaint = (): HistoryEntry => {
    const entry = history.at(currIdx);
    if (entry === undefined) throw new Error("History corrupted");

    for (const i of entry.items) {
      projectState.setTile(entry.layerId, i.pos.row, i.pos.col, i.data);
    }

    return entry;
  };

  return {
    undo(): HistoryStackPop | null {
      if (currIdx <= 0) return null;
      const curr = history[currIdx];
      currIdx--; // First repaint what was previously done
      const entry = repaint();
      currIdx--; // Move to the previous state
      return { curr: entry, prev: curr } as HistoryStackPop;
    },

    redo(): HistoryStackPop | null {
      if (currIdx === history.length - 1) return null;
      const curr = history[currIdx];
      currIdx += 2; // Advance by two to redo the next action
      const entry = repaint();
      return { curr: entry, prev: curr } as HistoryStackPop;
    },
  };
})();
