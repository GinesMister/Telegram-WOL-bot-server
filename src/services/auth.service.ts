import { parseNumericArray } from '../util/formatter.util';

class AuthService {
  readonly authorizedTeluserIds: Array<number>;

  constructor() {
    try {
      this.authorizedTeluserIds = parseNumericArray(process.env.ALLOWED_USERS_ID);
    } catch (e) {
      throw new Error('Invalid env.ALLOWED_USERS_ID', { cause: e });
    }
  }

  authByTeluser = (teluserId: number) => {
    return this.authorizedTeluserIds.find((n) => n === teluserId);
  };
}

export const authService = new AuthService();
