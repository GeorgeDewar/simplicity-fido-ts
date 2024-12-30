# simplicity-fido-ts

This is some work-in-progress code for logging into a web application (https://simplicity.kiwi) that uses
Passkey authentication. This code can perform a Webauthn assertion using an exported Passkey, as if you had
selected the Passkey in your web browser.

The Passkey-related code is under src/passkey, and it assumes that you have a file called creds.ts which contains
the Passkey itself.
