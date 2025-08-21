import {
  ApplicationContribution,
  inject,
  singleton,
  ConfigurationService,
} from '@difizen/libro-common/app';
import { ServerConnection, ServerManager } from '@difizen/libro-lab';

@singleton({ contrib: ApplicationContribution })
export class LibroApp implements ApplicationContribution {
  @inject(ServerConnection) serverConnection: ServerConnection;
  @inject(ServerManager) serverManager: ServerManager;
  @inject(ConfigurationService) configurationService: ConfigurationService;

  async onStart() {
    this.serverConnection.updateSettings({
      baseUrl: 'http://localhost:8888/',
      wsUrl: 'ws://localhost:8888/',
    });
    this.serverManager.launch();
  }
}
