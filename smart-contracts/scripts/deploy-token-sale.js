// deploy-token-sale.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying TokenSale contract with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Read the deployment data to get the Finance Token address
  let deploymentData = {};
  const deploymentPath = path.join(__dirname, "../deployment.json");
  
  try {
    if (fs.existsSync(deploymentPath)) {
      const fileData = fs.readFileSync(deploymentPath, "utf8");
      deploymentData = JSON.parse(fileData);
    } else {
      console.log("No deployment.json found. Creating a new one after deployment.");
    }
  } catch (err) {
    console.error("Error reading deployment.json:", err);
    console.log("Will create a new deployment file after deployment.");
  }

  // Check if we have a Finance Token address
  const financeTokenAddress = deploymentData.tokenAddress;
  if (!financeTokenAddress) {
    console.error("Finance Token address not found in deployment.json. Please deploy the FinanceToken first.");
    process.exit(1);
  }

  console.log(`Using Finance Token address: ${financeTokenAddress}`);

  // Set the initial token price (0.0001 ETH per token in wei)
  const initialPrice = hre.ethers.parseEther("0.0001");
  console.log(`Setting initial token price to: ${initialPrice} wei`);

  // Deploy the TokenSale contract
  console.log("Deploying TokenSale contract...");
  const TokenSale = await hre.ethers.getContractFactory("TokenSale");
  const tokenSale = await TokenSale.deploy(financeTokenAddress, initialPrice);
  
  console.log("Waiting for deployment transaction to be mined...");
  await tokenSale.waitForDeployment();
  
  const tokenSaleAddress = await tokenSale.getAddress();
  console.log(`TokenSale deployed to: ${tokenSaleAddress}`);

  // Update the deployment data
  deploymentData.tokenSaleAddress = tokenSaleAddress;
  deploymentData.network = hre.network.name;
  deploymentData.updatedAt = new Date().toISOString();
  
  // Save the updated deployment data
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(deploymentData, null, 2)
  );
  console.log(`Updated deployment data saved to ${deploymentPath}`);

  // For easier frontend integration, also update the .env.local file
  const envPath = path.join(__dirname, "../../frontend/.env.local");
  try {
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8");
    }
    
    // Add or update the TOKEN_SALE_CONTRACT_ADDRESS
    if (envContent.includes("VITE_TOKEN_SALE_CONTRACT_ADDRESS=")) {
      envContent = envContent.replace(
        /VITE_TOKEN_SALE_CONTRACT_ADDRESS=.*/,
        `VITE_TOKEN_SALE_CONTRACT_ADDRESS=${tokenSaleAddress}`
      );
    } else {
      envContent += `\nVITE_TOKEN_SALE_CONTRACT_ADDRESS=${tokenSaleAddress}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`Updated frontend environment file at ${envPath}`);
  } catch (err) {
    console.warn(`Warning: Could not update frontend .env.local file: ${err.message}`);
  }

  // Update backend configuration if it exists
  const backendConfigPath = path.join(__dirname, "../../backend/appsettings.local.json");
  try {
    let backendConfig = {};
    if (fs.existsSync(backendConfigPath)) {
      const backendConfigContent = fs.readFileSync(backendConfigPath, "utf8");
      backendConfig = JSON.parse(backendConfigContent);
    }
    
    // Ensure the Blockchain configuration exists
    if (!backendConfig.Blockchain) {
      backendConfig.Blockchain = {};
    }
    
    // Update the TokenSale contract address
    backendConfig.Blockchain.TokenSaleContractAddress = tokenSaleAddress;
    
    fs.writeFileSync(backendConfigPath, JSON.stringify(backendConfig, null, 2));
    console.log(`Updated backend configuration at ${backendConfigPath}`);
  } catch (err) {
    console.warn(`Warning: Could not update backend configuration: ${err.message}`);
  }

  console.log("TokenSale deployment completed successfully!");

  // Final verification instructions
  console.log("\n=== NEXT STEPS ===");
  console.log("1. Transfer FIT tokens to the TokenSale contract for sale");
  console.log(`   Command: npx hardhat run scripts/transfer-tokens-to-sale.js --network ${hre.network.name}`);
  console.log("2. Verify the contract on Etherscan if desired:");
  console.log(`   Command: npx hardhat verify --network ${hre.network.name} ${tokenSaleAddress} ${financeTokenAddress} ${initialPrice}`);
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in deployment:", error);
    process.exit(1);
  });