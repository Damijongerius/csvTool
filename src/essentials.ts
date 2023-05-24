
export class Essentials {
    authKey: string;
    identityProvider: number;

    public successfullUsers: any[];
    public conflictedUsers: any[];

    constructor(authKey: string, identityProvider: number) {
        this.authKey = authKey;
        this.identityProvider = identityProvider;
      }
  }