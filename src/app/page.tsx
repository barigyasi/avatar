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
  const [clickCount, setClickCount] = useState<number>(0); // State for the click count
  const [loading, setLoading] = useState<boolean>(true); // State for loading
  const [buttonPresses, setButtonPresses] = useState<number>(0); // Track button presses
  const [showNotification, setShowNotification] = useState<boolean>(false); // Track notification
  const [showError, setShowError] = useState<boolean>(false); // Track error notification
  const canvasRef = useRef<any>();

  useEffect(() => {
    initializeAvatar(); // Set initial random avatar images without incrementing count
    if (account?.address) {
      setWallet(account.address);
      fetchEnsName(account.address);
    }
    fetchClickCount(); // Fetch the initial click count
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
      setTimeout(() => setShowError(false), 15000); // Hide error notification after 15 seconds
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
      showFlowerEmojis(); // Show flower emojis
      setShowNotification(true); // Show success notification
      setTimeout(() => setShowNotification(false), 3000); // Hide notification after 3 seconds
    } catch (error: unknown) {
      console.error("Error minting NFT:", error);
      setError(`Error minting NFT: ${error instanceof Error ? error.message : "Unknown error"}`);
      setShowError(true);
      setTimeout(() => setShowError(false), 15000); // Hide error notification after 15 seconds
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
    incrementClickCount(); // Increment the click count only when button is clicked
    setButtonPresses((prev) => prev + 1); // Increment button presses

    safelyInteractWithElement('.randomize-button', (button) => {
      if (buttonPresses >= 5) {
        // Change button color to red
        button.classList.add('red');
      }
      if (buttonPresses >= 10) {
        // Shake the button
        button.classList.add('shake');
        // Add multiple rows of fire emojis
        for (let j = 0; j < 4; j++) { // Create 4 rows of fire emojis
          setTimeout(() => {
            for (let i = 0; i < 10; i++) { // 10 fire emojis per row
              const fireEmoji = document.createElement('div');
              fireEmoji.className = 'fire-emoji';
              fireEmoji.style.left = `${Math.random() * 100}%`;
              fireEmoji.style.top = '0px'; // Start from the top of the screen
              fireEmoji.innerText = '🔥';
              document.body.appendChild(fireEmoji);
              setTimeout(() => {
                fireEmoji.remove();
              }, 2000);
            }
          }, j * 500); // Stagger each row by 500ms
        }
        // Reset button color back to blue
        setTimeout(() => {
          button.classList.remove('red');
        }, 3000);
      }
    });
  };

  const showFlowerEmojis = () => {
    for (let i = 0; i < 25; i++) { // Adjust the number of flowers if needed
      const flowerEmoji = document.createElement('img');
      flowerEmoji.className = 'flower-emoji';
      flowerEmoji.style.left = `${Math.random() * 100}%`;
      flowerEmoji.style.top = '0px'; // Start from the top of the screen
      flowerEmoji.src = '/PGC_Flower_ALL_BLUE.png'; // Use the flower logo
      document.body.appendChild(flowerEmoji);
      setTimeout(() => {
        flowerEmoji.remove();
      }, 2000);
    }
  };

  return (
    <Container className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900"> {/* Add bg-white and dark:bg-gray-900 */}
      <div className="py-20 max-w-xl mx-auto">
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

        <div className="mb-6">
          <AvatarCanvas
            eyeImage={eyeImage}
            mouthImage={mouthImage}
            headImage={headImage}
            topImage={topImage}
            backgroundImage={backgroundImage}
            ref={canvasRef}
          />
        </div>

        <div className="text-center">
          <button onClick={randomizeAvatar} disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-md border-2 border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-800 mr-4 randomize-button">
            Randomize
          </button>
          <button onClick={mint} className="px-6 py-2 bg-blue-600 text-white rounded-md border-2 border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-800">
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
