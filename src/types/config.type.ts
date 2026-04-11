export interface DeviceConfig {
  devices: Array<{
    macAddress: string;
    name: string;
    telegramUsersAuthorizedToWake: Array<string>;
  }>;
}
