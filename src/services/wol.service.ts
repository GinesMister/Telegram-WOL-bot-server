import wol from 'wake_on_lan';
import ping from 'ping';

/**
 * WolService is the core hardware-level execution layer.
 * It is responsible for sending the actual UDP broadcast packets (Magic Packets)
 * over the local network and verifying if a machine is responding via ICMP (ping).
 */
class WolService {
  /**
   * Broadcasts a Wake-on-LAN "magic packet" to the local network.
   * @param macAddress - The physical hardware address of the target network card.
   * @returns A Promise that resolves when the packet is successfully sent out.
   */
  async wakeDevice(macAddress: string): Promise<void> {
    return new Promise((resolve, reject) => {
      wol.wake(macAddress, (error) => {
        if (error) {
          reject(
            new Error(
              `[WolService] Error sending WoL to '${macAddress}': ${error.message}`,
            ),
          );
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Pings a specific IP address to check if the machine is currently online.
   * This is highly useful for confirming if a `wakeDevice` call was successful,
   * or letting users check the status of a machine before trying to wake it.
   * @param ipAddress - The local IP address of the target machine.
   * @returns A boolean: true if the device responds to ping, false otherwise.
   */
  async isDeviceAwake(ipAddress: string): Promise<boolean> {
    if (!ipAddress) return false;
    try {
      const res = await ping.promise.probe(ipAddress, {
        timeout: 2,
      });
      return res.alive;
    } catch (error) {
      console.error(`[WolService] Error pinging to ${ipAddress}:`, error);
      return false;
    }
  }
}

// Export as a singleton
export default new WolService();
