// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { Fido2Utils } from './fido2-utils';
import { guidToRawFormat } from './guid-utils';

export function parseCredentialId(encodedCredentialId: string): Uint8Array | undefined {
  try {
    if (encodedCredentialId.startsWith('b64.')) {
      return Fido2Utils.stringToBuffer(encodedCredentialId.slice(4));
    }

    return guidToRawFormat(encodedCredentialId);
  } catch {
    return undefined;
  }
}
