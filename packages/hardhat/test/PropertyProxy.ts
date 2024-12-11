import { expect } from "chai";
import { ignition, ethers } from "hardhat";
import PropertyModule from "../ignition/modules/PropertyModule";

describe("Property Proxy", function () {
  describe("Proxy interaction", async function () {
    it("Should be interactable via proxy", async function () {
      const [owner, otherAccount] = await ethers.getSigners();

      const { instance } = await ignition.deploy(PropertyModule);
      // @ts-expect-error ignore
      const adminRole = await instance.connect(otherAccount!).DEFAULT_ADMIN_ROLE();
      // @ts-expect-error ignore
      const minterRole = await instance.connect(otherAccount!).MINTER_ROLE();
      // @ts-expect-error ignore
      expect(await instance.connect(otherAccount!).hasRole(adminRole, owner!.address)).to.equal(true);
      // @ts-expect-error ignore
      expect(await instance.connect(otherAccount!).hasRole(minterRole, owner!.address)).to.equal(true);
    });
  });
});
