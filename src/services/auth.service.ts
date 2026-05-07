import 'dotenv/config';
import { parseToNumericArray } from '../util/formatter.util';

/**
 * AuthService handles the security.
 * Since waking up devices on a local network (WoL) is a sensitive action,
 * this service ensures only approved users can do it.
 */
class AuthService {
  readonly authorizedTeluserIds: Array<number>;

  constructor() {
    try {
      this.authorizedTeluserIds = parseToNumericArray(
        process.env.ALLOWED_TELEGRAM_USERS_ID,
      );
    } catch (e) {
      throw new Error('Invalid env.ALLOWED_TELEGRAM_USERS_ID', { cause: e });
    }
    if (this.authorizedTeluserIds.length === 0)
      throw new Error('env.ALLOWED_TELEGRAM_USERS_ID must be informed');
  }

  /**
   * Validates if a given Telegram user is authorized to interact with the bot.
   * @param teluserId - The unique Telegram ID of the user sending the message.
   * @returns The matching user ID if authorized, or undefined if they are not allowed.
   */
  authByTeluser = (teluserId: number) => {
    return this.authorizedTeluserIds.find((n) => n === teluserId);
  };
}

// Exporting as a singleton
export default new AuthService();
