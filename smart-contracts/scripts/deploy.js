// Deploy contracts to testnet
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment process...");
  
  // Get signers
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);
  
  // Deploy Finance Token with 1 million initial supply (with 18 decimals)
  console.log("Deploying FinanceToken...");
  const initialSupply = hre.ethers.parseEther("1000000");
  const FinanceToken = await hre.ethers.getContractFactory("FinanceToken");
  const financeToken = await FinanceToken.deploy(initialSupply);
  await financeToken.waitForDeployment();
  console.log(`FinanceToken deployed to: ${await financeToken.getAddress()}`);
  
  // Deploy Wallet
  console.log("Deploying Wallet...");
  const Wallet = await hre.ethers.getContractFactory("Wallet");
  const wallet = await Wallet.deploy();
  await wallet.waitForDeployment();
  console.log(`Wallet deployed to: ${await wallet.getAddress()}`);
  
  // Deploy Staking
  console.log("Deploying Staking...");
  const Staking = await hre.ethers.getContractFactory("Staking");
  const staking = await Staking.deploy();
  await staking.waitForDeployment();
  console.log(`Staking deployed to: ${await staking.getAddress()}`);
  
  // Create a staking pool with the finance token
  console.log("Creating staking pool with the finance token...");
  const stakingContract = await hre.ethers.getContractAt("Staking", await staking.getAddress());
  const rewardRate = hre.ethers.parseEther("0.01"); // 0.01 tokens per second
  const minStakeDuration = 86400; // 1 day in seconds
  const earlyUnstakeFee = 500; // 5%
  const maxCapacity = hre.ethers.parseEther("100000"); // 100,000 tokens max capacity
  
  const tx = await stakingContract.createPool(
    await financeToken.getAddress(),
    rewardRate,
    minStakeDuration,
    earlyUnstakeFee,
    maxCapacity
  );
  await tx.wait();
  console.log("Staking pool created successfully");
  
  // Save deployment addresses
  const tokenAddress = await financeToken.getAddress();
  const walletAddress = await wallet.getAddress();
  const stakingAddress = await staking.getAddress();
  
  const deploymentData = {
    network: hre.network.name,
    tokenAddress: tokenAddress,
    walletAddress: walletAddress,
    stakingAddress: stakingAddress,
    deployedAt: new Date().toISOString()
  };
  
  const deploymentPath = path.join(__dirname, "../deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
  console.log(`Deployment data saved to: ${deploymentPath}`);
  
  // For easier frontend integration, also create a .env.local file
  const envPath = path.join(__dirname, "../../frontend/.env.local");
  const envContent = `VITE_TOKEN_CONTRACT_ADDRESS=${tokenAddress}
VITE_WALLET_CONTRACT_ADDRESS=${walletAddress}
VITE_STAKING_CONTRACT_ADDRESS=${stakingAddress}
`;
  fs.writeFileSync(envPath, envContent);
  console.log(`Environment file created at: ${envPath}`);
  
  // For backend integration, create an appsettings.local.json file
  const backendConfigPath = path.join(__dirname, "../../backend/appsettings.local.json");
  const backendConfig = {
    "Blockchain": {
      "TokenContractAddress": tokenAddress,
      "WalletContractAddress": walletAddress,
      "StakingContractAddress": stakingAddress
    }
  };
  fs.writeFileSync(backendConfigPath, JSON.stringify(backendConfig, null, 2));
  console.log(`Backend config created at: ${backendConfigPath}`);
  
  console.log("Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
