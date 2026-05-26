const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { initiateSmartContractPlatformClient } = require("@circle-fin/smart-contract-platform");

// Read from root bot's .env to load Circle API keys
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") }); 

// Load wallets.json from root bot's state to get Developer Wallet ID
const walletsPath = path.resolve(__dirname, "../../runtime/worker-01/state/wallets.json");
if (!fs.existsSync(walletsPath)) {
  console.error("Error: wallets.json not found in root worker state directory!");
  console.log("Make sure you run the main bot once to generate developer wallets.");
  process.exit(1);
}
const wallets = JSON.parse(fs.readFileSync(walletsPath, "utf-8"));
const walletId = wallets.owner.id;

// Load compiled artifacts of GM contract
const gmArtifactPath = path.resolve(__dirname, "../artifacts/contracts/GM.sol/GM.json");
if (!fs.existsSync(gmArtifactPath)) {
  console.error("Error: Compiled GM.json not found!");
  console.log("Please compile the contract first by running: npx hardhat compile");
  process.exit(1);
}
const gmArtifact = JSON.parse(fs.readFileSync(gmArtifactPath, "utf-8"));

const abi = gmArtifact.abi;
const bytecode = gmArtifact.bytecode;

const apiKey = process.env.CIRCLE_API_KEY;
const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

if (!apiKey || !entitySecret) {
  console.error("Error: CIRCLE_API_KEY or CIRCLE_ENTITY_SECRET is missing from root .env!");
  process.exit(1);
}

const client = initiateSmartContractPlatformClient({
  apiKey,
  entitySecret
});

async function deploy() {
  console.log("--------------------------------------------------");
  console.log("Deploying GM contract using Circle Console API...");
  console.log(`Wallet ID (Owner): ${walletId}`);
  console.log("--------------------------------------------------");

  try {
    const response = await client.deployContract({
      idempotencyKey: crypto.randomUUID(),
      name: "GMContract",
      description: "Arc GM Smart Contract deployment",
      walletId: walletId,
      blockchain: "ARC-TESTNET",
      abiJson: JSON.stringify(abi),
      bytecode: bytecode,
      constructorParameters: [],
      fee: {
        type: "level",
        config: {
          feeLevel: "MEDIUM"
        }
      }
    });

    const contractId = response.data?.contractId;
    const transactionId = response.data?.transactionId;

    if (!contractId) {
      throw new Error("Failed to deploy contract - no contractId returned");
    }

    console.log(`\nDeployment initiated successfully!`);
    console.log(`Contract ID: ${contractId}`);
    console.log(`Transaction ID: ${transactionId}`);
    console.log("Waiting for contract address confirmation (polling)...");

    // Poll for address
    let contractAddress = null;
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const resp = await client.getContract({ id: contractId });
        const status = resp.data?.contract?.status;
        const address = resp.data?.contract?.contractAddress;
        
        if (address && address !== "0x0000000000000000000000000000000000000000") {
          contractAddress = address;
          break;
        }
        if (status === "FAILED") {
          throw new Error("Contract deployment failed in status check");
        }
      } catch (err) {
        if (err.message && err.message.includes("failed")) throw err;
      }
    }

    if (!contractAddress) {
      throw new Error("Timeout waiting for contract deployment address");
    }

    console.log("\n==================================================");
    console.log(`🎉 GM Contract Deployed Successfully via Circle Console!`);
    console.log(`Address: ${contractAddress}`);
    console.log(`Explorer Link: https://testnet.arcscan.app/address/${contractAddress}`);
    console.log("==================================================\n");

    // Update the frontend address automatically!
    const appJsPath = path.resolve(__dirname, "../frontend/app.js");
    if (fs.existsSync(appJsPath)) {
      let appJs = fs.readFileSync(appJsPath, "utf-8");
      appJs = appJs.replace(/const CONTRACT_ADDRESS = "[^"]*";/, `const CONTRACT_ADDRESS = "${contractAddress}";`);
      fs.writeFileSync(appJsPath, appJs);
      console.log(`Updated CONTRACT_ADDRESS in frontend/app.js to: ${contractAddress}`);
    }

  } catch (err) {
    console.error("Deployment failed!");
    console.error(err);
    if (err.response) {
      console.error("Response data:", JSON.stringify(err.response.data, null, 2));
    }
    console.error("Error details:");
    for (const key of Object.getOwnPropertyNames(err)) {
      try {
        console.error(`  ${key}:`, typeof err[key] === "object" ? JSON.stringify(err[key], null, 2) : err[key]);
      } catch {}
    }
    process.exit(1);
  }
}

deploy();
