import { parseCredentialId } from './credential-id-utils';
import { creds } from '../creds';
import { p1363ToDer } from './ecdsa-utils';
import { Fido2Utils } from './fido2-utils';
import { Fido2Credential } from './types';
import {
  Fido2AuthenticatorGetAssertionParams,
  Fido2AuthenticatorGetAssertionResult,
} from './fido2-authenticator.service.abstraction';

const logger = console;

const KeyUsages: KeyUsage[] = ['sign'];

export const getAssertion = async (
  params: Fido2AuthenticatorGetAssertionParams,
): Promise<Fido2AuthenticatorGetAssertionResult> => {
  const selectedFido2Credential = creds;

  const selectedCredentialId = selectedFido2Credential.credentialId;

  const authenticatorData = await generateAuthData({
    rpId: selectedFido2Credential.rpId,
    credentialId: parseCredentialId(selectedCredentialId)!,
  });

  const signature = await generateSignature({
    authData: authenticatorData,
    clientDataHash: params.hash,
    privateKey: await getPrivateKeyFromFido2Credential(selectedFido2Credential),
  });

  return {
    authenticatorData,
    selectedCredential: {
      id: parseCredentialId(selectedCredentialId)!,
      userHandle: Fido2Utils.stringToBuffer(selectedFido2Credential.userHandle),
    },
    signature,
  };
};

async function getPrivateKeyFromFido2Credential(fido2Credential: Fido2Credential): Promise<CryptoKey> {
  const keyBuffer = Fido2Utils.stringToBuffer(fido2Credential.keyValue);
  return await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    {
      name: fido2Credential.keyAlgorithm,
      namedCurve: fido2Credential.keyCurve,
    } as EcKeyImportParams,
    true,
    KeyUsages,
  );
}

interface AuthDataParams {
  rpId: string;
  credentialId: BufferSource;
}

async function generateAuthData(params: AuthDataParams) {
  const authData: Array<number> = [];

  const rpIdHash = new Uint8Array(
    await crypto.subtle.digest({ name: 'SHA-256' }, Fido2Utils.fromByteStringToArray(params.rpId)!),
  );
  authData.push(...rpIdHash);

  const flags = authDataFlags({
    extensionData: false,
    attestationData: false,
    backupEligibility: true,
    backupState: true, // Credentials are always synced
    userVerification: true, // Pretend user verification was completed
    userPresence: true, // Pretend user presence was confirmed
  });
  authData.push(flags);

  // add 4 bytes of counter - always zero as we don't support a counter
  authData.push(0, 0, 0, 0);

  return new Uint8Array(authData);
}

interface SignatureParams {
  authData: Uint8Array;
  clientDataHash: BufferSource;
  privateKey: CryptoKey;
}

async function generateSignature(params: SignatureParams) {
  const sigBase = new Uint8Array([...params.authData, ...Fido2Utils.bufferSourceToUint8Array(params.clientDataHash)]);
  const p1363_signature = new Uint8Array(
    await crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' },
      },
      params.privateKey,
      sigBase,
    ),
  );

  const asn1Der_signature = p1363ToDer(p1363_signature);

  return asn1Der_signature;
}

interface Flags {
  extensionData: boolean;
  attestationData: boolean;
  backupEligibility: boolean;
  backupState: boolean;
  userVerification: boolean;
  userPresence: boolean;
}

function authDataFlags(options: Flags): number {
  let flags = 0;

  if (options.extensionData) {
    flags |= 0b1000000;
  }

  if (options.attestationData) {
    flags |= 0b01000000;
  }

  if (options.backupEligibility) {
    flags |= 0b00001000;
  }

  if (options.backupState) {
    flags |= 0b00010000;
  }

  if (options.userVerification) {
    flags |= 0b00000100;
  }

  if (options.userPresence) {
    flags |= 0b00000001;
  }

  return flags;
}
