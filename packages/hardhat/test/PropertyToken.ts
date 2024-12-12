import { expect } from "chai";
import { parseUnits, MaxUint256 } from "ethers";
import { ethers } from "hardhat";
import { PropertyToken } from "@typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PropertyToken", function () {
  let token: PropertyToken;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    // @ts-expect-error ignore
    [owner, user1, user2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("PropertyToken");
    token = await Token.deploy(owner.address);
    await token.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct name and symbol", async function () {
      expect(await token.name()).to.equal("PropertyToken");
      expect(await token.symbol()).to.equal("MTK");
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const mintAmount = parseUnits("100", 18);
      await token.connect(owner).mint(user1.address, mintAmount);

      const balance = await token.balanceOf(user1.address);
      expect(balance).to.equal(mintAmount);
    });

    it("Should revert if non-owner tries to mint", async function () {
      const mintAmount = parseUnits("100", 18);

      // try {
      //   await token.connect(user1).mint(user1.address, mintAmount);
      // } catch (error) {
      //   // Gives error like: OwnableUnauthorizedAccount("0x70997970C51812dc3A010C7d01b50e0d17dc79C8")
      //   console.error("Mint error", error);
      // }
      // expect(true).to.equal(false); // This line ensures the test fails, and we see the error

      await expect(token.connect(user1).mint(user1.address, mintAmount))
        .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
        .withArgs(user1.address);
    });
  });

  describe("Burning", function () {
    it("Should allow a holder to burn their tokens", async function () {
      const mintAmount = parseUnits("100", 18);
      await token.connect(owner).mint(user1.address, mintAmount);

      await token.connect(user1).burn(mintAmount - 10n); // Burn all but 10 tokens

      const balanceAfterBurn = await token.balanceOf(user1.address);
      expect(balanceAfterBurn).to.equal(10);
    });

    it("Should revert if burn amount exceeds balance", async function () {
      const mintAmount = parseUnits("50", 18);
      const burnAmount = mintAmount + 1n;
      await token.connect(owner).mint(user1.address, mintAmount);

      // try {
      //   await token.connect(user1).burn(burnAmount);
      // } catch (error) {
      //   // Gives error like: ERC20InsufficientBalance("0x7
      //   // 0997970C51812dc3A010C7d01b50e0d17dc79C8", 50000000000000000000, 50000000000000000001)
      //   console.error("Burn error", error);
      // }
      // expect(true).to.equal(false); // This line ensures the test fails, and we see the error

      await expect(token.connect(user1).burn(burnAmount))
        .to.be.revertedWithCustomError(token, "ERC20InsufficientBalance")
        .withArgs(user1.address, mintAmount, burnAmount);
    });
  });

  describe("Transfers", function () {
    it("Should allow transfers between accounts", async function () {
      const mintAmount = parseUnits("100", 18);
      await token.connect(owner).mint(user1.address, mintAmount);

      await token.connect(user1).transfer(user2.address, mintAmount);

      const addr2Balance = await token.balanceOf(user2.address);
      expect(addr2Balance).to.equal(mintAmount);
    });

    it("Should revert if transfer amount exceeds balance", async function () {
      const transferAmount = parseUnits("100", 18);

      // try {
      //   await token.connect(user1).transfer(user2.address, transferAmount);
      // } catch (error) {
      //   // Gives error like: ERC20InsufficientBalance(
      //   // "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", 0, 100000000000000000000)
      //   console.error("Transfer error", error);
      // }
      // expect(true).to.equal(false); // This line ensures the test fails, and we see the error

      await expect(token.connect(user1).transfer(user2.address, transferAmount))
        .to.be.revertedWithCustomError(token, "ERC20InsufficientBalance")
        .withArgs(user1.address, 0, transferAmount);
    });
  });

  describe("ERC20Permit", function () {
    it("Should allow permit-based approvals", async function () {
      const mintAmount = parseUnits("100", 18);
      await token.connect(owner).mint(user1.address, mintAmount);

      const nonce = await token.nonces(user1.address);
      const deadline = MaxUint256;

      // Creating the permit
      const domain = {
        name: await token.name(),
        version: "1",
        chainId: (await owner.provider.getNetwork()).chainId,
        verifyingContract: await token.getAddress(),
      };
      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };
      const value = {
        owner: user1.address,
        spender: user2.address,
        value: mintAmount,
        nonce,
        deadline,
      };

      const signature = await user1.signTypedData(domain, types, value); // Sign the permit
      const { v, r, s } = ethers.Signature.from(signature);

      // Use the permit to approve
      await token.connect(user2).permit(user1.address, user2.address, mintAmount, deadline, v, r, s);

      const allowance = await token.allowance(user1.address, user2.address);
      expect(allowance).to.equal(mintAmount);
    });
  });
});
