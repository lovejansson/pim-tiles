export type BroadcastChannelMessage<T> = {
    name: string,
    data: T
}

class BroadcastChannelService {
  private bc: BroadcastChannel;
  constructor(bc: BroadcastChannel) {
    this.bc = bc;
  }

  send<T>(msg: BroadcastChannelMessage<T>) {
    this.bc.postMessage(msg);
  }

  listen<T>(cb: (event: MessageEvent<BroadcastChannelMessage<T>>) => void) {
    this.bc.addEventListener("message", cb);
  }
}

export const broadcastChannelService = new BroadcastChannelService(
  new BroadcastChannel("pim-bc"),
);


// TODO: Figure out how to manage events and updates of project state since right now project state sends update events whenever stuff updates, some events needs to be fired when syncing with indexed db in other tabs
// but they will case a message loop, so it needs to be refactored. 