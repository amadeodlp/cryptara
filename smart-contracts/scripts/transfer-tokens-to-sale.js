// transfer-tokens-to-sale.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Read the deployment data
  let deploymentData = {};
  const deploymentPath = path.join(__dirname, "../deployment.json");
  
  try {
    if (fs.existsSync(deploymentPath)) {
      const fileData = fs.readFileSync(deploymentPath, "utf8");
      deploymentData = JSON.parse(fileData);
    } else {
      console.error("deployment.json not found. Please deploy contracts first.");
      process.exit(1);
    }
  } catch (err) {
    console.error("Error reading deployment.json:", err);
    process.exit(1);
  }

  // Check if we have the necessary contract addresses
  const tokenAddress = deploymentData.tokenAddress;
  const tokenSaleAddress = deploymentData.tokenSaleAddress;
  
  if (!tokenAddress) {
    console.error("Finance Token address not found in deployment.json.");
    process.exit(1);
  }
  
  if (!tokenSaleAddress) {
    console.error("TokenSale address not found in deployment.json. Please deploy the TokenSale contract first.");
    process.exit(1);
  }

  console.log(`Finance Token address: ${tokenAddress}`);
  console.log(`TokenSale address: ${tokenSaleAddress}`);

  // Get the token contract instance
  const financeToken = await hre.ethers.getContractAt("FinanceToken", tokenAddress);
  
  // Amount of tokens to transfer (e.g., 100,000 tokens)
  const tokensToTransfer = hre.ethers.parseEther("100000");
  console.log(`Transferring ${hre.ethers.formatEther(tokensToTransfer)} FIT tokens to the TokenSale contract...`);

  // Check deployer's token balance
  const deployerBalance = await financeToken.balanceOf(deployer.address);
  console.log(`Deployer balance: ${hre.ethers.formatEther(deployerBalance)} FIT tokens`);
  
  if (deployerBalance < tokensToTransfer) {
    console.error(`Not enough tokens. Deployer only has ${hre.ethers.formatEther(deployerBalance)} FIT tokens.`);
    process.exit(1);
  }

  // Transfer tokens to the TokenSale contract
  const tx = await financeToken.transfer(tokenSaleAddress, tokensToTransfer);
  console.log(`Transaction hash: ${tx.hash}`);
  console.log("Waiting for transaction to be mined...");
  
  await tx.wait();
  console.log("Transaction confirmed!");

  // Verify the balance after transfer
  const saleContractBalance = await financeToken.balanceOf(tokenSaleAddress);
  console.log(`TokenSale contract now has ${hre.ethers.formatEther(saleContractBalance)} FIT tokens available for sale.`);

  console.log("Token transfer completed successfully!");
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error transferring tokens:", error);
    process.exit(1);
  });