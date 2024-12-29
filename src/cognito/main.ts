import { creds } from "../creds";
import { getPasskeyJwt } from "../passkey/main";

const baseUrl = "https://cognito-idp.ap-southeast-2.amazonaws.com/";
const simplicityClientId = "kvoiu7unft0c8hqqsa6hkmeu5";

const initiateAuth = async (deviceId: string, username: string) => {
  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
      "X-Amz-User-Agent": "aws-amplify/6.4.2 auth/4 framework/1",
    },
    body: JSON.stringify({
      AuthFlow: "CUSTOM_AUTH",
      AuthParameters: {
        USERNAME: username,
      },
      ClientMetadata: {
        anonymousId: deviceId,
        userAgent:
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
      ClientId: simplicityClientId,
    }),
  });
  console.log(`Status: ${response.status}`);
  if (response.status !== 200) {
    throw Error(await response.text());
  }
  const json = await response.json();
  return json;
};

const respondToChallenge = async (
  username: string,
  session: string,
  answer: string,
): Promise<any> => {
  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target":
        "AWSCognitoIdentityProviderService.RespondToAuthChallenge",
    },
    body: JSON.stringify({
      ChallengeName: "CUSTOM_CHALLENGE",
      ChallengeResponses: {
        USERNAME: username,
        ANSWER: answer,
      },
      Session: session,
      ClientId: simplicityClientId,
    }),
  });
  console.log(`Status: ${response.status}`);
  if (response.status !== 200) {
    throw Error(await response.text());
  }
  const json = await response.json();
  return json;
};

export const cognitoLogin = async (deviceId: string) => {
  // Get a Passkey
  const passkeyResult = await getPasskeyJwt(deviceId);

  // Get the Cogito custom challenge
  const username = creds.userName; // email
  const response = await initiateAuth(deviceId, username);
  let session: string = response.Session;
  console.log(response);

  /**
     * Response looks like:
     * 
     * {
  ChallengeName: 'CUSTOM_CHALLENGE',
  ChallengeParameters: {
    USERNAME: 'george@dewar.co.nz',
    state: 'CHALLENGE_REQUIRED',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3MzU0NDYxODksInN1YiI6IjQ5ZDI5ZDdhLTE4MDgtNGRmYy04ODg4LWUzZTFjYjNhMThmMyIsImV4cCI6MTczNTQ0Njc4OSwic2NvcGUiOiJyZWFkOmF1dGhlbnRpY2F0b3JzIiwib3RoZXIiOnsidGVuYW50SWQiOiJlNzY4ODIyZi1iMWExLTQwNGMtYTY4NS0wZTM3OTA1Y2E1ZjUiLCJwdWJsaXNoYWJsZUtleSI6ImIxYjAzNDU2NDE5NDcyYmJlZjA5M2YyNjg1YzQyM2Y0IiwidXNlcklkIjoiNDlkMjlkN2EtMTgwOC00ZGZjLTg4ODgtZTNlMWNiM2ExOGYzIiwiYWN0aW9uQ29kZSI6ImNvZ25pdG9BdXRoIiwiaWRlbXBvdGVuY3lLZXkiOiJmNzAxZDIzZi04YTY2LTQ5M2YtYmQ5YS0zMTY1YmVhOTUxMzUiLCJyZWdpb24iOiJhdSJ9fQ.XOsBH-GfI2V_8GjCQAeO-s76a0WigBi9vgLjVhaOQRQ',
    url: 'https://mfa.simplicity.kiwi/challenge/passkey?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3MzU0NDYxODksInN1YiI6IjQ5ZDI5ZDdhLTE4MDgtNGRmYy04ODg4LWUzZTFjYjNhMThmMyIsImV4cCI6MTczNTQ0NjMwOSwic2NvcGUiOiJyZWFkOmF1dGhlbnRpY2F0b3JzIiwib3RoZXIiOnsidGVuYW50SWQiOiJlNzY4ODIyZi1iMWExLTQwNGMtYTY4NS0wZTM3OTA1Y2E1ZjUiLCJwdWJsaXNoYWJsZUtleSI6ImIxYjAzNDU2NDE5NDcyYmJlZjA5M2YyNjg1YzQyM2Y0IiwidXNlcklkIjoiNDlkMjlkN2EtMTgwOC00ZGZjLTg4ODgtZTNlMWNiM2ExOGYzIiwiYWN0aW9uQ29kZSI6ImNvZ25pdG9BdXRoIiwiaWRlbXBvdGVuY3lLZXkiOiJmNzAxZDIzZi04YTY2LTQ5M2YtYmQ5YS0zMTY1YmVhOTUxMzUiLCJyZWdpb24iOiJhdSIsInZlcmlmaWNhdGlvbk1ldGhvZHMiOiJwYXNza2V5IGF1dGhlbnRpY2F0b3JfYXBwIHNtcyBlbWFpbF9vdHAiLCJwcm9tcHRUb0Vucm9sbFZlcmlmaWNhdGlvbk1ldGhvZHMiOiIiLCJuYW1lIjoiU2ltcGxpY2l0eSIsImNoYWxsZW5nZUlkIjoiNGYyZDYwNjMtMTI3MS00ZTFiLWJhZGItMjM0ZWEwMDA0NTExIn19.dzl4ThXmgcelE-x8Na2-4luM6qR9j_OVLl7mO_P4SII&settings=false'
  },
  Session: 'AYABeOQ0TM_NBIsiHz_fVcJaE_MAHQABAAdTZXJ2aWNlABBDb2duaXRvVXNlclBvb2xzAAEAB2F3cy1rbXMAUGFybjphd3M6a21zOmFwLXNvdXRoZWFzdC0yOjg1NjQ1NjE0MzMxMDprZXkvOGY3MjFiZTQtMzZiMC00YWY5LTkxNzItYTY1MjY3MWRiY2NiALgBAgEAeNLFnhxmWdj2sL_2cCQGW-hFynYwu4d99wUbRTb_jqmhAbqQ_UTRY93hvDyZIKxnEtYAAAB-MHwGCSqGSIb3DQEHBqBvMG0CAQAwaAYJKoZIhvcNAQcBMB4GCWCGSAFlAwQBLjARBAxSYiYkFOZiqm5bj6ACARCAOwfn12Dt1scSvAuMIuLB8_YDOeefsL2NU7BkrImdn-dPcCR8HEfR67aKl3xPpmt6CMrgQt34yJ52LjPLAgAAAAAMAAAQAAAAAAAAAAAAAAAAALAV4DYM_IB9_T-WFwEsJOf_____AAAAAQAAAAAAAAAAAAAAAQAAAPW7dptNgaccbPftSxA3V2EN3O6idpzDb1D1dK5ogHtHvHnycfkPliZpAH27ZCKHWqGXhw8vUs_V0DJOSJawTWkvhs7cFidTuWLLlMyQnpHTU0RTq0z-rhZT7o9pM2bDKcr9OoZysHkaKv-ER0NYHTyJZJ3EInMtikAXaahklSX4DcIqR3cvD8gkEZEEFNsVpEOshAnJF9K-tKIBKajuCVcqZJYMYlb69gnHI5eOzBCSBUOUQ3I25acRuO6ucwjIUoUFL6HRtqwKtBN8Df2clxU3pAbb9SrAHk1OwUdZfJrnUYeT2ov4iTAN34NeYZUqO-6SdzStSyFCXCstBXm-irZ0IV-283A'
}
     */

  // Respond to challenge with JWT from Passkey authentication

  const respondToChallengeResult = await respondToChallenge(
    username,
    session,
    passkeyResult.accessToken,
  );
  console.log(respondToChallengeResult);

  return response;
};
