import { v4 as uuidv4 } from "uuid";
import { getPasskeyJwt } from "./passkey/main";
import { cognitoLogin } from "./cognito/main";

const simplicityLogin = async () => {
  const deviceId = uuidv4();
  //const passkeyResult = await getPasskeyJwt(deviceId);

  const cognitoResult = await cognitoLogin(deviceId);
  console.log(cognitoResult);
};

simplicityLogin();
