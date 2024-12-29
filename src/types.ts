export type Fido2Credential = {
  credentialId: string;
  keyType: "public-key";
  keyAlgorithm: "ECDSA";
  keyCurve: "P-256";
  keyValue: string;
  rpId: "simplicity.kiwi";
  userHandle: string;
  userName: string;
  counter: 0;
  rpName: string;
  userDisplayName: string;
  discoverable: "true" | "false";
  creationDate: string;
};
