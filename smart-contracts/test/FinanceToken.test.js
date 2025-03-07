const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FinanceToken", function () {
  let financeToken;
  let owner;
  let user1;
  let user2;
  const initialSupply = ethers.parseEther("1000000"); // 1 million tokens

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const FinanceToken = await ethers.getContractFactory("FinanceToken");
    financeToken = await FinanceToken.deploy(initialSupply);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await financeToken.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await financeToken.balanceOf(owner.address);
      expect(await financeToken.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      // Transfer 50 tokens from owner to user1
      const transferAmount = ethers.parseEther("50");
      await financeToken.transfer(user1.address, transferAmount);
      
      const user1Balance = await financeToken.balanceOf(user1.address);
      expect(user1Balance).to.equal(transferAmount);

      // Transfer 20 tokens from user1 to user2
      const user1ToUser2Transfer = ethers.parseEther("20");
      await financeToken.connect(user1).transfer(user2.address, user1ToUser2Transfer);
      
      const user2Balance = await financeToken.balanceOf(user2.address);
      expect(user2Balance).to.equal(user1ToUser2Transfer);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await financeToken.balanceOf(owner.address);
      
      // Try to send more tokens than the owner has
      await expect(
        financeToken.connect(user1).transfer(owner.address, 1)
      ).to.be.reverted;

      // Owner balance shouldn't have changed
      expect(await financeToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });
  });

  describe("Minting", function () {
    it("Should mint tokens by owner", async function () {
      const mintAmount = ethers.parseEther("100");
      await financeToken.mint(user1.address, mintAmount);
      
      expect(await financeToken.balanceOf(user1.address)).to.equal(mintAmount);
    });

    it("Should fail minting by non-owner", async function () {
      const mintAmount = ethers.parseEther("100");
      await expect(
        financeToken.connect(user1).mint(user1.address, mintAmount)
      ).to.be.reverted;
    });
  });

  describe("Burning", function () {
    it("Should burn own tokens", async function () {
      // First transfer some tokens to user1
      const transferAmount = ethers.parseEther("100");
      await financeToken.transfer(user1.address, transferAmount);
      
      // Now burn half of them
      const burnAmount = ethers.parseEther("50");
      await financeToken.connect(user1).burn(user1.address, burnAmount);
      
      expect(await financeToken.balanceOf(user1.address)).to.equal(transferAmount - burnAmount);
    });

    it("Should fail burning another user's tokens", async function () {
      // First transfer some tokens to user1
      const transferAmount = ethers.parseEther("100");
      await financeToken.transfer(user1.address, transferAmount);
      
      // Try to burn user1's tokens from user2
      const burnAmount = ethers.parseEther("50");
      await expect(
        financeToken.connect(user2).burn(user1.address, burnAmount)
      ).to.be.reverted;
    });

    it("Should allow owner to burn any user's tokens", async function () {
      // First transfer some tokens to user1
      const transferAmount = ethers.parseEther("100");
      await financeToken.transfer(user1.address, transferAmount);
      
      // Owner burns user1's tokens
      const burnAmount = ethers.parseEther("50");
      await financeToken.burn(user1.address, burnAmount);
      
      expect(await financeToken.balanceOf(user1.address)).to.equal(transferAmount - burnAmount);
    });
  });
});
