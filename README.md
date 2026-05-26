# ☀️ Arc GM Hub

A beginner-friendly, on-chain **Good Morning (GM)** application built specifically for the stablecoin-native L1 blockchain **Arc Network** (with full EVM-compatibility for other chains).

This project features:
* **Solidity Smart Contract (`GM.sol`)**: A lightweight contract tracking GM counts and custom messages on-chain.
* **Lightweight Hardhat Setup**: Stripped down to only what is necessary, bypassing heavy testing libraries to keep installation and compiling fast.
* **Modern Dark UI**: Glassmorphic, responsive, and animated user interface using pure HTML, CSS, and Vanilla JS (`ethers.js` via CDN) to keep it easy for beginners to understand.
* **Gas-Paid-in-USDC**: Includes helpful tips and automatic MetaMask RPC additions, since Arc Network uniquely uses USDC for native gas fees!

---

## 📁 Project Structure

```text
arc-gm-app/
├── contracts/
│   └── GM.sol              # The Solidity Smart Contract
├── scripts/
│   └── deploy.js           # Hardhat deployment script
├── frontend/
│   ├── index.html          # Clean HTML structure
│   ├── style.css           # Glassmorphism dark theme CSS
│   └── app.js              # Wallet connection & Ethers.js logic
├── hardhat.config.js       # Hardhat configurations targeting Arc Network
├── package.json            # Node.js package settings
├── .env.example            # Environment template for private keys
└── README.md               # This step-by-step guide
```

---

## 🚀 Step 1: Local Installation & Setup

We will first run the project locally on your machine.

### 1. Install Dependencies
Open your terminal, navigate to the `arc-gm-app` directory, and run the following command to install the required dev tools:
```bash
npm install
```
* **Explanation**: This reads `package.json` and downloads Hardhat (blockchain development environment), `@nomicfoundation/hardhat-ethers` (allows Hardhat to speak to contracts), and `ethers` (library for interacting with the blockchain).

### 2. Compile the Smart Contract
Verify the Solidity code compiled successfully by running:
```bash
npx hardhat compile
```
* **Explanation**: `npx hardhat compile` compiles your `GM.sol` Solidity contract into Web3 bytecode and JSON ABIs (stored in the newly created `artifacts/` folder).

---

## 💻 Step 2: Running & Testing Locally

Hardhat lets you spin up a local personal blockchain on your machine to test things for free.

### 1. Start a Local Node
Open a new terminal window in the `arc-gm-app` folder and run:
```bash
npx hardhat node
```
* **Explanation**: This starts a local Ethereum test node on `http://127.0.0.1:8545` and prints 20 dummy accounts pre-funded with 10,000 test ETH for development. Leave this running!

### 2. Deploy Locally
In your original terminal window, run:
```bash
npx hardhat run scripts/deploy.js --network localhost
```
* **Explanation**: This runs the deployment script targeting your local test node, deploys `GM.sol` to it, and prints the deployed contract address.
* *Note*: By default, the frontend (`frontend/app.js`) is pre-configured with the first local contract address (`0x5FbDB2315678afecb367f032d93F642f64180aa3`) so it works out of the box locally!

### 3. Open the Frontend
Since the frontend uses vanilla HTML/JS, you don't need any complex build servers! Simply open `frontend/index.html` in your browser. 
* To simulate a real server (recommended), you can run a simple HTTP server in the `frontend` folder:
  ```bash
  npx http-server frontend
  ```
  Then open the URL printed in the terminal (usually `http://localhost:8080`).

---

## 🌐 Step 3: Deploying to Arc Testnet

Once you are ready to publish on-chain, you can deploy to the live **Arc Testnet** blockchain!

### 1. Configure MetaMask for Arc Testnet
Add the Arc Testnet parameters to your MetaMask wallet:
* **Network Name**: Arc Testnet
* **RPC URL**: `https://rpc.testnet.arc.network`
* **Chain ID**: `5042002`
* **Currency Symbol**: `USDC`
* **Block Explorer**: `https://testnet.arcscan.app`

### 2. Get USDC Gas Tokens
On Arc Network, **USDC is the native gas token** (not ETH)! To execute transaction writes, you must have some testnet USDC:
1. Go to the official [Circle Faucet](https://faucet.circle.com/).
2. Select **Arc Testnet**.
3. Paste your MetaMask address and request **USDC**.

### 3. Set Up Your Private Key
1. Copy the `.env.example` file and rename it to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and replace `your_private_key_here` with your MetaMask private key (e.g. `0x123...`).
   * *Security Warning*: Never commit your `.env` file to Github or share it with anyone! It contains full control of your wallet.

### 4. Deploy to Arc Testnet

Depending on your wallet type, select one of the two methods below to deploy the contract:

#### Method A: Deploy via MetaMask (Requires Wallet Private Key)
Run the deploy script using your private key from `.env`:
```bash
npx hardhat run scripts/deploy.js --network arcTestnet
```
Copy the printed contract address (e.g. `0x...`).

#### Method B: Deploy via Circle Developer Console API (No Private Key Needed)
If you are using Developer-Controlled Wallets via Circle Console (where you only have a API key, Entity Secret, and Wallet ID but no raw private key):
1. The project includes a pre-built script [`scripts/deploy-circle.js`](file:///c:/Users/Shadow%20Recall/Downloads/arc-worker-bot/arc-worker-bot%20-%20Copy/arc-gm-app/scripts/deploy-circle.js) that reads your credentials from the main bot's `.env` and uses Circle's Smart Contract Platform API to deploy `GM.sol` using your Owner Developer Wallet.
2. Ensure you compile your contract first:
   ```bash
   npx hardhat compile
   ```
3. Run the Circle deployment script:
   ```bash
   node scripts/deploy-circle.js
   ```
4. This script will automatically initiate the contract deployment, poll for confirmation, print your testnet address, and **automatically update** the contract address inside `frontend/app.js` for you!

### 5. Update the Frontend Address
If you deployed using Method A, open `frontend/app.js`, locate line 7, and replace the contract address:
```javascript
const CONTRACT_ADDRESS = "YOUR_LIVE_CONTRACT_ADDRESS_HERE";
```
(If you deployed using Method B, this address has already been automatically updated in `frontend/app.js`!)
Save the file. Your website is now fully connected to the live Arc Testnet!

---

## 🐙 Step 4: Pushing to GitHub

To store your code and deploy it to hosting services, upload it to GitHub:

1. **Initialize Git**:
   ```bash
   git init
   ```
2. **Create `.gitignore`**:
   Ensure you don't commit your `.env` key or downloaded files. Create a `.gitignore` file:
   ```text
   node_modules/
   artifacts/
   cache/
   .env
   ```
3. **Commit and Push**:
   ```bash
   git add .
   git commit -m "First commit of Arc GM App"
   ```
4. Create a repository on GitHub, copy the remote repository URL, and push your code:
   ```bash
   git branch -M main
   git remote add origin YOUR_GITHUB_REPOSITORY_URL
   git push -u origin main
   ```

---

## ⚡ Step 5: Hosting on Cloudflare Pages (Free)

Cloudflare Pages is the fastest and most beginner-friendly way to host static websites for free.

### Method A: Connect directly to GitHub (Recommended)
1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your GitHub repository.
4. Set the build configurations:
   * **Framework preset**: `None`
   * **Build command**: Leave blank
   * **Build output directory**: `frontend`
5. Click **Save and Deploy**. Cloudflare will automatically build and deploy your site, giving you a custom `*.pages.dev` URL, and will update the site automatically every time you push code to GitHub!

### Method B: Drag and Drop Upload
If you don't want to use Git:
1. Log into Cloudflare Pages.
2. Click **Create a project** > **Direct Upload**.
3. Zip or drag-and-drop the `frontend` folder directly.
4. Click **Deploy**!
