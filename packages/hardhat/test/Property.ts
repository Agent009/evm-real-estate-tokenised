import { expect } from "chai";
import { ZeroAddress } from "ethers";
import { ethers, upgrades } from "hardhat";
import { Property } from "@typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Property", function () {
  let property: Property;
  let owner: SignerWithAddress;
  let minter: SignerWithAddress;
  let user: SignerWithAddress;

  beforeEach(async function () {
    // @ts-expect-error ignore
    [owner, minter, user] = await ethers.getSigners();

    const Property = await ethers.getContractFactory("Property");
    property = (await upgrades.deployProxy(Property, [owner.address, minter.address])) as unknown as Property;
    await property.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await property.hasRole(await property.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(true);
    });

    it("Should set the right minter", async function () {
      expect(await property.hasRole(await property.MINTER_ROLE(), minter.address)).to.equal(true);
    });
  });

  describe("Minting", function () {
    it("Should allow minter to mint tokens", async function () {
      await expect(property.connect(minter).mint(user.address, 1, 100, "0x"))
        .to.emit(property, "TransferSingle")
        .withArgs(minter.address, ZeroAddress, user.address, 1, 100);

      expect(await property.balanceOf(user.address, 1)).to.equal(100);
    });

    it("Should not allow non-minters to mint tokens", async function () {
      await expect(property.connect(user).mint(user.address, 1, 100, "0x")).to.be.revertedWith(
        "AccessControl: account " + user.address.toLowerCase() + " is missing role " + (await property.MINTER_ROLE()),
      );
    });

    it("Should allow minter to batch mint tokens", async function () {
      await expect(property.connect(minter).mintBatch(user.address, [1, 2], [100, 200], "0x"))
        .to.emit(property, "TransferBatch")
        .withArgs(minter.address, ZeroAddress, user.address, [1, 2], [100, 200]);

      expect(await property.balanceOf(user.address, 1)).to.equal(100);
      expect(await property.balanceOf(user.address, 2)).to.equal(200);
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      await property.connect(minter).mint(user.address, 1, 100, "0x");
    });

    it("Should allow users to burn their own tokens", async function () {
      await expect(property.connect(user).burn(user.address, 1, 50))
        .to.emit(property, "TransferSingle")
        .withArgs(user.address, user.address, ZeroAddress, 1, 50);

      expect(await property.balanceOf(user.address, 1)).to.equal(50);
    });

    it("Should allow users to batch burn their own tokens", async function () {
      await property.connect(minter).mint(user.address, 2, 200, "0x");

      await expect(property.connect(user).burnBatch(user.address, [1, 2], [50, 100]))
        .to.emit(property, "TransferBatch")
        .withArgs(user.address, user.address, ZeroAddress, [1, 2], [50, 100]);

      expect(await property.balanceOf(user.address, 1)).to.equal(50);
      expect(await property.balanceOf(user.address, 2)).to.equal(100);
    });
  });

  describe("URI", function () {
    it("Should allow URI_SETTER_ROLE to set URI", async function () {
      await property.grantRole(await property.URI_SETTER_ROLE(), owner.address);
      await property.setURI("https://example.com/token/");
      expect(await property.uri(1)).to.equal("https://example.com/token/");
    });

    it("Should not allow non-URI_SETTER_ROLE to set URI", async function () {
      await expect(property.connect(user).setURI("https://example.com/token/")).to.be.revertedWith(
        "AccessControl: account " +
          user.address.toLowerCase() +
          " is missing role " +
          (await property.URI_SETTER_ROLE()),
      );
    });
  });

  describe("Access Control", function () {
    it("Should allow admin to grant roles", async function () {
      await property.grantRole(await property.MINTER_ROLE(), user.address);
      expect(await property.hasRole(await property.MINTER_ROLE(), user.address)).to.equal(true);
    });

    it("Should allow admin to revoke roles", async function () {
      await property.grantRole(await property.MINTER_ROLE(), user.address);
      await property.revokeRole(await property.MINTER_ROLE(), user.address);
      expect(await property.hasRole(await property.MINTER_ROLE(), user.address)).to.equal(false);
    });
  });

  describe("ERC1155 Functionality", function () {
    beforeEach(async function () {
      await property.connect(minter).mint(user.address, 1, 100, "0x");
    });

    it("Should return correct balance", async function () {
      expect(await property.balanceOf(user.address, 1)).to.equal(100);
    });

    it("Should return correct batch balance", async function () {
      await property.connect(minter).mint(user.address, 2, 200, "0x");
      const balances = await property.balanceOfBatch([user.address, user.address], [1, 2]);
      expect(balances[0]).to.equal(100);
      expect(balances[1]).to.equal(200);
    });

    it("Should allow safe transfers", async function () {
      await expect(property.connect(user).safeTransferFrom(user.address, owner.address, 1, 50, "0x"))
        .to.emit(property, "TransferSingle")
        .withArgs(user.address, user.address, owner.address, 1, 50);

      expect(await property.balanceOf(user.address, 1)).to.equal(50);
      expect(await property.balanceOf(owner.address, 1)).to.equal(50);
    });

    it("Should allow safe batch transfers", async function () {
      await property.connect(minter).mint(user.address, 2, 200, "0x");
      await expect(property.connect(user).safeBatchTransferFrom(user.address, owner.address, [1, 2], [50, 100], "0x"))
        .to.emit(property, "TransferBatch")
        .withArgs(user.address, user.address, owner.address, [1, 2], [50, 100]);

      expect(await property.balanceOf(user.address, 1)).to.equal(50);
      expect(await property.balanceOf(user.address, 2)).to.equal(100);
      expect(await property.balanceOf(owner.address, 1)).to.equal(50);
      expect(await property.balanceOf(owner.address, 2)).to.equal(100);
    });
  });
});
