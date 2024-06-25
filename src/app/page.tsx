"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useActiveAccount, ConnectButton } from "thirdweb/react";
import { getContract, sendAndConfirmTransaction, createThirdwebClient, defineChain, NFT, prepareContractCall, sendTransaction } from "thirdweb";
import { mintWithSignature, getOwnedNFTs, transferFrom } from "thirdweb/extensions/erc721";
import { ThirdwebStorage } from "@thirdweb-dev/storage";
import { createWallet } from "thirdweb/wallets";
import { baseSepolia } from "thirdweb/chains";
import AvatarCanvas from "../components/AvatarCanvas";
import Modal from "../components/Modal";
import styles from "../styles/Home.module.css";
import { resolveName } from "thirdweb/extensions/ens";
import nftStyles from "../styles/NFTpage.module.css";
import { resolveImageUrl } from '../utils/resolveImageUrl'; // Adjust the path as needed

const NFT_COLLECTION_ADDRESS = "0x92F2666443EBFa7129f39c9E43758B33CD5D73F8";
const ERC6551_REGISTRY_ADDRESS = "0xF1d73C35BF140c6ad27e1573F67056c3EB0d48E8";
const ERC6551_ACCOUNT_ADDRESS = "0xE4584236E1C384CDcb541685a5d4E849e3fE15ab";

export default function Home() {
  const clientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID;
  const storageClientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID;
  const storageSecretKey = process.env.TW_SECRET_KEY;
  const router = useRouter();

  if (!clientId) {
    throw new Error("CLIENT_ID is not defined in environment variables");
  }

  const account = useActiveAccount();
  const [wallet, setWallet] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<{ payload: any, signature: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nftName, setNftName] = useState<string>("");
  const [eyeImage, setEyeImage] = useState<string>("/avatars/eye/eyes_1.png");
  const [mouthImage, setMouthImage] = useState<string>("/avatars/mouth/mouth_1.png");
  const [headImage, setHeadImage] = useState<string>("/avatars/head/rabbit.png");
  const [topImage, setTopImage] = useState<string>("/avatars/top/blue_top.png");
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const canvasRef = useRef<any>();
  const [activeTab, setActiveTab] = useState<'mint' | 'view'>('mint');
  const [ownedNFTs, setOwnedNFTs] = useState<NFT[] | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (account?.address) {
      setWallet(account.address);
      fetchEnsName(account.address);
    }
  }, [account]);

  const client = createThirdwebClient({
    clientId: clientId,
  });

  const contract = getContract({
    client,
    chain: defineChain(84532),
    address: NFT_COLLECTION_ADDRESS,
  });

  const fetchEnsName = async (address: string) => {
    try {
      const ensName = await resolveName({
        client,
        address: address,
      });
      if (ensName) {
        setCreatorName(ensName);
      } else {
        setCreatorName(address.slice(0, 3) + '...' + address.slice(-3));
      }
    } catch (error) {
      console.error("Error resolving ENS name:", error);
      setCreatorName(address.slice(0, 3) + '...' + address.slice(-3));
    }
  };

  async function getSignature(wallet: string, imageUrl: string) {
    try {
      const response = await fetch(`/api/server`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authorAddress: wallet,
          nftName: nftName || "",
          image: imageUrl,
        }),
      });
      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.error || "Failed to fetch signature");
      }
      return response.json();
    } catch (error) {
      console.error("Error fetching signature:", error);
      setError("Error fetching signature: " + (error as Error).message);
      throw error;
    }
  }

  async function mint() {
    try {
      if (!wallet) {
        throw new Error("Wallet address is not available");
      }
      if (!account) {
        throw new Error("Account is not available");
      }

      const dataUrl = await canvasRef.current.takeScreenshot();
      if (!dataUrl) {
        throw new Error("Failed to capture screenshot");
      }

      const storage = new ThirdwebStorage({
        clientId: storageClientId!,
        secretKey: storageSecretKey!,
      });

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'avatar.png', { type: 'image/png' });

      const uploadResult = await storage.upload(file);
      console.log('Upload Result:', uploadResult);

      const imageUrl = uploadResult;

      const { payload, signature } = await getSignature(wallet, imageUrl);
      setSignatureData({ payload, signature });

      const transaction = mintWithSignature({
        contract,
        payload,
        signature,
      });

      await sendAndConfirmTransaction({ transaction, account });
      console.log("Minting successful!");
    } catch (error: unknown) {
      console.error("Error minting NFT:", error);
      if (error instanceof Error) {
        setError("Error minting NFT: " + error.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  }

  async function createTokenBoundAccount(tokenId: string) {
    try {
      if (!account) {
        throw new Error("Account is not available");
      }

      const registryContract = getContract({
        client,
        chain: defineChain(84532),
        address: ERC6551_REGISTRY_ADDRESS,
      });

      const transaction = await prepareContractCall({
        contract: registryContract,
        method: "function createAccount(address implementation, uint256 chainId, address tokenContract, uint256 tokenId, uint256 salt, bytes initData) returns (address)",
        params: [ERC6551_ACCOUNT_ADDRESS, BigInt(84532), NFT_COLLECTION_ADDRESS, BigInt(tokenId), BigInt(0), "0x"]
      });

      const { transactionHash } = await sendTransaction({
        transaction,
        account
      });

      console.log("Token-bound account created! Transaction hash:", transactionHash);
    } catch (error) {
      console.error("Error creating token-bound account:", error);
      setError("Error creating token-bound account: " + (error as Error).message);
    }
  }

  async function transferNFT(recipientAddress: string, tokenId: string) {
    try {
      if (!account) {
        throw new Error("Account is not available");
      }

      const transaction = transferFrom({
        contract,
        from: account.address,
        to: recipientAddress,
        tokenId: BigInt(tokenId),
      });
      await sendAndConfirmTransaction({ transaction, account });
      console.log("Transfer successful!");
      setShowModal(false);
    } catch (error) {
      console.error("Error transferring NFT:", error);
      setError("Error transferring NFT: " + (error as Error).message);
    }
  }

  useEffect(() => {
    const fetchOwnedNFTs = async () => {
      try {
        if (account) {
          const ownerAddress = account.address;
          const nfts = await getOwnedNFTs({
            contract,
            owner: ownerAddress
          });
          setOwnedNFTs(nfts);
        }
      } catch (err) {
        console.error("Error fetching owned NFTs:", err);
        setError("Error fetching owned NFTs: " + (err as Error).message);
      }
    };
    if (activeTab === 'view') {
      fetchOwnedNFTs();
    }
  }, [account, activeTab]);

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  const wallets = [
    createWallet("com.coinbase.wallet"),
    createWallet("io.metamask"),
  ];

  return (
    <main className={`p-4 pb-10 min-h-[100vh] flex items-center justify-center container max-w-screen-lg mx-auto ${styles.textTransform}`}>
      <div className="py-20">
        <Header
          client={client}
          wallets={wallets}
          chain={defineChain(baseSepolia)}
        />

        <div className={styles.tabContainer}>
          <button onClick={() => setActiveTab('mint')} className={`${styles.tabButton} ${activeTab === 'mint' ? styles.activeTab : ''}`}>Mint NFT</button>
          <button onClick={() => setActiveTab('view')} className={`${styles.tabButton} ${activeTab === 'view' ? styles.activeTab : ''}`}>View NFTs</button>
        </div>

        {activeTab === 'mint' && (
          <div className={styles.collectionContainer}>
            <h2 className={styles.ourCollection}>Mint your own Avatar NFT:</h2>

            <input
              type="text"
              placeholder="Name of your NFT"
              className={styles.textInput}
              maxLength={26}
              required
              onChange={(e) => setNftName(e.target.value)}
            />
            {creatorName && <p>Created by: {creatorName}</p>}

            <div className={styles.dropdownContainer}>
              <label>Eye Image:</label>
              <select value={eyeImage} onChange={(e) => setEyeImage(e.target.value)}>
                <option value="/avatars/eye/eyes_1.png">Eyes 1</option>
                <option value="/avatars/eye/eyes_2.png">Eyes 2</option>
              </select>
            </div>

            <div className={styles.dropdownContainer}>
              <label>Mouth Image:</label>
              <select value={mouthImage} onChange={(e) => setMouthImage(e.target.value)}>
                <option value="/avatars/mouth/mouth_1.png">Mouth 1</option>
                <option value="/avatars/mouth/mouth_2.png">Mouth 2</option>
              </select>
            </div>

            <div className={styles.dropdownContainer}>
              <label>Head Image:</label>
              <select value={headImage} onChange={(e) => setHeadImage(e.target.value)}>
                <option value="/avatars/head/rabbit.png">Rabbit</option>
                <option value="/avatars/head/bull.png">Bull</option>
              </select>
            </div>

            <div className={styles.dropdownContainer}>
              <label>Top Image:</label>
              <select value={topImage} onChange={(e) => setTopImage(e.target.value)}>
                <option value="/avatars/top/bluetop.png">Blue Top</option>
                <option value="/avatars/top/whitetop.png">White Top</option>
                <option value="/avatars/top/yellowtop.png">Yellow Top</option>
              </select>
            </div>

            <div className={styles.canvasContainer}>
              <AvatarCanvas 
                eyeImage={eyeImage}
                mouthImage={mouthImage}
                headImage={headImage}
                topImage={topImage}
                ref={canvasRef} 
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <button onClick={mint} className={styles.mintButton}>
                Mint NFT
              </button>
            </div>

            {error && <p style={{ color: 'red' }}>{error}</p>}
          </div>
        )}

        {activeTab === 'view' && (
        <div className={nftStyles.container}>
          {ownedNFTs && ownedNFTs.length > 0 ? (
            <div className={nftStyles.nftList}>
              {ownedNFTs.map(nft => (
                <div
                  key={nft.id.toString()}
                  className={nftStyles.nftItem}
                  onClick={() => {
                    setSelectedNFT(nft);
                    setShowModal(true);
                  }}
                >
                  <div className={nftStyles.nftName}>{nft.metadata.name}</div>
                  {nft.metadata.image && (
                    <img
                      src={resolveImageUrl(nft.metadata.image)}
                      alt={nft.metadata.name}
                      className={nftStyles.nftImage}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={nftStyles.noNfts}>No NFTs owned.</div>
          )}
        </div>
      )}

        <Modal
          show={showModal}
          onClose={() => setShowModal(false)}
          nft={selectedNFT}
          onTransfer={transferNFT}
          onCreateTokenBoundAccount={createTokenBoundAccount}
        />
      </div>
    </main>
  );
}

interface HeaderProps {
  client: any;
  wallets: any[];
  chain: any;
}

function Header({ client, wallets, chain }: HeaderProps) {
  return (
    <header className={`${styles.header} flex flex-col items-center mb-20 md:mb-20`}>
      <h1 className="text-2xl md:text-6xl font-semibold md:font-bold tracking-tighter mb-6 text-zinc-100">
        PGC Beta
      </h1>

      <div>
        <ConnectButton
          client={client}
          wallets={wallets}
          chain={chain}
          theme={"dark"}
          appMetadata={{
            name: "Avatar",
            url: "https://example.com",
          }}
          connectButton={{ label: "Log In or Sign Up" }}
          connectModal={{
            size: "wide",
            title: "Choose Method",
            welcomeScreen: {
              title: "PublicGoodsClub",
              img: {
                src: "https://media.discordapp.net/attachments/1244435318006874163/1248808384753434634/PGC_Flower_Logo.png?ex=666502f0&is=6663b170&hm=88b38c7b5a86511dcb2d2e5c6d5c02ecde91dd8a880a65ada02924a5db318d87&=&format=webp&quality=lossless",
                width: 150,
                height: 150,
              },
            },
            showThirdwebBranding: false,
          }}
        />
      </div>
    </header>
  );
}
