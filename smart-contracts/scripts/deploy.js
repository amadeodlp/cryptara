const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  // Deploy FinanceToken contract
  const initialSupply = ethers.parseEther("1000000"); // 1 million tokens with 18 decimals
  const FinanceToken = await ethers.getContractFactory("FinanceToken");
  const financeToken = await FinanceToken.deploy(initialSupply);
  await financeToken.waitForDeployment();
  
  const financeTokenAddress = await financeToken.getAddress();
  console.log(`FinanceToken deployed to: ${financeTokenAddress}`);

  // Deploy Wallet contract
  const Wallet = await ethers.getContractFactory("Wallet");
  const wallet = await Wallet.deploy();
  await wallet.waitForDeployment();
  
  const walletAddress = await wallet.getAddress();
  console.log(`Wallet deployed to: ${walletAddress}`);

  console.log("Deployment completed!");

  console.log("Contract addresses:");
  console.log("-------------------");
  console.log(`FinanceToken: ${financeTokenAddress}`);
  console.log(`Wallet: ${walletAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
