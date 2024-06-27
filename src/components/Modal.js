import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { prepareContractCall, sendTransaction } from 'thirdweb';
import { resolveImageUrl } from '../utils/resolveImageUrl'; // Adjust the path as needed
import styles from '../styles/Modal.module.css';
import { getBalance } from 'thirdweb/extensions/erc20';

const NFT_COLLECTION_ADDRESS = "0x92F2666443EBFa7129f39c9E43758B33CD5D73F8";
const ERC6551_REGISTRY_ADDRESS = "0xF1d73C35BF140c6ad27e1573F67056c3EB0d48E8";
const BLOCK_STEP = 1024;
const ERC_20_CONTRACT = "0x2159e26d5E453ea4627E0ADFE364c3099419F16C";

const Modal = ({ show, onClose, nft, onTransfer, onCreateTokenBoundAccount }) => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [withdrawRecipient, setWithdrawRecipient] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [newName, setNewName] = useState('');
  const [tokenBoundAccount, setTokenBoundAccount] = useState(null);
  const [cachedLogs, setCachedLogs] = useState([]);
  const [balance, setBalance] = useState('');

  useEffect(() => {
    if (nft) {
      checkTokenBoundAccount(nft.id);
    }

    return () => {
      setTokenBoundAccount(null); // Reset tokenBoundAccount when component is unmounted or nft changes
    };
  }, [nft]);

  const fetchLogsInRange = async (provider, fromBlock, toBlock) => {
    try {
      const contract = new ethers.Contract(ERC6551_REGISTRY_ADDRESS, [
        'event AccountCreated(address indexed account, address indexed implementation, uint256 chainId, address indexed tokenContract, uint256 tokenId, uint256 salt)'
      ], provider);

      const filter = contract.filters.AccountCreated(null, null, null, null); // Simplify filter initially
      const logs = await contract.queryFilter(filter, fromBlock, toBlock);
      console.log(`Fetched logs from block ${fromBlock} to ${toBlock}:`, logs); // Log the fetched logs
      return logs;
    } catch (error) {
      console.error(`Error fetching logs from block ${fromBlock} to ${toBlock}:`, error);
      return [];
    }
  };

  const checkTokenBoundAccount = async (tokenId) => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
      const latestBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(latestBlock - BLOCK_STEP * 10, 0); // Only scan the last 10,240 blocks
      let events = [];

      // Check if we already have logs cached
      if (cachedLogs.length === 0) {
        const batchEvents = await fetchLogsInRange(provider, fromBlock, latestBlock);
        events = events.concat(batchEvents);
        setCachedLogs(events); // Cache the fetched logs
      } else {
        events = cachedLogs;
      }

      // Iterate over all fetched events to find the matching tokenId
      for (const event of events) {
        const eventTokenId = ethers.BigNumber.from(event.args[3]).toString(); // args[4] is tokenId
        console.log(`Checking event with tokenId: ${eventTokenId}`);
        if (eventTokenId === tokenId.toString()) {
          const account = event.args[2]; // args[0] is account
          const accountHex = `0x${BigInt(account).toString(16)}`; // Convert to hex and add 0x prefix
          console.log(`Account for tokenId ${eventTokenId}: ${accountHex}`);
          setTokenBoundAccount(accountHex);
          return; // Exit after finding the matching event
        }
      }
      
      console.log(`No token-bound account found for tokenId: ${tokenId}`);
    } catch (error) {
      console.error('Error checking token-bound account:', error);
    }
  };

  const handleTransfer = () => {
    if (window.confirm('Are you sure you want to transfer this NFT? This action is irreversible. Please check the recipient address carefully.')) {
      onTransfer(recipientAddress, nft.id.toString());
    }
  };

  const handleWithdraw = async () => {
    try {
      const transaction = await prepareContractCall({
        contract: tokenBoundAccount, // The token-bound account contract
        method: "withdraw",
        params: [ethers.utils.parseEther(amount)], // Ensure the amount is parsed correctly
      });

      const { transactionHash } = await sendTransaction({
        transaction,
        account: tokenBoundAccount, // The token-bound account
      });

      console.log("Withdrawal successful! Transaction hash:", transactionHash);
      // Update balance after withdrawal
      await handleCheckBalance();
    } catch (error) {
      console.error("Error withdrawing funds:", error);
    }
  };

  const handleTransferFunds = async () => {
    try {
      const transaction = await prepareContractCall({
        contract: tokenBoundAccount, // The token-bound account contract
        method: "transfer",
        params: [transferRecipient, ethers.utils.parseEther(amount)], // Ensure the amount is parsed correctly
      });

      const { transactionHash } = await sendTransaction({
        transaction,
        account: tokenBoundAccount, // The token-bound account
      });

      console.log("Transfer successful! Transaction hash:", transactionHash);
      // Update balance after transfer
      await handleCheckBalance();
    } catch (error) {
      console.error("Error transferring funds:", error);
    }
  };

  const handleCheckBalance = async () => {
    try {
      if (tokenBoundAccount) {
        const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
        const contract = new ethers.Contract(ERC_20_CONTRACT, [
          'function balanceOf(address owner) view returns (uint256)'
        ], provider);
        const balance = await contract.balanceOf(tokenBoundAccount);
        setBalance(ethers.utils.formatEther(balance));
      }
    } catch (error) {
      console.error('Error checking balance:', error);
    }
  };

  const handleSetAccountName = async () => {
    try {
      const transaction = await prepareContractCall({
        contract: tokenBoundAccount, // The token-bound account contract
        method: "setAccountName",
        params: [newName],
      });

      const { transactionHash } = await sendTransaction({
        transaction,
        account: tokenBoundAccount, // The token-bound account
      });

      console.log("Set account name successful! Transaction hash:", transactionHash);
    } catch (error) {
      console.error("Error setting account name:", error);
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <span className={styles.close} onClick={onClose}>&times;</span>
        <h2>{nft.metadata.name}</h2>
        {nft.metadata.image && <img src={resolveImageUrl(nft.metadata.image)} alt={nft.metadata.name} className={styles.nftImage} />}
        
        <input
          type="text"
          placeholder="Recipient Address"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          className={styles.input}
        />
        <button onClick={handleTransfer} className={styles.transferButton}>
          Transfer NFT
        </button>

        {tokenBoundAccount && (
          <>
            <p>Token-bound account: {tokenBoundAccount}</p>
            <button onClick={handleCheckBalance} className={styles.transferButton}>
              Check Balance
            </button>
            <div>PGC Balance: {balance}</div>
            
            <input
              type="text"
              placeholder="Amount to Withdraw"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={styles.input}
            />
            <input
              type="text"
              placeholder="Recipient Address for Withdraw"
              value={withdrawRecipient}
              onChange={(e) => setWithdrawRecipient(e.target.value)}
              className={styles.input}
            />
            <button onClick={handleWithdraw} className={styles.withdrawButton}>
              Withdraw Funds
            </button>

            <input
              type="text"
              placeholder="Recipient Address for Transfer"
              value={transferRecipient}
              onChange={(e) => setTransferRecipient(e.target.value)}
              className={styles.input}
            />
            <button onClick={handleTransferFunds} className={styles.transferButton}>
              Transfer Funds
            </button>
          </>
        )}

        <button onClick={() => onCreateTokenBoundAccount(nft.id.toString())} className={styles.createAccountButton}>
          Create Token Bound Account
        </button>
      </div>
    </div>
  );
};

export default Modal;
