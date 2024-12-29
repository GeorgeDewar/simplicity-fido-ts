import { parseCredentialId } from "./credential-id-utils";
import { creds } from "../creds";
import { p1363ToDer } from "./ecdsa-utils";
import { Fido2Utils } from "./fido2-utils";
import { Fido2AuthenticatorError, Fido2AuthenticatorErrorCode, Fido2AuthenticatorGetAssertionParams, Fido2AuthenticatorGetAssertionResult, Fido2Credential } from "./types";

const logger = console;

// AAGUID: d548826e-79b4-db40-a3d8-11116f7e8349
export const AAGUID = new Uint8Array([
  0xd5, 0x48, 0x82, 0x6e, 0x79, 0xb4, 0xdb, 0x40, 0xa3, 0xd8, 0x11, 0x11, 0x6f, 0x7e, 0x83, 0x49,
]);

const KeyUsages: KeyUsage[] = ["sign"];

export const getAssertion = async (
    params: Fido2AuthenticatorGetAssertionParams,
  ): Promise<Fido2AuthenticatorGetAssertionResult> => {
    
    try {
      const selectedFido2Credential = creds;

      try {
        const selectedCredentialId = selectedFido2Credential.credentialId;

        const authenticatorData = await generateAuthData({
          rpId: selectedFido2Credential.rpId,
          credentialId: parseCredentialId(selectedCredentialId)!,
          counter: selectedFido2Credential.counter,
          userPresence: true,
          userVerification: true,
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
      } catch (error) {
        logger.error(
          `[Fido2Authenticator] Aborting because of unknown error when asserting credential: ${error}`,
        );
        throw new Fido2AuthenticatorError(Fido2AuthenticatorErrorCode.Unknown);
      }
    } finally {
      // userInterfaceSession.close();
    }
  }

  async function getPrivateKeyFromFido2Credential(
    fido2Credential: Fido2Credential,
  ): Promise<CryptoKey> {
    const keyBuffer = Fido2Utils.stringToBuffer(fido2Credential.keyValue);
    return await crypto.subtle.importKey(
      "pkcs8",
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
    userPresence: boolean;
    userVerification: boolean;
    counter: number;
    keyPair?: CryptoKeyPair;
  }
  
  async function generateAuthData(params: AuthDataParams) {
    const authData: Array<number> = [];
  
    const rpIdHash = new Uint8Array(
      await crypto.subtle.digest({ name: "SHA-256" }, Fido2Utils.fromByteStringToArray(params.rpId)!),
    );
    authData.push(...rpIdHash);
  
    const flags = authDataFlags({
      extensionData: false,
      attestationData: params.keyPair != undefined,
      backupEligibility: true,
      backupState: true, // Credentials are always synced
      userVerification: params.userVerification,
      userPresence: params.userPresence,
    });
    authData.push(flags);
  
    // add 4 bytes of counter - we use time in epoch seconds as monotonic counter
    // TODO: Consider changing this to a cryptographically safe random number
    const counter = params.counter;
    authData.push(
      ((counter & 0xff000000) >> 24) & 0xff,
      ((counter & 0x00ff0000) >> 16) & 0xff,
      ((counter & 0x0000ff00) >> 8) & 0xff,
      counter & 0x000000ff,
    );
  
    if (params.keyPair) {
      // attestedCredentialData
      const attestedCredentialData: Array<number> = [];
  
      attestedCredentialData.push(...AAGUID);
  
      // credentialIdLength (2 bytes) and credential Id
      const rawId = Fido2Utils.bufferSourceToUint8Array(params.credentialId);
      const credentialIdLength = [(rawId.length - (rawId.length & 0xff)) / 256, rawId.length & 0xff];
      attestedCredentialData.push(...credentialIdLength);
      attestedCredentialData.push(...rawId);
  
      const publicKeyJwk = await crypto.subtle.exportKey("jwk", params.keyPair.publicKey);
      // COSE format of the EC256 key
      const keyX = Fido2Utils.fromUrlB64ToArray(publicKeyJwk.x!);
      const keyY = Fido2Utils.fromUrlB64ToArray(publicKeyJwk.y!);
  
      // Can't get `cbor-redux` to encode in CTAP2 canonical CBOR. So we do it manually:
      const coseBytes = new Uint8Array(77);
      coseBytes.set([0xa5, 0x01, 0x02, 0x03, 0x26, 0x20, 0x01, 0x21, 0x58, 0x20], 0);
      coseBytes.set(keyX, 10);
      coseBytes.set([0x22, 0x58, 0x20], 10 + 32);
      coseBytes.set(keyY, 10 + 32 + 3);
  
      // credential public key - convert to array from CBOR encoded COSE key
      attestedCredentialData.push(...coseBytes);
  
      authData.push(...attestedCredentialData);
    }
  
    return new Uint8Array(authData);
  }


interface SignatureParams {
  authData: Uint8Array;
  clientDataHash: BufferSource;
  privateKey: CryptoKey;
}

async function generateSignature(params: SignatureParams) {
  const sigBase = new Uint8Array([
    ...params.authData,
    ...Fido2Utils.bufferSourceToUint8Array(params.clientDataHash),
  ]);
  const p1363_signature = new Uint8Array(
    await crypto.subtle.sign(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" },
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
