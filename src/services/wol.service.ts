import wol from 'wake_on_lan';
import ping from 'ping';

class WolService {
  async wakeDevice(macAddress: string): Promise<void> {
    return new Promise((resolve, reject) => {
      wol.wake(macAddress, (error) => {
        if (error) {
          reject(
            new Error(
              `[WolService]: Error sending WoL to '${macAddress}': ${error.message}`,
            ),
          );
        } else {
          resolve();
        }
      });
    });
  }

  async isDeviceAwake(ipAddress: string): Promise<boolean> {
    if (!ipAddress) return false;
    try {
      const res = await ping.promise.probe(ipAddress, {
        timeout: 2,
      });
      return res.alive;
    } catch (error) {
      console.error(`[WolService]: Error pinging to ${ipAddress}:`, error);
      return false;
    }
  }
}

export default new WolService();
