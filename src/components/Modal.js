import React, { useState } from 'react';
import { prepareContractCall, sendTransaction } from 'thirdweb';
import { resolveImageUrl } from '../utils/resolveImageUrl'; // Adjust the path as needed
import styles from '../styles/Modal.module.css';

const Modal = ({ show, onClose, nft, onTransfer, onCreateTokenBoundAccount }) => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState(0);
  const [newName, setNewName] = useState('');

  const handleTransfer = () => {
    if (window.confirm('Are you sure you want to transfer this NFT? This action is irreversible. Please check the recipient address carefully.')) {
      onTransfer(recipientAddress, nft.id.toString());
    }
  };

  const handleWithdraw = async () => {
    try {
      const transaction = await prepareContractCall({
        contract: nft.contract, // The token-bound account contract
        method: "withdraw",
        params: [BigInt(amount)], // Ensure the amount is in BigInt format
      });

      const { transactionHash } = await sendTransaction({
        transaction,
        account: nft.owner, // The owner account
      });

      console.log("Withdrawal successful! Transaction hash:", transactionHash);
    } catch (error) {
      console.error("Error withdrawing funds:", error);
    }
  };

  const handleTransferFunds = async () => {
    try {
      const transaction = await prepareContractCall({
        contract: nft.contract, // The token-bound account contract
        method: "transferFunds",
        params: [recipientAddress, BigInt(amount)], // Ensure the amount is in BigInt format
      });

      const { transactionHash } = await sendTransaction({
        transaction,
        account: nft.owner, // The owner account
      });

      console.log("Transfer successful! Transaction hash:", transactionHash);
    } catch (error) {
      console.error("Error transferring funds:", error);
    }
  };

  const handleSetAccountName = async () => {
    try {
      const transaction = await prepareContractCall({
        contract: nft.contract, // The token-bound account contract
        method: "setAccountName",
        params: [newName],
      });

      const { transactionHash } = await sendTransaction({
        transaction,
        account: nft.owner, // The owner account
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

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className={styles.input}
        />
        <button onClick={handleWithdraw} className={styles.withdrawButton}>
          Withdraw Funds
        </button>
        <button onClick={handleTransferFunds} className={styles.transferButton}>
          Transfer Funds
        </button>

        <input
          type="text"
          placeholder="New Account Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className={styles.input}
        />
        <button onClick={handleSetAccountName} className={styles.setNameButton}>
          Set Account Name
        </button>

        <button onClick={() => onCreateTokenBoundAccount(nft.id.toString())} className={styles.createAccountButton}>
          Create Token Bound Account
        </button>
 
 
      </div>
    </div>
  );
};

export default Modal;
