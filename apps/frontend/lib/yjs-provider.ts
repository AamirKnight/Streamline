import * as Y from 'yjs';
import { Socket } from 'socket.io-client';

export class SocketIOProvider {
  public doc: Y.Doc;
  private socket: Socket;
  private documentId: string;
  private awareness: any;

  constructor(documentId: string, doc: Y.Doc, socket: Socket) {
    this.doc = doc;
    this.socket = socket;
    this.documentId = documentId;

    this.setupListeners();
  }

  private setupListeners() {
    // Listen for updates from server
    this.socket.on('yjs:update', (update: Uint8Array) => {
      Y.applyUpdate(this.doc, new Uint8Array(update));
    });

    // Send updates to server
    this.doc.on('update', (update: Uint8Array) => {
      this.socket.emit('yjs:update', {
        documentId: this.documentId,
        update: Array.from(update),
      });
    });
  }

  destroy() {
    this.doc.off('update', () => {});
  }
}