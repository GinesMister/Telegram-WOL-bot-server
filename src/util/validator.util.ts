export const validateMacAddress = (macAddress: string): boolean => {
  if (!macAddress) return false;
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(macAddress);
};

export const validateIpAddress = (ipAddress: string): boolean => {
  if (!ipAddress) return false;
  const parts = ipAddress.split('.');

  if (parts.length !== 4) {
    return false;
  }

  return parts.every((part) => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255 && part === num.toString();
  });
};

export const validateUniqueValues = <T>(values: T[]): boolean => {
  return new Set(values).size === values.length;
};

export const validateTelegramUsername = (username: string): boolean => {
  if (!username) return false;
  if (username === 'all') {
    return true;
  }
  return username.startsWith('@') && username.length > 1 && !username.includes(' ');
};

export const validateTelegramCommand = (command: string): boolean => {
  if (!command) return false;
  const commandRegex = /^\/\S+$/;
  return commandRegex.test(command);
};
