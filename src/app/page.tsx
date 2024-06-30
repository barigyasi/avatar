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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShuffle } from '@fortawesome/free-solid-svg-icons';

const NFT_COLLECTION_ADDRESS = "0x3917465c972d6c6D4eB4fB0f21E8D5023dDaF3Cf";

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
  const [chainImage, setChainImage] = useState<string>("");
  const [glassesImage, setGlassesImage] = useState<string>("");

  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [buttonPresses, setButtonPresses] = useState<number>(0);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [showError, setShowError] = useState<boolean>(false);
  const [canvasLoading, setCanvasLoading] = useState<boolean>(false);
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
          traits: {
            eye: eyeImage.split('/').pop()?.split('.')[0].replace('_', ' '),
            mouth: mouthImage.split('/').pop()?.split('.')[0].replace('_', ' '),
            head: headImage.split('/').pop()?.split('.')[0].replace('_', ' '),
            top: topImage.split('/').pop()?.split('.')[0].replace('_', ' '),
            chain: chainImage.split('/').pop()?.split('.')[0].replace('_', ' '),
            glasses: glassesImage.split('/').pop()?.split('.')[0].replace('_', ' '),

          },
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
    setEyeImage(`/avatars/eye/${getRandomItem([
      'eyes_1.png', 'eyes_2.png', 'eyes_3.png', 'eyes_4.png', 'eyes_5.png', 'eyes_6.png', 
      'eyes_7.png', 'eyes_8.png', 'eyes_9.png', 'eyes_10.png', 'eyes_11.png', 'eyes_12.png', 
      'eyes_13.png'])}`);
    setMouthImage(`/avatars/mouth/${getRandomItem([
      'mouth_1.png', 'mouth_2.png', 'mouth_3.png', 'mouth_4.png', 'mouth_5.png', 'mouth_6.png', 
      'mouth_7.png'])}`);
    setHeadImage(`/avatars/head/${getRandomItem([
      'baby_blue_bull.png', 'baby_blue_rabbit.png', 'baby_blue_shiba.png', 'based_cat.png', 
      'blue_ape.png', 'blue_bear.png', 'blue_bull.png', 'blue_cat.png', 'blue_rabbit.png', 
      'blue_shiba.png', 'brown_bull.png', 'brown_shiba.png', 'cream_bear.png', 'cream_cat.png', 
      'doge.png', 'gold_ape.png', 'gold_bear.png', 'gold_bull.png', 'green_ape.png', 
      'green_bull.png', 'green_rabbit.png', 'green_shiba.png', 'milo.png', 'mint_ape.png', 
      'mint_bear.png', 'mint_bull.png', 'mint_cat.png', 'orange_cat.png', 'panda_bear.png', 
      'pink_ape.png', 'pink_rabbit.png', 'pink_shiba.png', 'polar_bear.png', 'red_ape.png', 
      'red_bear.png', 'red_bull.png', 'red_cat.png', 'red_rabbit.png', 'red_shiba.png', 'winnie.png', 
      'yellow_cat.png', 'yellow_rabbit.png'])}`);
    setTopImage(`/avatars/top/${getRandomItem([
      'baby_blue_hoodie.png', 'baby_blue_suit.png', 'blue_hoodie.png', 'blue_shirt.png', 
      'blue_suit.png', 'cream_hoodie.png', 'cream_shirt.png', 'degen_suit.png', 
      'gold_shirt.png', 'gold_suit.png', 'green_hoodie.png', 'green_shirt.png', 'green_suit.png', 
      'mint_hoodie.png', 'mint_shirt.png', 'mint_suit.png', 'navy_hoodie.png', 'navy_shirt.png', 
      'pink_hoodie.png', 'pink_shirt.png', 'pink_suit.png', 'red_hoodie.png', 
      'red_shirt.png', 'white_hoodie.png', 'white_shirt.png', 
      'yellow_hoodie.png', 'yellow_shirt.png'])}`);
    setBackgroundImage(`/avatars/background/${getRandomItem([ 'blue_background.png'])}`);
    setChainImage(`/avatars/chains/${getRandomItem([
      '2_chains_blue.png', '2_chains_gold.png', '2_chains_mint.png', '2_chains_white.png', 
      'cuban_link_blue.png', 'cuban_link_gold.png', 'cuban_link_mint.png', 'cuban_link_white.png', 
      'herringbone_blue.png', 'herringbone_gold.png', 'herringbone_mint.png', 'herringbone_pink.png', 
      'herringbone_white.png', 'pgc_chain_1.png', 'pgc_chain_2.png', 'pgc_chain_3.png', 
      'pgc_chain_4.png', 'pgc_chain_5.png', 'pgc_chain_6.png', 'pgc_pearls_1.png', 'pgc_pearls_2.png', 
      'pgc_pearls_3.png', 'pgc_pearls_4.png', 'pgc_pearls_5.png', 'pgc_pearls_6.png', 
      'pgc_pearls_7.png', 'pgc_pearls_8.png', 'pgc_pearls_9.png', 'pgc_pearls_10.png', 
      'pgc_pearls_11.png','blank_1.png','blank_2.png'])}`);
    setGlassesImage(`/avatars/glasses/${getRandomItem([
      'blue_nounish.png', 'blue_sunglasses_2.png', 'blue_sunglasses.png', 'cream_nounish.png', 
      'green_sunglasses.png', 'green_nounish.png', 'pink_nounish.png', 'pink_sunglasses_2.png', 
      'pink_sunglasses.png', 'red_sunglasses.png', 'teal_sunglasses_2.png', 
      'yellow_sunglasses.png', 'yellow_sunglasses_2.png', 'blank_glasses_1.png','blank_glasses_2.png'])}`);
  };
  

  const safelyInteractWithElement = (selector: string, callback: (element: HTMLElement) => void) => {
    const element = document.querySelector(selector) as HTMLElement | null;
    if (element) {
      callback(element);
    }
  };

  const randomizeAvatar = () => {
    setCanvasLoading(true);
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
        <h2 className="text-3xl mb-6 text-center font-lineal">Mint A Member:</h2>
        <input
          type="text"
          placeholder="Name Your PGC Member"
          className="w-full mb-4 px-4 py-2 border-2 border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
          maxLength={26}
          required
          value={nftName}
          onChange={(e) => setNftName(e.target.value)}
        />
        {creatorName && <p className="text-center mb-4 font-lineal">minted by: {creatorName}</p>}

        <div className="mb-6 flex justify-center relative">
          {canvasLoading && (
            <img src="/PGC_Flower_ALL_BLUE.png" alt="Loading..." className="spinner1" />
          )}
          <AvatarCanvas
            glassesImage={glassesImage}
            eyeImage={eyeImage}
            mouthImage={mouthImage}
            headImage={headImage}
            chainImage={chainImage}
            topImage={topImage}
            backgroundImage={backgroundImage}
            ref={canvasRef}
            setLoading={setCanvasLoading}
          />
        </div>

        <div className="text-center">
          <button onClick={randomizeAvatar} disabled={loading} className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-md border-2 border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-800 mr-4 randomize-button">
            <FontAwesomeIcon icon={faShuffle} />
          </button>
          <button onClick={mint} className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-md border-2 border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-800">
            Mint
          </button>
        </div>

        <div className="mt-6 text-center">
          {loading ? (
            <img src="/PGC_Flower_ALL_BLUE.png" alt="Loading..." className="spinner" />
          ) : (
            <p>Shuffles: {clickCount}</p>
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
