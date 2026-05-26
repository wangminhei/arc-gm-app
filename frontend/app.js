// Application State Variables
let provider = null; // Browser wallet provider (for signing transactions)
const readProvider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network"); // Public RPC provider (for reading data)
let signer = null;
let contract = null;
let userAddress = null;

// Replace this with your deployed contract address after running the deploy script!
const CONTRACT_ADDRESS = "0x45940adebc36c323adbcaeb6a71b755107abf880";

// Human-readable ABI - very simple and clean!
const CONTRACT_ABI = [
  "function totalGMs() public view returns (uint256)",
  "function sayGM(string calldata _message) external",
  "function getHistory() external view returns (tuple(address sender, string message, uint256 timestamp)[])",
  "event NewGM(address indexed sender, string message, uint256 timestamp)"
];

// Arc Testnet connection details for MetaMask auto-switching
const ARC_TESTNET_PARAMS = {
  chainId: "0x4cef52", // 5042002 in hex
  chainName: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18
  },
  rpcUrls: ["https://rpc.testnet.arc.network"],
  blockExplorerUrls: ["https://testnet.arcscan.app"]
};

// DOM Elements
const btnConnect = document.getElementById("btn-connect");
const connectText = document.getElementById("connect-text");
const btnSayGM = document.getElementById("btn-say-gm");
const gmMessageInput = document.getElementById("gm-message");
const totalGmsEl = document.getElementById("total-gms");
const gmHistoryList = document.getElementById("gm-history-list");
const feedLoader = document.getElementById("feed-loader");
const toastEl = document.getElementById("toast");

// Initialize application on load
window.addEventListener("DOMContentLoaded", async () => {
  // Initialize Lucide icons
  lucide.createIcons();
  
  // Set up event listeners
  btnConnect.addEventListener("click", connectWallet);
  btnSayGM.addEventListener("click", submitGM);

  // Load initial read-only state using public RPC (works even without wallet connected!)
  if (CONTRACT_ADDRESS !== "YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE") {
    await loadOnChainData();
    listenToEvents();
  } else {
    feedLoader.innerHTML = `
      <i data-lucide="alert-triangle" class="text-warning"></i>
      <span>Please deploy the contract and update <code>CONTRACT_ADDRESS</code> in <code>app.js</code>!</span>
    `;
    lucide.createIcons();
  }

  // If MetaMask/OKX is installed, check if already connected
  if (typeof window.ethereum !== "undefined") {
    provider = new ethers.BrowserProvider(window.ethereum);

    // Check if wallet is already authorized
    const accounts = await provider.listAccounts();
    if (accounts.length > 0) {
      await handleAccountsChanged(accounts);
    }

    // Listen for account/network changes
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", () => window.location.reload());
  } else {
    // No MetaMask/OKX detected
    btnConnect.disabled = true;
    connectText.textContent = "Wallet Missing";
  }
});

// Load global GM stats and feed history from the contract
async function loadOnChainData() {
  try {
    // Create read-only contract instance using the public RPC provider
    const readContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readProvider);
    
    // Get total GMs
    const total = await readContract.totalGMs();
    totalGmsEl.textContent = total.toString();
    
    // Get history
    const history = await readContract.getHistory();
    renderHistory(history);
  } catch (error) {
    console.error("Error loading on-chain data:", error);
    feedLoader.innerHTML = `
      <i data-lucide="x-circle" class="text-danger"></i>
      <span>Error connecting to smart contract. Make sure you are on Arc Testnet!</span>
    `;
    lucide.createIcons();
  }
}

// Render history feed items
function renderHistory(history) {
  if (history.length === 0) {
    gmHistoryList.innerHTML = `
      <div class="feed-placeholder">
        <i data-lucide="smile" class="text-muted" size="32"></i>
        <span>No GMs sent yet. Be the first!</span>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  // Hide loader
  if (feedLoader) feedLoader.style.display = "none";

  // Sort history newest first
  const sortedHistory = [...history].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

  let html = "";
  sortedHistory.forEach(item => {
    const sender = item.sender;
    const message = item.message;
    const time = new Date(Number(item.timestamp) * 1000).toLocaleString();
    const shortAddress = `${sender.substring(0, 6)}...${sender.substring(sender.length - 4)}`;
    
    html += `
      <div class="feed-item">
        <div class="feed-item-header">
          <a href="https://testnet.arcscan.app/address/${sender}" target="_blank" class="sender-address" title="Click to view address on ArcScan">
            ${shortAddress}
          </a>
          <span class="timestamp">${time}</span>
        </div>
        <div class="message-content">${escapeHtml(message)}</div>
      </div>
    `;
  });

  gmHistoryList.innerHTML = html;
}

// Setup live event listener for real-time feed updates
function listenToEvents() {
  const readContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readProvider);
  readContract.on("NewGM", async (sender, message, timestamp) => {
    console.log("New GM event detected on-chain!", sender, message, timestamp);
    // Reload on-chain data to capture changes
    await loadOnChainData();
    showToast("New GM logged on-chain!");
  });
}

// Connect user wallet and request network switch to Arc Testnet
async function connectWallet() {
  try {
    btnConnect.disabled = true;
    connectText.textContent = "Connecting...";

    // Request accounts from wallet
    const accounts = await provider.send("eth_requestAccounts", []);
    await handleAccountsChanged(accounts);
    
    // Switch to Arc Testnet if needed
    await switchToArcTestnet();
  } catch (error) {
    console.error("Connection failed:", error);
    showToast("Connection failed!", true);
    resetConnectButton();
  }
}

// Switch MetaMask/OKX network to Arc Testnet
async function switchToArcTestnet() {
  try {
    // Request network switch
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_TESTNET_PARAMS.chainId }]
    });
    showToast("Switched to Arc Testnet");
  } catch (error) {
    console.warn("wallet_switchEthereumChain failed, attempting wallet_addEthereumChain...", error);
    
    // Try to add the chain to the wallet regardless of error code (handles OKX and other wallets better)
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [ARC_TESTNET_PARAMS]
      });
      showToast("Arc Testnet added successfully!");
    } catch (addError) {
      console.error("Failed to add network:", addError);
      showToast("Failed to add Arc Testnet to wallet", true);
    }
  }
}

// Process account status changes
async function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    // User disconnected wallet
    userAddress = null;
    signer = null;
    contract = null;
    resetConnectButton();
    btnSayGM.disabled = true;
  } else {
    // User connected wallet
    userAddress = accounts[0];
    signer = await provider.getSigner();
    
    // Writable contract instance
    if (CONTRACT_ADDRESS !== "YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE") {
      contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      btnSayGM.disabled = false;
    }
    
    // Format connect button text
    const shortAddr = `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`;
    btnConnect.classList.add("btn-connected");
    connectText.textContent = shortAddr;
    btnConnect.disabled = false;
  }
}

// Submit a GM transaction to the smart contract
async function submitGM() {
  const message = gmMessageInput.value.trim() || "GM! ☀️";
  
  try {
    btnSayGM.disabled = true;
    const originalText = btnSayGM.querySelector("span").textContent;
    btnSayGM.querySelector("span").textContent = "Preparing...";
    
    // Ensure we are connected to Arc Testnet before submitting transaction
    if (provider) {
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== 5042002) {
        showToast("Switching network to Arc Testnet...");
        await switchToArcTestnet();
        // Refresh signer and contract reference after network switch
        signer = await provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      }
    }

    btnSayGM.querySelector("span").textContent = "Sending Transaction...";
    showToast("Please sign transaction in your wallet...");

    // Send the state-changing transaction to the contract
    const tx = await contract.sayGM(message);
    
    showToast("Transaction submitted! Waiting for block confirmation...");
    btnSayGM.querySelector("span").textContent = "Mining Block...";
    
    // Wait for the transaction to be mined
    await tx.wait();
    
    showToast("🎉 GM logged on-chain successfully!");
    gmMessageInput.value = "GM! ☀️"; // Reset message input
    
    // Refresh stats
    await loadOnChainData();
    
    btnSayGM.disabled = false;
    btnSayGM.querySelector("span").textContent = originalText;
  } catch (error) {
    console.error("Transaction failed:", error);
    showToast("Transaction rejected or failed!", true);
    btnSayGM.disabled = false;
    btnSayGM.querySelector("span").textContent = "Say GM!";
  }
}

// Helper to reset the connect button UI state
function resetConnectButton() {
  btnConnect.classList.remove("btn-connected");
  connectText.textContent = "Connect Wallet";
  btnConnect.disabled = false;
}

// Show a customizable toast notification
function showToast(message, isError = false) {
  toastEl.textContent = message;
  if (isError) {
    toastEl.classList.add("error");
  } else {
    toastEl.classList.remove("error");
  }
  toastEl.classList.add("show");
  
  setTimeout(() => {
    toastEl.classList.remove("show");
  }, 3500);
}

// Escapes raw HTML to prevent XSS vulnerability
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
