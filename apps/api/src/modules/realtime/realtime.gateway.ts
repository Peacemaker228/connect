import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

import { AppLoggerService } from '../../common/logger/app-logger.service';

@WebSocketGateway({
  namespace: 'realtime',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly logger: AppLoggerService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Realtime client connected: ${client.id}`, RealtimeGateway.name);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Realtime client disconnected: ${client.id}`, RealtimeGateway.name);
  }
}
