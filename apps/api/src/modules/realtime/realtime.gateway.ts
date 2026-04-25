import {
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { AppLoggerService } from '../../common/logger/app-logger.service';
import type { RealtimeEvent } from './realtime.events';

@WebSocketGateway({
  namespace: 'realtime',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server?: Server;

  constructor(private readonly logger: AppLoggerService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Realtime client connected: ${client.id}`, RealtimeGateway.name);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Realtime client disconnected: ${client.id}`, RealtimeGateway.name);
  }

  emit<TPayload>(event: RealtimeEvent<TPayload>) {
    this.server?.emit(event.key, event.payload);
  }
}
