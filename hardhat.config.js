require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

// Default dummy private key for local compilation/testing if .env is missing
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";

module.exports = {
  solidity: "0.8.20",
  networks: {
    // Local Hardhat Network (default for npx hardhat test)
    hardhat: {
      chainId: 1337
    },
    // Local Hardhat node running in separate terminal
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337
    },
    // Arc Testnet configuration
    arcTestnet: {
      url: "https://rpc.testnet.arc.network",
      chainId: 5042002,
      accounts: PRIVATE_KEY !== "" ? [PRIVATE_KEY] : [],
      // Arc testnet block confirmation speed is sub-second, so standard timeout is fine
      timeout: 20000
    }
  }
};
