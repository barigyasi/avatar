import React, { useState } from 'react';
import styles from '../styles/Modal.module.css';

const Modal = ({ show, onClose, nft, onTransfer }) => {
  const [recipientAddress, setRecipientAddress] = useState('');

  const handleTransfer = () => {
    if (window.confirm('Are you sure you want to transfer this NFT? This action is irreversible. Please check the recipient address carefully.')) {
      onTransfer(recipientAddress, nft.id.toString());
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
        {nft.metadata.image && <img src={nft.metadata.image} alt={nft.metadata.name} className={styles.nftImage} />}
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
      </div>
    </div>
  );
};

export default Modal;
