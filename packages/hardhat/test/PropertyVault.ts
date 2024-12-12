import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { AddProperty, PropertyVault, Property, PropertyToken, IERC20 } from "@typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PropertyVault", function () {
  // Contract instances
  let property: Property;
  let propertyToken: PropertyToken;
  let addProperty: AddProperty;
  let propertyVault: PropertyVault;
  // Mock ERC20 token to simulate payments
  let paymentToken: IERC20;
  // Contract deployment addresses
  let propertyAddress: SignerWithAddress;
  let propertyTokenAddress: SignerWithAddress;
  let paymentTokenAddress: SignerWithAddress;
  let addPropertyAddress: SignerWithAddress;
  let propertyVaultAddress: SignerWithAddress;
  // Signers
  let owner: SignerWithAddress;
  let user: SignerWithAddress;

  const deployContracts = async (owner: SignerWithAddress) => {
    const Property = await ethers.getContractFactory("Property");
    property = (await upgrades.deployProxy(Property, [owner.address, user.address])) as unknown as Property;
    await property.waitForDeployment();
    propertyAddress = (await property.getAddress()) as unknown as SignerWithAddress;

    const PropertyToken = await ethers.getContractFactory("PropertyToken");
    propertyToken = (await PropertyToken.deploy(owner.address)) as PropertyToken;
    await propertyToken.waitForDeployment();
    propertyTokenAddress = (await propertyToken.getAddress()) as unknown as SignerWithAddress;

    const ERC20Mock = await ethers.getContractFactory("PaymentTokenMock"); // Mock ERC20 token for testing
    paymentToken = (await ERC20Mock.deploy("MockToken", "MTK")) as IERC20;
    await paymentToken.waitForDeployment();
    paymentTokenAddress = (await paymentToken.getAddress()) as unknown as SignerWithAddress;

    const AddProperty = await ethers.getContractFactory("AddProperty");
    addProperty = (await AddProperty.deploy(await property.getAddress())) as AddProperty;
    await addProperty.waitForDeployment();
    addPropertyAddress = (await addProperty.getAddress()) as unknown as SignerWithAddress;

    const PropertyVault = await ethers.getContractFactory("PropertyVault");
    propertyVault = (await PropertyVault.deploy(
      addPropertyAddress,
      propertyAddress,
      propertyTokenAddress,
      paymentTokenAddress,
    )) as PropertyVault;
    await propertyVault.waitForDeployment();
    propertyVaultAddress = (await propertyVault.getAddress()) as unknown as SignerWithAddress;
  };

  beforeEach(async function () {
    // @ts-expect-error ignore
    [owner, user] = await ethers.getSigners();
    await deployContracts(owner);
  });

  // Verifies the `PropertyVault` contract is deployed with correct addresses.
  describe("Deployment", function () {
    it("Should set the correct contract addresses", async function () {
      expect(await propertyVault.i_addProperty()).to.equal(addPropertyAddress);
      expect(await propertyVault.i_property()).to.equal(propertyAddress);
      expect(await propertyVault.propertyToken()).to.equal(propertyTokenAddress);
      expect(await propertyVault.paymentToken()).to.equal(paymentTokenAddress);
    });
  });

  // Tests adding properties to the vault.
  describe("Adding Property to Vault", function () {
    it("Should allow adding a property to the vault", async function () {
      const tokenId = 1;
      const amount = 1;
      const pricePerShare = ethers.parseUnits("0.01", "ether");

      await property.mint(owner.address, tokenId, amount, "0x"); // Mint a mock NFT to the owner

      await property.setApprovalForAll(propertyVaultAddress, true); // Provide approval for transfer
      await expect(propertyVault.addPropertyToVault(tokenId, pricePerShare))
        .to.emit(propertyVault, "SetSharePrice")
        .withArgs(tokenId, pricePerShare);

      const isInVault = await propertyVault.isPropertyInVault(tokenId);
      expect(isInVault).to.equal(true);
    });

    it("Should fail to add a property without approval", async function () {
      const tokenId = 1;
      const amount = 1;
      const pricePerShare = ethers.parseUnits("0.01", "ether");

      await property.mint(owner.address, tokenId, amount, "0x"); // Mint a mock NFT to the owner

      await expect(propertyVault.addPropertyToVault(tokenId, pricePerShare)).to.be.revertedWith(
        "ERC1155: transfer caller is not owner nor approved",
      );
    });
  });

  // Verifies share purchasing and fractionalizing properties.
  describe("Fractionalizing NFT Shares", function () {
    it("Should allow purchasing shares of a property", async function () {
      const tokenId = 1;
      const amount = 1;
      const pricePerShare = ethers.parseUnits("1", "ether");
      const shareAmount = 5;

      // Add property to vault
      await property.mint(owner.address, tokenId, amount, "0x");
      await property.setApprovalForAll(propertyVaultAddress, true);
      await propertyVault.addPropertyToVault(tokenId, pricePerShare);

      // Fund user with mock payment tokens
      await paymentToken.transfer(user.address, ethers.parseUnits("10", "ether"));

      // Approve vault to spend user's payment tokens
      await paymentToken.connect(user).approve(propertyVaultAddress, ethers.parseUnits("10", "ether"));

      // Purchase shares
      await expect(propertyVault.connect(user).fractionalizeNFT(shareAmount, tokenId))
        .to.emit(propertyVault, "SharesPurchased")
        .withArgs(tokenId, user.address, shareAmount);

      const balance = await propertyVault.investors(tokenId, user.address);
      expect(balance.balance).to.equal(shareAmount);
    });

    it("Should revert if attempting to purchase shares for a non-existent property", async function () {
      const tokenId = 2; // Non-existent tokenId
      const shareAmount = 5;

      await expect(propertyVault.connect(user).fractionalizeNFT(shareAmount, tokenId)).to.be.revertedWith(
        "PropertyVault__PropertyNotInVault",
      );
    });
  });

  // Tests the investment withdrawal logic.
  describe("Withdrawing Investment", function () {
    it("Should allow users to withdraw their investment", async function () {
      const tokenId = 1;
      const amount = 1;
      const pricePerShare = ethers.parseUnits("1", "ether");
      const shareAmount = 3;

      // Add property to vault and purchase shares
      await property.mint(owner.address, tokenId, amount, "0x");
      await property.setApprovalForAll(propertyVaultAddress, true);
      await propertyVault.addPropertyToVault(tokenId, pricePerShare);

      await paymentToken.transfer(user.address, ethers.parseUnits("10", "ether"));
      await paymentToken.connect(user).approve(propertyVaultAddress, ethers.parseUnits("10", "ether"));
      await propertyVault.connect(user).fractionalizeNFT(shareAmount, tokenId);

      // Withdraw investment
      await expect(propertyVault.connect(user).withdrawInvestment(tokenId))
        .to.emit(propertyVault, "Withdrawal")
        .withArgs(tokenId, user.address, shareAmount);

      const balance = await propertyVault.investors(tokenId, user.address);
      expect(balance.balance).to.equal(0);
    });

    it("Should revert if user attempts to withdraw with no investment", async function () {
      const tokenId = 1;
      await expect(propertyVault.connect(user).withdrawInvestment(tokenId)).to.be.revertedWith(
        "PropertyVault__NoInvestment",
      );
    });
  });

  // Confirms the contract supports the `ERC1155Receiver` interface for OpenZeppelin compliance.
  describe("ERC1155Holder Compliance", function () {
    it("Should return true for ERC1155Receiver interface", async function () {
      const supportsERC1155 = await propertyVault.supportsInterface("0x4e2312e0"); // ERC1155Receiver interface ID
      expect(supportsERC1155).to.equal(true);
    });
  });
});
