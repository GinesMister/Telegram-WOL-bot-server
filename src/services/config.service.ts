import { DEFAULT_CONFIG_ROUTE_FILE } from '../constants/relative-routes.const';
import { UserConfig } from '../types/user-config.type';
import * as fs from 'fs';
import * as path from 'path';
import JSON5 from 'json5';

class ConfigService {
  private readonly configPath;
  private userConfig: UserConfig | undefined;

  constructor() {
    this.configPath = process.env.CONFIG_ROUTE_FILE || DEFAULT_CONFIG_ROUTE_FILE;
  }

  loadConfig() {
    if (!this.configPath.toLowerCase().endsWith('.json5')) {
      throw new Error(
        `The config file must be JSON5 format. File received: ${this.configPath}`,
      );
    }
    try {
      const fileContent = fs.readFileSync(
        path.join(__dirname, '/../', this.configPath),
        'utf-8',
      );
      this.userConfig = JSON5.parse(fileContent) as UserConfig;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.code === 'ENOENT')
        throw new Error(`Config file not found in this route: ${this.configPath}`, {
          cause: error,
        });
      if (error.name === 'SyntaxError')
        throw new Error(`Syntax error on config JSON5 file`, { cause: error });
      throw error;
    }

    console.log('Config loaded');
  }

  getConfig() {
    return this.userConfig;
  }
}

export default new ConfigService();
