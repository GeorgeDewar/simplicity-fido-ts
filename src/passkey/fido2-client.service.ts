import { getAssertion } from './fido2-authenticator.service';
import {
  Fido2AuthenticatorGetAssertionParams,
  Fido2AuthenticatorGetAssertionResult,
} from './fido2-authenticator.service.abstraction';
import { AssertCredentialParams, AssertCredentialResult } from './fido2-client.service.abstraction';
import { Fido2Utils } from './fido2-utils';

/**
 * Bitwarden implementation of the Web Authentication API as described by W3C
 * https://www.w3.org/TR/webauthn-3/#sctn-api
 *
 * It is highly recommended that the W3C specification is used a reference when reading this code.
 */

export const assertCredential = async (params: AssertCredentialParams): Promise<AssertCredentialResult> => {
  const logger = console;

  logger.debug(`[Fido2Client] assertCredential, params: ${JSON.stringify(params)}`);

  const collectedClientData = {
    type: 'webauthn.get',
    challenge: params.challenge,
    origin: params.origin,
    crossOrigin: false,
  };
  const clientDataJSON = JSON.stringify(collectedClientData);
  const clientDataJSONBytes = Fido2Utils.fromByteStringToArray(clientDataJSON)!;

  const clientDataHash = await crypto.subtle.digest({ name: 'SHA-256' }, clientDataJSONBytes);
  const getAssertionParams = mapToGetAssertionParams({
    params,
    clientDataHash,
  });

  const getAssertionResult = await getAssertion(getAssertionParams);

  const result = generateAssertCredentialResult(getAssertionResult, clientDataJSONBytes);
  return result;
};

const generateAssertCredentialResult = (
  getAssertionResult: Fido2AuthenticatorGetAssertionResult,
  clientDataJSONBytes: Uint8Array,
): AssertCredentialResult => {
  return {
    authenticatorData: Fido2Utils.bufferToString(getAssertionResult.authenticatorData),
    clientDataJSON: Fido2Utils.bufferToString(clientDataJSONBytes),
    credentialId: Fido2Utils.bufferToString(getAssertionResult.selectedCredential.id),
    userHandle: Fido2Utils.bufferToString(getAssertionResult.selectedCredential.userHandle!),
    signature: Fido2Utils.bufferToString(getAssertionResult.signature),
  };
};

/**
 * Convert data gathered by the WebAuthn Client to a format that can be used by the authenticator.
 */
function mapToGetAssertionParams({
  params,
  clientDataHash,
}: {
  params: AssertCredentialParams;
  clientDataHash: ArrayBuffer;
}): Fido2AuthenticatorGetAssertionParams {
  return {
    rpId: params.rpId,
    hash: clientDataHash,
  };
}
