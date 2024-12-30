import { getAssertion } from "./fido2-authenticator.service";
import { baseUrl, simplicityTenantId } from "../creds";
import { assertCredential } from "./fido2-client.service";
import { AssertCredentialResult } from "./fido2-client.service.abstraction";
import { PasskeyAuthResult } from "./types";

type GetAuthenticationOptionsResponse = {
  challengeId: string;
  options: {
    rpId: string;
    challenge: string;
    allowCredentials: Array<unknown>;
    timeout: number;
    userVerification: string;
  };
};

const getChallengeId = async (tenantId: string): Promise<string> => {
  const response = await fetch(`${baseUrl}/client/challenge`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(encodeURIComponent(tenantId))}`,
    },
    body: JSON.stringify({
      action: "cognitoAuth",
    }),
  });
  console.log(`Status: ${response.status}`);
  if (response.status !== 200) {
    throw Error(await response.text());
  }
  const json = await response.json();
  return json.challengeId;
};

const getAuthenticationOptions = async (
  tenantId: string,
  challengeId: string,
): Promise<GetAuthenticationOptionsResponse> => {
  const response = await fetch(
    `${baseUrl}/client/user-authenticators/passkey/authentication-options`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(encodeURIComponent(tenantId))}`,
      },
      body: JSON.stringify({
        challengeId,
      }),
    },
  );
  console.log(`Status: ${response.status}`);
  if (response.status !== 200) {
    throw Error(await response.text());
  }
  const json = await response.json();
  return json;
};

const presentPasskey = async (
  tenantId: string,
  challengeId: string,
  assertion: AssertCredentialResult,
  deviceId: string,
): Promise<PasskeyAuthResult> => {
  const response = await fetch(`${baseUrl}/client/verify/passkey`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(encodeURIComponent(tenantId))}`,
    },
    body: JSON.stringify({
      challengeId,
      authenticationCredential: {
        id: assertion.credentialId,
        rawId: assertion.credentialId,
        response: {
          authenticatorData: assertion.authenticatorData,
          clientDataJSON: assertion.clientDataJSON,
          signature: assertion.signature,
          userHandle: assertion.userHandle,
        },
        type: "public-key",
        clientExtensionResults: {},
        authenticatorAttachment: "platform",
      },
      deviceId,
    }),
  });
  console.log(`Status: ${response.status}`);
  if (response.status !== 200) {
    throw Error(await response.text());
  }
  const json = await response.json();
  return json;
};

export const getPasskeyJwt = async (
  deviceId: string,
): Promise<PasskeyAuthResult> => {
  const challengeId = await getChallengeId(simplicityTenantId);
  console.log(challengeId);

  const authenticationOptions = await getAuthenticationOptions(
    simplicityTenantId,
    challengeId,
  );
  console.log(authenticationOptions);

  const assertion = await assertCredential({
    allowedCredentialIds: [], // any ID is OK
    challenge: authenticationOptions.options.challenge,
    rpId: authenticationOptions.options.rpId,
    userVerification: "preferred",
    fallbackSupported: true,
    origin: "https://app.simplicity.kiwi",
    sameOriginWithAncestors: true,
  });
  console.log(assertion);

  const authResult = await presentPasskey(
    simplicityTenantId,
    challengeId,
    assertion,
    deviceId,
  );
  console.log(authResult);

  return authResult;
};
