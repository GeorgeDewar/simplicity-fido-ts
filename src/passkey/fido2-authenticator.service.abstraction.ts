export enum Fido2AuthenticatorErrorCode {
  Unknown = 'UnknownError',
  NotSupported = 'NotSupportedError',
  InvalidState = 'InvalidStateError',
  NotAllowed = 'NotAllowedError',
  Constraint = 'ConstraintError',
}

export class Fido2AuthenticatorError extends Error {
  constructor(readonly errorCode: Fido2AuthenticatorErrorCode) {
    super(errorCode);
  }
}

/**
 * Parameters for {@link Fido2AuthenticatorService.getAssertion}

 * This interface represents the input parameters described in
 * https://www.w3.org/TR/webauthn-3/#sctn-op-get-assertion
 */
export interface Fido2AuthenticatorGetAssertionParams {
  /** The caller’s RP ID, as determined by the user agent and the client. */
  rpId: string;
  /** The hash of the serialized client data, provided by the client. */
  hash: BufferSource;
}

export interface Fido2AuthenticatorGetAssertionResult {
  selectedCredential: {
    id: Uint8Array;
    userHandle?: Uint8Array;
  };
  authenticatorData: Uint8Array;
  signature: Uint8Array;
}
