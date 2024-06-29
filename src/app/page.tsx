"use client"

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
  const canvasRef = useRef<any>();

  useEffect(() => {
    randomizeAvatar(); // Set initial random avatar images
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
      setError(`Error minting NFT: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  const wallets = [
    createWallet("com.coinbase.wallet"),
    createWallet("io.metamask"),
  ];

  const randomizeAvatar = () => {
    const getRandomItem = (array: any[]) => array[Math.floor(Math.random() * array.length)];
    setEyeImage(`/avatars/eye/${getRandomItem(['eyes_1.png', 'eyes_2.png'])}`);
    setMouthImage(`/avatars/mouth/${getRandomItem(['mouth_1.png', 'mouth_2.png'])}`);
    setHeadImage(`/avatars/head/${getRandomItem(['rabbit.png', 'bull.png'])}`);
    setTopImage(`/avatars/top/${getRandomItem(['bluetop.png', 'whitetop.png', 'yellowtop.png'])}`);
    setBackgroundImage(`/avatars/background/${getRandomItem(['background1.png', 'background2.png'])}`);
  };

  return (
    <Container className="min-h-screen flex items-center justify-center">
      <div className="py-20 max-w-xl mx-auto">
        <h2 className="text-3xl mb-6 text-center font-lineal">Mint Your Public Goodies:</h2>
        <input
          type="text"
          placeholder="Name Your Public Goodie"
          className="w-full mb-4 px-4 py-2 border-2 border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
          maxLength={26}
          required
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
          <button onClick={() => { randomizeAvatar(); }} className="px-6 py-2 bg-blue-600 text-white rounded-md border-2 border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-800 mr-4">
            Randomize 
          </button>
          <button onClick={mint} className="px-6 py-2 bg-blue-600 text-white rounded-md border-2 border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-800">
            Mint NFT
          </button>
        </div>

        <div className="mt-6 text-center">
          <a href="https://pg-club.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
            View Inventory
          </a>
        </div>
      </div>
    </Container>
  );
}
