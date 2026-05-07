export const telCommands = {
  start: 'start',
  help: 'help',
  devices: 'devices',
  wake: 'wake',
  ping: 'ping',
  debug: 'debug',
  reload: 'reload',
} as const;

export type TelCommandValue = (typeof telCommands)[keyof typeof telCommands];
export const telCommandsArray = Object.values(telCommands);
