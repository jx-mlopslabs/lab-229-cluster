import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { ConfigService } from 'src/config/config.service';
import * as jwt from 'jsonwebtoken';
import { NodesService } from './nodes.service';
import { NodeState } from 'src/types';

@WebSocketGateway({ cors: true })
export class NodesGateway {
  @WebSocketServer()
  public wsServer: Server;

  constructor(
    private configService: ConfigService,
    private nodesService: NodesService,
  ) {}

  public handleConnection(client: Socket) {
    const authToken: string = client.handshake.auth.token;
    try {
      if (this.configService.isProd()) {
        jwt.verify(
          authToken.slice(7),
          this.configService.createSecretOptions().secret,
        );
      }
    } catch (e) {
      client.emit('error', 'Not authorized!');
      client.disconnect(true);
    }

    this.emitStates(...this.nodesService.getStates());

    return client;
  }

  public emitStates(...states: NodeState[]) {
    states.forEach((state) => {
      this.wsServer.emit('node/state', state);
    });
  }

  @SubscribeMessage('node/shutdown')
  public async handleShutdown(
    @MessageBody() state: NodeState,
    @ConnectedSocket() _client: Socket,
  ): Promise<void> {
    await this.wrapAction(state, async () => {
      await this.nodesService.shutdown(state);
    });
  }

  private async wrapAction(state: NodeState, action: () => Promise<void>) {
    const beforeState = {
      ...this.nodesService.getState(state.host),
      actionPending: true,
    };
    this.nodesService.setState(beforeState);
    this.emitStates(beforeState);

    await action();

    const afterState = {
      ...this.nodesService.getState(state.host),
      actionPending: false,
    };
    this.nodesService.setState(afterState);
    this.emitStates(afterState);
  }
}
