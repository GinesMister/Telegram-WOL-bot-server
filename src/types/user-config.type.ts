export interface UserConfig {
  devices: Array<{
    macAddress: string;
    name: string;
    telegramUsersAuthorizedToWake: Array<string>;
  }>;

  restrictedCommands: Array<{
    command: string;
    allowedTelegramUsernames: Array<string>;
  }>;
}
