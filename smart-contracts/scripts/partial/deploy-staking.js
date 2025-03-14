// Deploy only the Staking contract using existing token
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Existing contract addresses
const FINANCE_TOKEN_ADDRESS = "0xbc5E6482C17e843f005Ce158603563A40F801ad2";
const WALLET_ADDRESS = "0xdA430d80b23C9596D8977c7a5128cF3Be785B743";

async function main() {
  console.log("Starting deployment of Staking contract...");
  
  // Get signers
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contract with the account: ${deployer.address}`);
  
  // Deploy Staking
  console.log("Deploying Staking...");
  const Staking = await hre.ethers.getContractFactory("Staking");
  const staking = await Staking.deploy();
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log(`Staking deployed to: ${stakingAddress}`);
  
  // Create a staking pool with the finance token
  console.log("Creating staking pool with the finance token...");
  const stakingContract = await hre.ethers.getContractAt("Staking", stakingAddress);
  const rewardRate = hre.ethers.parseEther("0.01"); // 0.01 tokens per second
  const minStakeDuration = 86400; // 1 day in seconds
  const earlyUnstakeFee = 500; // 5%
  const maxCapacity = hre.ethers.parseEther("100000"); // 100,000 tokens max capacity
  
  const tx = await stakingContract.createPool(
    FINANCE_TOKEN_ADDRESS,
    rewardRate,
    minStakeDuration,
    earlyUnstakeFee,
    maxCapacity
  );
  await tx.wait();
  console.log("Staking pool created successfully");
  
  // Load existing deployment data or create new if it doesn't exist
  let deploymentData = {};
  const deploymentPath = path.join(__dirname, "../../deployment.json");
  
  try {
    if (fs.existsSync(deploymentPath)) {
      const existingData = fs.readFileSync(deploymentPath, 'utf8');
      deploymentData = JSON.parse(existingData);
      console.log("Loaded existing deployment data");
    }
  } catch (error) {
    console.log("No existing deployment data found, creating new");
  }
  
  // Update deployment data
  deploymentData = {
    ...deploymentData,
    network: hre.network.name,
    tokenAddress: FINANCE_TOKEN_ADDRESS,
    walletAddress: WALLET_ADDRESS,
    stakingAddress: stakingAddress,
    updatedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
  console.log(`Deployment data saved to: ${deploymentPath}`);
  
  // For frontend integration, update or create .env.local file
  const envPath = path.join(__dirname, "../../../frontend/.env.local");
  const envContent = `VITE_TOKEN_CONTRACT_ADDRESS=${FINANCE_TOKEN_ADDRESS}
VITE_WALLET_CONTRACT_ADDRESS=${WALLET_ADDRESS}
VITE_STAKING_CONTRACT_ADDRESS=${stakingAddress}
`;
  fs.writeFileSync(envPath, envContent);
  console.log(`Environment file created at: ${envPath}`);
  
  // For backend integration, update or create appsettings.local.json
  const backendConfigPath = path.join(__dirname, "../../../backend/appsettings.local.json");
  const backendConfig = {
    "Blockchain": {
      "TokenContractAddress": FINANCE_TOKEN_ADDRESS,
      "WalletContractAddress": WALLET_ADDRESS,
      "StakingContractAddress": stakingAddress
    }
  };
  fs.writeFileSync(backendConfigPath, JSON.stringify(backendConfig, null, 2));
  console.log(`Backend config created at: ${backendConfigPath}`);
  
  console.log("Staking deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
