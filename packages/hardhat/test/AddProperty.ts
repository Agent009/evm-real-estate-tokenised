import { expect } from "chai";
import { ZeroAddress } from "ethers";
import { ethers, upgrades } from "hardhat";
import { AddProperty, Property } from "@typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("AddProperty", function () {
  const PROPERTY_ID = 0;
  let addProperty: AddProperty;
  let property: Property;
  let addPropertyAddress: SignerWithAddress;
  let owner: SignerWithAddress;
  let minter: SignerWithAddress;
  let user: SignerWithAddress;
  let minterRole: string;

  const grantRole = async (role: string, address: SignerWithAddress) => {
    await property.grantRole(role, address);
  };

  const addUser = async (connector: SignerWithAddress, user: SignerWithAddress) => {
    await expect(addProperty.connect(connector).addUser(user.address))
      .to.emit(addProperty, "UserAdded")
      .withArgs(PROPERTY_ID, user.address);
  };

  beforeEach(async function () {
    // @ts-expect-error ignore
    [owner, minter, user] = await ethers.getSigners();

    const Property = await ethers.getContractFactory("Property");
    property = (await upgrades.deployProxy(Property, [owner.address, minter.address])) as unknown as Property;
    await property.waitForDeployment();
    minterRole = await property.MINTER_ROLE();

    const AddProperty = await ethers.getContractFactory("AddProperty");
    // addProperty = (await upgrades.deployProxy(AddProperty, [
    //   owner.address,
    //   0,
    //   await property.getAddress(),
    // ])) as unknown as AddProperty;
    addProperty = (await AddProperty.deploy(owner.address, PROPERTY_ID, await property.getAddress())) as AddProperty;
    await addProperty.waitForDeployment();
    addPropertyAddress = (await addProperty.getAddress()) as unknown as SignerWithAddress;
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await addProperty.s_owner()).to.equal(owner.address);
    });

    it(`Should set the initial property ID to ${PROPERTY_ID}`, async function () {
      expect(await addProperty.s_propertyId()).to.equal(PROPERTY_ID);
    });

    it("Should set the correct Property contract address", async function () {
      expect(await addProperty.property()).to.equal(await property.getAddress());
    });
  });

  describe("Role Management", function () {
    it("AddProperty contract should be able to mint tokens", async function () {
      await grantRole(minterRole, addPropertyAddress);
      expect(await property.hasRole(minterRole, addPropertyAddress)).to.equal(true);
    });
  });

  describe("User Management", function () {
    it("Should allow owner to add a user", async function () {
      await addUser(owner, user);
      expect(await addProperty.isUser(user.address)).to.equal(true);
    });

    it("Should not allow non-owner to add a user", async function () {
      await expect(addProperty.connect(user).addUser(minter.address)).to.be.revertedWithCustomError(
        addProperty,
        "AddProperty__NotOwner",
      );
    });

    it("Should not allow adding an existing user", async function () {
      await addProperty.connect(owner).addUser(user.address);
      await expect(addProperty.connect(owner).addUser(user.address)).to.be.revertedWithCustomError(
        addProperty,
        "AddProperty__UserAlreadyExists",
      );
    });
  });

  describe("Property Listing", function () {
    beforeEach(async function () {
      await grantRole(minterRole, addPropertyAddress);
    });

    it("Should allow user to add a property to listing", async function () {
      const propertyAddress = "0x1234567890123456789012345678901234567890";
      const tokenId = 1;
      const amount = 1000;
      const nftAmount = 100;
      const propertyURI = "uri";

      await addUser(owner, user);
      await expect(
        addProperty.connect(user).addPropertyToListing(propertyAddress, tokenId, amount, nftAmount, propertyURI),
      )
        .to.emit(addProperty, "PropertyAdded")
        .withArgs(1, user.address, propertyAddress, tokenId, amount, propertyURI);

      const listedProperty = await addProperty.properties(0);
      expect(listedProperty.propertyAddress).to.equal(propertyAddress);
      expect(listedProperty.tokenId).to.equal(tokenId);
      expect(listedProperty.amount).to.equal(amount);
    });

    it("Should not allow non-user to add a property", async function () {
      await expect(
        addProperty.connect(user).addPropertyToListing(ZeroAddress, 1, 1000, 100, "uri"),
      ).to.be.revertedWithCustomError(addProperty, "AddProperty__NotUser");
    });

    it("Should not allow adding a property with zero address", async function () {
      await addUser(owner, owner);
      await expect(
        addProperty.connect(owner).addPropertyToListing(ZeroAddress, 1, 1000, 100, "uri"),
      ).to.be.revertedWithCustomError(addProperty, "AddProperty__InvalidAddress");
    });

    it("Should not allow adding a property that already exists", async function () {
      const propertyAddress = "0x1234567890123456789012345678901234567890";
      await addUser(owner, owner);
      await addProperty.connect(owner).addPropertyToListing(propertyAddress, 1, 1000, 100, "uri");
      await expect(
        addProperty.connect(owner).addPropertyToListing(propertyAddress, 1, 1000, 100, "uri"),
      ).to.be.revertedWithCustomError(addProperty, "AddProperty__PropertyAlreadyExists");
    });

    it("Should increment property ID after adding a property", async function () {
      const initialId = await addProperty.s_propertyId();
      await addUser(owner, owner);
      await addProperty
        .connect(owner)
        .addPropertyToListing("0x1234567890123456789012345678901234567890", 1, 1000, 100, "uri");
      expect(await addProperty.s_propertyId()).to.equal(initialId + 1n);
    });

    it("Should mint NFT to the owner when adding a property", async function () {
      const propertyAddress = "0x1234567890123456789012345678901234567890";
      const tokenId = 1;
      const amount = 1000;
      const nftAmount = 100;
      const propertyURI = "uri";

      await addUser(owner, owner);
      await addProperty.connect(owner).addPropertyToListing(propertyAddress, tokenId, amount, nftAmount, propertyURI);
      expect(await property.balanceOf(owner.address, 1)).to.equal(nftAmount);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await addProperty
        .connect(owner)
        .addPropertyToListing("0x1234567890123456789012345678901234567890", 1, 1000, 100, "uri");
      await addProperty
        .connect(owner)
        .addPropertyToListing("0x2345678901234567890123456789012345678901", 2, 2000, 200, "uri");
    });

    it("Should return correct property owners", async function () {
      const owners = await addProperty.getPropertyOwners();
      expect(owners).to.have.lengthOf(2);
      expect(owners[0]).to.equal(owner.address);
      expect(owners[1]).to.equal(owner.address);
    });

    it("Should return correct property listings", async function () {
      const listings = await addProperty.getPropertyListings();
      expect(listings).to.have.lengthOf(2);
      expect(listings[0]!.propertyAddress).to.equal("0x1234567890123456789012345678901234567890");
      expect(listings[1]!.propertyAddress).to.equal("0x2345678901234567890123456789012345678901");
    });
  });
});
