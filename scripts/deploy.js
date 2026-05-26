const hre = require("hardhat");

async function main() {
  console.log("--------------------------------------------------");
  console.log("Starting deployment of GM contract on Arc Network...");
  console.log("--------------------------------------------------");

  // Retrieve the contract factory
  const GM = await hre.ethers.getContractFactory("GM");
  
  console.log("Deploying contract, please wait...");
  const gm = await GM.deploy();

  // Wait for the deployment transaction to be mined
  await gm.waitForDeployment();

  // Get the deployed contract address
  const contractAddress = await gm.getAddress();
  
  console.log("\n==================================================");
  console.log(`🎉 GM Contract Deployed Successfully!`);
  console.log(`Address: ${contractAddress}`);
  console.log(`Explorer Link: https://testnet.arcscan.app/address/${contractAddress}`);
  console.log("==================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed!");
    console.error(error);
    process.exit(1);
  });
