import { v4 as uuidv4 } from "uuid";
import { cognitoLogin } from "./cognito/main";

const simplicityLogin = async () => {
  const deviceId = uuidv4();

  const cognitoResult = await cognitoLogin(deviceId);
  console.log(cognitoResult);
};

simplicityLogin();
