import { getAssertion } from "./fido2-authenticator.service";
import { baseUrl, simplicityTenantId } from "./creds";
import { assertCredential } from "./fido2-client.service";
import { v4 as uuidv4 } from 'uuid';
import { AssertCredentialResult } from "./fido2-client.service.abstraction";

// getAssertion({
//     rpId: 'simplicity.kiwi',
//     allowCredentialDescriptorList: true,
//     hash: '',
    
// });

type GetAuthenticationOptionsResponse = {
    challengeId: string;
    options: {
        rpId: string;
        challenge: string;
        allowCredentials: Array<unknown>;
        timeout: number;
        userVerification: string;
    }
};

const getChallengeId = async (tenantId: string): Promise<string> => {
    const response = await fetch(`${baseUrl}/client/challenge`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${btoa(encodeURIComponent(tenantId))}`
        },
        body: JSON.stringify({
            action: "cognitoAuth"
        })
    })
    console.log(`Status: ${response.status}`);
    if (response.status !== 200) {
        throw Error(await response.text());
    }
    const json = await response.json();
    return json.challengeId;
}

const getAuthenticationOptions = async (tenantId: string, challengeId: string): Promise<GetAuthenticationOptionsResponse> => {
    const response = await fetch(`${baseUrl}/client/user-authenticators/passkey/authentication-options`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${btoa(encodeURIComponent(tenantId))}`
        },
        body: JSON.stringify({
            challengeId
        })
    })
    console.log(`Status: ${response.status}`);
    if (response.status !== 200) {
        throw Error(await response.text());
    }
    const json = await response.json();
    return json;
}

const presentPasskey = async (tenantId: string, challengeId: string, assertion: AssertCredentialResult) => {
    const response = await fetch(`${baseUrl}/client/verify/passkey`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${btoa(encodeURIComponent(tenantId))}`
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
            deviceId: uuidv4()
        })
    })
    console.log(`Status: ${response.status}`);
    if (response.status !== 200) {
        throw Error(await response.text());
    }
    const json = await response.json();
    return json;
}

const getJwt = async () => {
    const challengeId = await getChallengeId(simplicityTenantId);
    console.log(challengeId);

    const authenticationOptions = await getAuthenticationOptions(simplicityTenantId, challengeId);
    console.log(authenticationOptions);


    /**
     * {
    "allowedCredentialIds": [],
    "challenge": "Wn5edg6F1p6AH2HOjxmA6216kZEt_bFfFRetHVT0O10",
    "rpId": "simplicity.kiwi",
    "userVerification": "preferred",
    "timeout": 60000,
    "fallbackSupported": true,
    "origin": "https://app.simplicity.kiwi",
    "sameOriginWithAncestors": true
}

     */

    const assertion = await assertCredential({
        allowedCredentialIds: [], // any ID is OK
        challenge: authenticationOptions.options.challenge,
        rpId: authenticationOptions.options.rpId,
        userVerification: "preferred",
        timeout: 60000,
        fallbackSupported: true,
        origin: "https://app.simplicity.kiwi",
        sameOriginWithAncestors: true
    });
    console.log(assertion);

    /**
     * Return value looks like:
     * 
     * {
        authenticatorData: 'bCiRa0rSTLt-wBRei0LKhq57bhqajTACpDmak0CIapQdAAAAAA',
        clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoicUU3bnVDbnZCeW5GR0FOTnEtODM4a0RJS3dFUEF2LUstOXAyRnlud09sMCIsIm9yaWdpbiI6Imh0dHBzOi8vYXBwLnNpbXBsaWNpdHkua2l3aSIsImNyb3NzT3JpZ2luIjpmYWxzZX0',
        credentialId: 'Wk_izCkUQBuBOp-MjzBUkQ',
        userHandle: 'NDlkMjlkN2EtMTgwOC00ZGZjLTg4ODgtZTNlMWNiM2ExOGYz',
        signature: 'MEYCIQCgVGo0M83QzOWe_rk10KOp4jfpSqNAWUnn5MO7qGoWJAIhAMCiLlcv1aIz18Ydr5lRORpIby9qwEicFSkL9UQ7QvIa'
       }
     */

    /**
     * Gotta send payload:
     * 
     * {
        "challengeId": "c9cfbdf2-c712-4284-abc2-fbd91a9848fb", // from server
        "authenticationCredential": {
            "id": "Wk_izCkUQBuBOp-MjzBUkQ",
            "rawId": "Wk_izCkUQBuBOp-MjzBUkQ",
            "response": {
                "authenticatorData": "bCiRa0rSTLt-wBRei0LKhq57bhqajTACpDmak0CIapQdAAAAAA",
                "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiTUdSWHVWM2ZJaDZCb3F4c0FlelQ3YnBCTG1ybHdXcDN6bGZIbk9zaHB0NCIsIm9yaWdpbiI6Imh0dHBzOi8vYXBwLnNpbXBsaWNpdHkua2l3aSIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
                "signature": "MEYCIQDR3c0FZq82FqwzpKIMcPhF-OHae-ZN1Hro9GVMgyjQtwIhAP2NPQq3eB9_VT-Gsn1AAVTmAXYyWAbCn6gQIKMgsx-g",
                "userHandle": "49d29d7a-1808-4dfc-8888-e3e1cb3a18f3"
            },
            "type": "public-key",
            "clientExtensionResults": {},
            "authenticatorAttachment": "platform"
        },
        "deviceId": "08e21881-d6a6-4656-b34b-6e2e1ac487d7" // UUID
      }
     */

    const authResult = await presentPasskey(simplicityTenantId, challengeId, assertion);
    console.log(authResult);

}

getJwt();