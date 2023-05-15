
export class Essentials {
    authKey: string;
    identityProvider: number;

    constructor(authKey: string, identityProvider: number) {
        this.authKey = authKey;
        this.identityProvider = identityProvider;
      }
  }