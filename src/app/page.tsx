"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";
import { getContract, sendAndConfirmTransaction, createThirdwebClient, defineChain, prepareContractCall, sendTransaction } from "thirdweb";
import { ThirdwebStorage } from "@thirdweb-dev/storage";
import { createWallet } from "thirdweb/wallets";
import { resolveName } from "thirdweb/extensions/ens";
import { mintWithSignature } from "thirdweb/extensions/erc721";
import AvatarCanvas from "../components/AvatarCanvas";
import { Container } from "../components/Container";

const NFT_COLLECTION_ADDRESS = "0xF1316D7eC6465BF25d1f918037043D0420270900";

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
  const [eyeImage, setEyeImage] = useState<string>("");
  const [mouthImage, setMouthImage] = useState<string>("");
  const [headImage, setHeadImage] = useState<string>("");
  const [topImage, setTopImage] = useState<string>("");
  const [backgroundImage, setBackgroundImage] = useState<string>("");
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [buttonPresses, setButtonPresses] = useState<number>(0);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [showError, setShowError] = useState<boolean>(false);
  const canvasRef = useRef<any>();

  useEffect(() => {
    initializeAvatar();
    if (account?.address) {
      setWallet(account.address);
      fetchEnsName(account.address);
    }
    fetchClickCount();
  }, [account]);

  const client = createThirdwebClient({
    clientId: clientId,
  });

  const contract = getContract({
    client,
    chain: defineChain(8453),
    address: NFT_COLLECTION_ADDRESS,
  });

  const fetchEnsName = async (address: string) => {
    try {
      const ensName = await resolveName({
        client,
        address: address,
      });
      setCreatorName(ensName || `${address.slice(0, 3)}...${address.slice(-3)}`);
    } catch (error) {
      console.error("Error resolving ENS name:", error);
      setCreatorName(`${address.slice(0, 3)}...${address.slice(-3)}`);
    }
  };

  const fetchClickCount = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/counter');
      const data = await response.json();
      setClickCount(data.count);
    } catch (error) {
      console.error("Error fetching click count:", error);
    } finally {
      setLoading(false);
    }
  };

  const incrementClickCount = async () => {
    try {
      const response = await fetch('/api/counter', { method: 'POST' });
      const data = await response.json();
      setClickCount(data.count);
    } catch (error) {
      console.error("Error incrementing click count:", error);
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
      setError(`Error fetching signature: ${error instanceof Error ? error.message : "Unknown error"}`);
      setShowError(true);
      setTimeout(() => setShowError(false), 15000);
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
      if (!nftName) {
        throw new Error("NFT name is required");
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
      showFlowerEmojis();
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (error: unknown) {
      console.error("Error minting NFT:", error);
      setError(`Error minting NFT: ${error instanceof Error ? error.message : "Unknown error"}`);
      setShowError(true);
      setTimeout(() => setShowError(false), 15000);
    }
  }

  const wallets = [
    createWallet("com.coinbase.wallet"),
    createWallet("io.metamask"),
  ];

  const getRandomItem = (array: any[]) => array[Math.floor(Math.random() * array.length)];

  const initializeAvatar = () => {
    setEyeImage(`/avatars/eye/${getRandomItem(['eyes_1.png', 'eyes_2.png'])}`);
    setMouthImage(`/avatars/mouth/${getRandomItem(['mouth_1.png', 'mouth_2.png'])}`);
    setHeadImage(`/avatars/head/${getRandomItem(['rabbit.png', 'bull.png'])}`);
    setTopImage(`/avatars/top/${getRandomItem(['bluetop.png', 'whitetop.png', 'yellowtop.png'])}`);
    setBackgroundImage(`/avatars/background/${getRandomItem(['background1.png', 'background2.png'])}`);
  };

  const safelyInteractWithElement = (selector: string, callback: (element: HTMLElement) => void) => {
    const element = document.querySelector(selector) as HTMLElement | null;
    if (element) {
      callback(element);
    }
  };

  const randomizeAvatar = () => {
    initializeAvatar();
    incrementClickCount();
    setButtonPresses((prev) => prev + 1);

    safelyInteractWithElement('.randomize-button', (button) => {
      if (buttonPresses >= 5) {
        button.classList.add('red');
      }
      if (buttonPresses >= 10) {
        button.classList.add('shake');
        for (let j = 0; j < 4; j++) {
          setTimeout(() => {
            for (let i = 0; i < 10; i++) {
              const fireEmoji = document.createElement('div');
              fireEmoji.className = 'fire-emoji';
              fireEmoji.style.left = `${Math.random() * 100}%`;
              fireEmoji.style.top = '0px';
              fireEmoji.innerText = '🔥';
              document.body.appendChild(fireEmoji);
              setTimeout(() => {
                fireEmoji.remove();
              }, 2000);
            }
          }, j * 500);
        }
        setTimeout(() => {
          button.classList.remove('red');
        }, 3000);
      }
    });
  };

  const showFlowerEmojis = () => {
    for (let i = 0; i < 25; i++) {
      const flowerEmoji = document.createElement('img');
      flowerEmoji.className = 'flower-emoji';
      flowerEmoji.style.left = `${Math.random() * 100}%`;
      flowerEmoji.style.top = '0px';
      flowerEmoji.src = '/PGC_Flower_ALL_BLUE.png';
      document.body.appendChild(flowerEmoji);
      setTimeout(() => {
        flowerEmoji.remove();
      }, 2000);
    }
  };

  return (
    <Container className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="py-20 max-w-xl mx-auto px-4">
        <h2 className="text-3xl mb-6 text-center font-lineal">Mint Your Public Goodies:</h2>
        <input
          type="text"
          placeholder="Name Your Public Goodie"
          className="w-full mb-4 px-4 py-2 border-2 border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
          maxLength={26}
          required
          value={nftName}
          onChange={(e) => setNftName(e.target.value)}
        />
        {creatorName && <p className="text-center mb-4 font-lineal">minted by: {creatorName}</p>}

        <div className="mb-6 flex justify-center">
          <AvatarCanvas
            eyeImage={eyeImage}
            mouthImage={mouthImage}
            headImage={headImage}
            topImage={topImage}
            backgroundImage={backgroundImage}
            ref={canvasRef}
            className="w-full max-w-xs"
          />
        </div>

        <div className="text-center">
          <button onClick={randomizeAvatar} disabled={loading} className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-md border-2 border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-800 mr-4 randomize-button">
            Randomize
          </button>
          <button onClick={mint} className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-md border-2 border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-800">
            Mint NFT
          </button>
        </div>

        <div className="mt-6 text-center">
          {loading ? (
            <img src="/PGC_Flower_ALL_BLUE.png" alt="Loading..." className="spinner" />
          ) : (
            <p>Randomizer clicks: {clickCount}</p>
          )}
        </div>

        <div className="mt-6 text-center">
          <a href="https://pg-club.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
            View Inventory
          </a>
        </div>

        {showNotification && (
          <div className="notification">
            Mint successful!
          </div>
        )}
        {showError && (
          <div className="notification error">
            {error}
          </div>
        )}
      </div>
    </Container>
  );
}
