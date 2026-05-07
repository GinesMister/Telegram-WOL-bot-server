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
import { telCommandsArray } from '../constants/tel-commands.const';

/**
 * ConfigService acts as the central source of truth for the bot's configuration.
 * It handles locating the config file, parsing JSON5 (which allows human-friendly
 * features like comments), and rigorously validating network and user data.
 */
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

  /**
   * Reads the configuration file from the filesystem and parses it.
   * Fails fast and throws descriptive errors if the file is missing or malformed.
   */
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
          `${this.baseConfigValidationErrMsg} Config file not found in this route (from index.js): ${this.configPath}`,
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

    console.log('[ConfigService] Config loaded');
  }

  /**
   * It does the same than `loadConfig`, but it rollbacks the saved config
   * if it was an error.
   * @throws the error it occurred. Recommended to be controlled
   */
  reloadConfig() {
    if (!this.userConfig)
      throw new Error('Can not reload config because config is not loaded yet');

    console.log('[ConfigService] Reloading config...');
    const safeConfig = this.userConfig;
    try {
      this.loadConfig();
    } catch (error) {
      console.error('Error occurred while loading new config:', error);
      this.userConfig = safeConfig;
      throw error;
    }
  }

  /**
   * Internal method to verify that all provided MACs, IPs, Usernames, and Commands
   * are correctly formatted. Prevents the bot from trying to wake invalid targets.
   */
  private validateConfig() {
    if (!this.userConfig)
      throw new Error(
        '${this.baseConfigValidationErrMsg} Config is not loaded for validation',
      );

    // --- Device Validation ---

    // Ensure no two devices share the same ID, preventing command conflicts
    for (const nameId of this.userConfig.devices.map((d) => d.nameId)) {
      if (nameId.trim() !== nameId)
        throw new Error(
          `${this.baseConfigValidationErrMsg} nameId must not contain whitespaces`,
        );
    }
    if (
      !validateUniqueValues(
        this.userConfig.devices.map((d) => d.nameId.toLocaleLowerCase()),
      )
    )
      throw new Error(
        `${this.baseConfigValidationErrMsg} nameId of devices must be uniques`,
      );
    for (const device of this.userConfig.devices) {
      if (!device.nameId || device.nameId === '')
        throw new Error(
          `${this.baseConfigValidationErrMsg} devices.nameId cannot be empty`,
        );

      // MAC address is strictly required for Wake-on-LAN to function
      if (!validateMacAddress(device.macAddress))
        throw new Error(
          `${this.baseConfigValidationErrMsg} devices.macAddress '${device.macAddress ?? ''}' not valid or missing. Valid formats: '00:1a:2b:3c:4d:5e' or '00-1a-2b-3c-4d-5e'`,
        );

      // IP address is optional (will be used to ping), but if provided, must be valid
      if (device.ipAddress && !validateIpAddress(device.ipAddress))
        throw new Error(
          `${this.baseConfigValidationErrMsg} devices.ipAddress '${device.ipAddress ?? ''}' not valid. Valid example: '192.168.1.53'`,
        );

      // Check that the usernames allowed to wake this specific device are correctly formatted
      for (const username of device.telegramUsernamesAuthorizedToWake) {
        if (!validateTelegramUsername(username))
          throw new Error(
            `${this.baseConfigValidationErrMsg} devices.telegramUsernamesAuthorizedToWake '${username ?? ''}' not valid or missing. It must be 'all' or starts with '@'`,
          );
      }
    }

    // --- Restricted commands ---

    if (this.userConfig.restrictedCommands)
      for (const restrictedCommand of this.userConfig.restrictedCommands) {
        if (!validateTelegramCommand(restrictedCommand.command))
          throw new Error(
            `${this.baseConfigValidationErrMsg} restrictedCommands.command '${restrictedCommand.command}' not valid or missing. It must starts with '/', with no whitespaces`,
          );
        for (const username of restrictedCommand.allowedTelegramUsernames) {
          if (username !== '' && !validateTelegramUsername(username))
            throw new Error(
              `${this.baseConfigValidationErrMsg} restrictedCommands.allowedTelegramUsernames '${username}' not valid or missing. It must be 'all' or starts with '@'`,
            );
        }
      }
  }

  /**
   * Safely retrieves the user config, ensuring it isn't accessed before initialization.
   */
  getConfig(): UserConfig {
    if (!this.userConfig)
      throw Error(`Cannot access the config because it is not loaded yet`);
    return this.userConfig;
  }

  /**
   * Filters the device list, returning only the machines the given Telegram user
   * has permission to interact with.
   * @param telUsername - The Telegram username (without the @)
   */
  getDevicesByAuthorizedTelUsername(telUsername: string | undefined) {
    if (!telUsername) return [];
    return this.getConfig().devices.filter(
      (d) =>
        d.telegramUsernamesAuthorizedToWake.includes(`@${telUsername}`) ||
        d.telegramUsernamesAuthorizedToWake.includes('all'),
    );
  }

  /**
   * Determines which bot commands the specific user is permitted to use,
   * factoring in any restricted command overrides in the configuration.
   * @param telUsername - The Telegram username (without the @)
   */
  getCommandsAllowedByTelUsername(telUsername: string | undefined): Array<string> {
    if (!telUsername) return [];
    const notAllowedCommands = this.getConfig()
      .restrictedCommands.filter(
        (c) =>
          !c.allowedTelegramUsernames.includes(`@${telUsername}`) &&
          !c.allowedTelegramUsernames.includes('all'),
      )
      .map((c) => c.command.split(' ').at(0)?.substring(1))
      .filter((c) => c !== 'start');
    const allowedCommands = [];
    for (const command of telCommandsArray) {
      if (!notAllowedCommands.includes(command)) allowedCommands.push(command);
    }

    return allowedCommands;
  }
}

export default new ConfigService();
