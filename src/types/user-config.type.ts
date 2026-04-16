export interface UserConfig {
  initMessage: boolean;

  devices: Array<{
    macAddress: string;
    ipAddress: string;
    nameId: string;
    telegramUsernamesAuthorizedToWake: Array<string>;
  }>;

  restrictedCommands: Array<{
    command: string;
    allowedTelegramUsernames: Array<string>;
  }>;
}
