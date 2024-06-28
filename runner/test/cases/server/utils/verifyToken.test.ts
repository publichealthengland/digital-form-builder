import sinon from "sinon";
import config from "src/server/config";
import {
  generateSessionTokenForForm,
  verifyToken,
} from "src/server/plugins/initialiseSession/helpers";
import Jwt from "@hapi/jwt";
import Lab from "@hapi/lab";

import { expect } from "@hapi/code";

const { describe, test, beforeEach } = (exports.lab = Lab.script());
describe("verifyToken", function () {
  beforeEach(() => {
    sinon.restore();
  });
  test("token generated by generateSessionTokenForForm is valid", () => {
    const expiredToken = generateSessionTokenForForm("localhost", "test");
    const decodedExpiredToken = Jwt.token.decode(expiredToken);

    expect(verifyToken(decodedExpiredToken).isValid).to.be.true();
  });
  test("can detect expired tokens", () => {
    sinon.stub(config, "initialisedSessionTimeout").value(-5);
    const expiredToken = generateSessionTokenForForm("localhost", "test");
    const decodedExpiredToken = Jwt.token.decode(expiredToken);

    expect(verifyToken(decodedExpiredToken).isValid).to.be.false();
  });
  test("can detect incorrect key/algorithm", () => {
    // generate key with correct key/alg first
    const token = generateSessionTokenForForm("localhost", "test");
    const decodedToken = Jwt.token.decode(token);

    sinon.stub(config, "initialisedSessionKey").value("something new");
    expect(verifyToken(decodedToken).isValid).to.be.false();

    sinon.restore();
    sinon.stub(config, "initialisedSessionAlgorithm").value("PS384");
    expect(verifyToken(decodedToken).isValid).to.be.false();

    sinon.restore();
    expect(verifyToken(decodedToken).isValid).to.be.true();
  });
});