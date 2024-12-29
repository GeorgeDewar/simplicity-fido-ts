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
    allowCredentialDescriptorList: PublicKeyCredentialDescriptor[];
    /** The effective user verification requirement for assertion, a Boolean value provided by the client. */
    requireUserVerification: boolean;
    /** The constant Boolean value true. It is included here as a pseudo-parameter to simplify applying this abstract authenticator model to implementations that may wish to make a test of user presence optional although WebAuthn does not. */
    // requireUserPresence: boolean; // Always required
    extensions: unknown;
    /** Forwarded to user interface */
    fallbackSupported: boolean;

    // Bypass the UI and assume that the user has already interacted with the authenticator
    assumeUserPresence?: boolean;
}

export interface Fido2AuthenticatorGetAssertionResult {
    selectedCredential: {
        id: Uint8Array;
        userHandle?: Uint8Array;
    };
    authenticatorData: Uint8Array;
    signature: Uint8Array;
}


export enum Fido2AuthenticatorErrorCode {
    Unknown = "UnknownError",
    NotSupported = "NotSupportedError",
    InvalidState = "InvalidStateError",
    NotAllowed = "NotAllowedError",
    Constraint = "ConstraintError",
}

export class Fido2AuthenticatorError extends Error {
    constructor(readonly errorCode: Fido2AuthenticatorErrorCode) {
        super(errorCode);
    }
}

export type BitwardenCipher = {
    login: {
        fido2Credentials: Array<Fido2Credential>
    }
}

export type Fido2Credential = {
    credentialId: string;
    keyType: string;
    keyAlgorithm: string;
    keyCurve: string;
    keyValue: string;
    rpId: string;
    userHandle: string;
    userName: string;
    counter: number;
    rpName: string;
    userDisplayName: string;
    creationDate: string;
}

