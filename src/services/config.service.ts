import 'dotenv/config';
import { DEFAULT_CONFIG_ROUTE_FILE } from '../constants/relative-routes.const';
import { UserConfig } from '../types/user-config.type';
import * as fs from 'fs';
import * as path from 'path';
import JSON5 from 'json5';
import {
  validateIpAddress,
  validateMacAddress,
  validateTelegramCommand,
  validateTelegramUsername,
  validateUniqueValues,
} from '../util/validator.util';

class ConfigService {
  private readonly configPath;
  private readonly configFileName;
  private readonly baseConfigValidationErrMsg;
  private userConfig: UserConfig | undefined;

  constructor() {
    this.configPath = process.env.CONFIG_ROUTE_FILE || DEFAULT_CONFIG_ROUTE_FILE;
    this.configFileName = this.configPath.split('/').pop();
    this.baseConfigValidationErrMsg = `Validation ${this.configFileName}:`;
  }

  loadConfig() {
    if (!this.configPath.toLowerCase().endsWith('.json5')) {
      throw new Error(
        `${this.baseConfigValidationErrMsg} The config file must be JSON5 format. File received: ${this.configFileName}`,
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
        throw new Error(
          `${this.baseConfigValidationErrMsg} Config file not found in this route: ${this.configPath}`,
          {
            cause: error,
          },
        );
      if (error.name === 'SyntaxError')
        throw new Error(
          `${this.baseConfigValidationErrMsg} Syntax error on config JSON5 file`,
          { cause: error },
        );
      throw error;
    }
    this.validateConfig();

    console.log('Config loaded');
  }

  private validateConfig() {
    if (!this.userConfig)
      throw new Error(
        '${this.baseConfigValidationErrMsg} Config is not loaded for validation',
      );

    // Devices
    if (!validateUniqueValues(this.userConfig.devices.map((d) => d.nameId)))
      throw new Error(
        `${this.baseConfigValidationErrMsg} nameId of devices must be uniques`,
      );
    for (const device of this.userConfig.devices) {
      if (!device.nameId || device.nameId === '')
        throw new Error(
          `${this.baseConfigValidationErrMsg} devices.nameId cannot be empty`,
        );
      if (!validateMacAddress(device.macAddress))
        throw new Error(
          `${this.baseConfigValidationErrMsg} devices.macAddress '${device.macAddress ?? ''}' not valid or missing. Valid formats: '00:1a:2b:3c:4d:5e' or '00-1a-2b-3c-4d-5e'`,
        );
      if (device.ipAddress && !validateIpAddress(device.ipAddress))
        throw new Error(
          `${this.baseConfigValidationErrMsg} devices.ipAddress '${device.ipAddress ?? ''}' not valid or missing. Valid example: '192.168.1.53'`,
        );
      for (const username of device.telegramUsernamesAuthorizedToWake) {
        if (!validateTelegramUsername(username))
          throw new Error(
            `${this.baseConfigValidationErrMsg} devices.telegramUsernamesAuthorizedToWake '${username ?? ''}' not valid or missing. It must be 'all' or starts with '@'`,
          );
      }
    }

    // Restricted commands
    if (this.userConfig.restrictedCommands)
      for (const restrictedCommand of this.userConfig.restrictedCommands) {
        if (!validateTelegramCommand(restrictedCommand.command))
          throw new Error(
            `${this.baseConfigValidationErrMsg} restrictedCommands.command '${restrictedCommand.command}' not valid or missing. It must starts with '/', with no whitespaces`,
          );
        for (const username of restrictedCommand.allowedTelegramUsernames) {
          if (!validateTelegramUsername(username))
            throw new Error(
              `${this.baseConfigValidationErrMsg} restrictedCommands.allowedTelegramUsernames '${username}' not valid or missing. It must be 'all' or starts with '@'`,
            );
        }
      }
  }

  getConfig(): UserConfig {
    if (!this.userConfig)
      throw Error(`Cannot access the config because it is not loaded yet`);
    return this.userConfig;
  }
}

export default new ConfigService();
