import { getPasskeyJwt } from "./passkey/main";

const simplicityLogin = async () => {
    const passkeyResult = await getPasskeyJwt();
    
}

simplicityLogin();