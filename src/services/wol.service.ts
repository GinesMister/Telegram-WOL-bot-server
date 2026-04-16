import wol from 'wake_on_lan';
import find from 'local-devices';
import ping from 'ping';

class WolService {
  wakeDevice(macAddress: string): Promise<void> {
    return new Promise((resolve, reject) => {
      wol.wake(macAddress, (error) => {
        if (error) {
          reject(new Error(`Error al enviar WoL a ${macAddress}: ${error.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * FASE 1: Sincronización (Escaneo ARP temporal)
   * Busca en la red local la IP asociada a una MAC.
   */
  async syncMacWithIp(
    macAddress: string,
    maxAttempts = 12,
    delayMs = 5000,
  ): Promise<string | null> {
    const macLower = macAddress.toLowerCase();

    for (let i = 1; i <= maxAttempts; i++) {
      console.log(
        `[Sync] Buscando IP para MAC ${macLower} (Intento ${i}/${maxAttempts})...`,
      );

      const devices = await find();
      const target = devices.find((d) => d.mac.toLowerCase() === macLower);

      if (target) {
        console.log(`[Sync] ¡Éxito! MAC ${macLower} asociada a la IP ${target.ip}`);
        return target.ip;
      }

      if (i < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    console.log(`[Sync] Fallo: No se encontró la MAC ${macLower} en la red.`);
    return null;
  }

  /**
   * FASE 2: Comprobación Ligera
   * Usa un ping ICMP estándar a la IP para ver si el equipo responde.
   */
  async isDeviceAwake(ipAddress: string): Promise<boolean> {
    if (!ipAddress) return false;

    try {
      const res = await ping.promise.probe(ipAddress, {
        timeout: 2, // Espera máxima de 2 segundos para la respuesta
      });
      return res.alive;
    } catch (error) {
      console.error(`Error al hacer ping a ${ipAddress}:`, error);
      return false;
    }
  }
}

export default new WolService();
