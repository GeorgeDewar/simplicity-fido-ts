export type Fido2Credential = {
  credentialId: string;
  keyAlgorithm: string;
  keyCurve: string;
  keyValue: string;
  rpId: string;
  userHandle: string;
  userName: string;
};

export type PasskeyAuthResult = {
  isVerified: boolean;
  accessToken: string;
  userId: string;
  userAuthenticatorId: string;
  username: string;
  userDisplayName: string;
};
