const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Wallet", function () {
  let financeToken;
  let wallet;
  let owner;
  let user1;
  let user2;
  const initialSupply = ethers.parseEther("1000000"); // 1 million tokens

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy token contract
    const FinanceToken = await ethers.getContractFactory("FinanceToken");
    financeToken = await FinanceToken.deploy(initialSupply);
    
    // Deploy wallet contract
    const Wallet = await ethers.getContractFactory("Wallet");
    wallet = await Wallet.deploy();
    
    // Transfer some tokens to users for testing
    await financeToken.transfer(user1.address, ethers.parseEther("1000"));
    await financeToken.transfer(user2.address, ethers.parseEther("1000"));
  });

  describe("Deposit", function () {
    it("Should deposit tokens correctly", async function () {
      const depositAmount = ethers.parseEther("100");
      
      // Approve wallet to spend tokens
      await financeToken.connect(user1).approve(await wallet.getAddress(), depositAmount);
      
      // Deposit tokens
      await wallet.connect(user1).deposit(await financeToken.getAddress(), depositAmount);
      
      // Check wallet balance
      expect(await wallet.balanceOf(await financeToken.getAddress(), user1.address)).to.equal(depositAmount);
      
      // Check token balance in wallet contract
      expect(await financeToken.balanceOf(await wallet.getAddress())).to.equal(depositAmount);
    });

    it("Should fail if amount is zero", async function () {
      await expect(
        wallet.connect(user1).deposit(await financeToken.getAddress(), 0)
      ).to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should fail if not approved", async function () {
      const depositAmount = ethers.parseEther("100");
      
      // No approval given, should fail
      await expect(
        wallet.connect(user1).deposit(await financeToken.getAddress(), depositAmount)
      ).to.be.reverted;
    });
  });

  describe("Withdraw", function () {
    beforeEach(async function () {
      // Setup - deposit tokens first
      const depositAmount = ethers.parseEther("100");
      await financeToken.connect(user1).approve(await wallet.getAddress(), depositAmount);
      await wallet.connect(user1).deposit(await financeToken.getAddress(), depositAmount);
    });

    it("Should withdraw tokens correctly", async function () {
      const withdrawAmount = ethers.parseEther("50");
      const initialBalance = await financeToken.balanceOf(user1.address);
      
      // Withdraw tokens
      await wallet.connect(user1).withdraw(await financeToken.getAddress(), withdrawAmount);
      
      // Check wallet balance
      expect(await wallet.balanceOf(await financeToken.getAddress(), user1.address)).to.equal(ethers.parseEther("50"));
      
      // Check user token balance
      expect(await financeToken.balanceOf(user1.address)).to.equal(initialBalance + withdrawAmount);
    });

    it("Should fail if amount is zero", async function () {
      await expect(
        wallet.connect(user1).withdraw(await financeToken.getAddress(), 0)
      ).to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should fail if insufficient balance", async function () {
      const withdrawAmount = ethers.parseEther("101"); // More than deposited
      
      await expect(
        wallet.connect(user1).withdraw(await financeToken.getAddress(), withdrawAmount)
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Transfer between users", function () {
    beforeEach(async function () {
      // Setup - deposit tokens first
      const depositAmount = ethers.parseEther("100");
      await financeToken.connect(user1).approve(await wallet.getAddress(), depositAmount);
      await wallet.connect(user1).deposit(await financeToken.getAddress(), depositAmount);
    });

    it("Should transfer tokens between users correctly", async function () {
      const transferAmount = ethers.parseEther("30");
      
      // Transfer tokens from user1 to user2 within the wallet
      await wallet.connect(user1).transfer(await financeToken.getAddress(), user2.address, transferAmount);
      
      // Check balances
      expect(await wallet.balanceOf(await financeToken.getAddress(), user1.address)).to.equal(ethers.parseEther("70"));
      expect(await wallet.balanceOf(await financeToken.getAddress(), user2.address)).to.equal(transferAmount);
    });

    it("Should fail if amount is zero", async function () {
      await expect(
        wallet.connect(user1).transfer(await financeToken.getAddress(), user2.address, 0)
      ).to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should fail if transferring to self", async function () {
      await expect(
        wallet.connect(user1).transfer(await financeToken.getAddress(), user1.address, ethers.parseEther("10"))
      ).to.be.revertedWith("Cannot transfer to self");
    });

    it("Should fail if insufficient balance", async function () {
      const transferAmount = ethers.parseEther("101"); // More than deposited
      
      await expect(
        wallet.connect(user1).transfer(await financeToken.getAddress(), user2.address, transferAmount)
      ).to.be.revertedWith("Insufficient balance");
    });
  });
});
