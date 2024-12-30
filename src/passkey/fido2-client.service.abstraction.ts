// Unused
export type UserVerification = 'discouraged' | 'preferred' | 'required';

/**
 * Parameters for asserting a credential.
 */
export interface AssertCredentialParams {
  rpId: string;
  origin: string;
  challenge: string;
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
