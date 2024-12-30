// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
export const UserRequestedFallbackAbortReason = 'UserRequestedFallback';

export type UserVerification = 'discouraged' | 'preferred' | 'required';

/**
 * Parameters for asserting a credential.
 */
export interface AssertCredentialParams {
  allowedCredentialIds: string[];
  rpId: string;
  origin: string;
  challenge: string;
  userVerification?: UserVerification;
  mediation?: 'silent' | 'optional' | 'required' | 'conditional';
}

/**
 * The result of asserting a credential.
 */
export interface AssertCredentialResult {
  credentialId: string;
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
  userHandle: string;
}

/**
 * A description of a key type and algorithm.
 *
 * @example {
 *   alg: -7, // ES256
 *   type: "public-key"
 * }
 */
export interface PublicKeyCredentialParam {
  alg: number;
  type: 'public-key';
}

/**
 * Error thrown when the user requests a fallback to the browser's built-in WebAuthn implementation.
 */
export class FallbackRequestedError extends Error {
  readonly fallbackRequested = true;
  constructor() {
    super('FallbackRequested');
  }
}
