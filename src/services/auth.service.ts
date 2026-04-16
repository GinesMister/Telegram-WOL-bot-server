import 'dotenv/config';
import { parseToNumericArray } from '../util/formatter.util';

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

  authByTeluser = (teluserId: number) => {
    return this.authorizedTeluserIds.find((n) => n === teluserId);
  };
}

export default new AuthService();
