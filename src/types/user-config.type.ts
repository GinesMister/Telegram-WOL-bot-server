export interface UserConfig {
  initMessage: string;
  notificationWhenDeviceIsOn: boolean;

  devices: Array<{
    macAddress: string;
    ipAddress: string;
    nameId: string;
    telegramUsernamesAuthorizedToWake: Array<string>;
  }>;

  restrictedCommands: Array<{
    command: string;
    cooldownSecs: number;
    allowedTelegramUsernames: Array<string>;
  }>;
}
