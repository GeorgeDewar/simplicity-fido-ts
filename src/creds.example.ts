import { Fido2Credential } from './passkey/types';

export const simplicityTenantId = 'e768822f-b1a1-404c-a685-0e37905ca5f5';
export const baseUrl = 'https://au.api.authsignal.com/v1';

export const creds: Fido2Credential = {
  credentialId: '00000000-0000-0000-0000-000000000000',
  keyAlgorithm: 'ECDSA',
  keyCurve: 'P-256',
  keyValue: 'passkeyhere',
  rpId: 'simplicity.kiwi',
  userHandle: 'userhandlehere',
  userName: 'email@example.com',
};
