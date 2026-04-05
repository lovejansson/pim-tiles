

class BroadcastChannelService {
  private bc: BroadcastChannel;
  constructor(bc: BroadcastChannel) {
    this.bc = bc;
  }

  send(msg: string) {
    this.bc.postMessage(msg);
  }

  listen(cb: (event: MessageEvent<string>) => void) {
    this.bc.addEventListener("message", cb);
  }
}

export const broadcastChannelService = new BroadcastChannelService(
  new BroadcastChannel("pim-bc"),
);
