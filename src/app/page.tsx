"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";
import { getContract, sendAndConfirmTransaction, createThirdwebClient, defineChain,  prepareContractCall, sendTransaction } from "thirdweb";
import { ThirdwebStorage } from "@thirdweb-dev/storage";
import { createWallet } from "thirdweb/wallets";
import AvatarCanvas from "../components/AvatarCanvas";
import { Container } from "../components/Container";
import { resolveName } from "thirdweb/extensions/ens";
import { mintWithSignature } from "thirdweb/extensions/erc721";

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
  const [eyeImage, setEyeImage] = useState<string>("/avatars/eye/eyes_1.png");
  const [mouthImage, setMouthImage] = useState<string>("/avatars/mouth/mouth_1.png");
  const [headImage, setHeadImage] = useState<string>("/avatars/head/rabbit.png");
  const [topImage, setTopImage] = useState<string>("/avatars/top/blue_top.png");
  const [backgroundImage, setBackgroundImage] = useState<string>("/avatars/background/background1.png");
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const canvasRef = useRef<any>();

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
    chain: defineChain(8453),
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

  

  const wallets = [
    createWallet("com.coinbase.wallet"),
    createWallet("io.metamask"),
  ];

  return (
    <Container className="min-h-screen flex items-center justify-center">
      <div className="py-20 max-w-xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-center">Mint your own Avatar NFT:</h2>
        <input
          type="text"
          placeholder="Name of your NFT"
          className="w-full mb-4 px-4 py-2 border rounded-md"
          maxLength={26}
          required
          onChange={(e) => setNftName(e.target.value)}
        />
        {creatorName && <p className="text-center mb-4">Created by: {creatorName}</p>}
        
        <div className="mb-4">
          <label>Eye Image:</label>
          <select value={eyeImage} onChange={(e) => setEyeImage(e.target.value)} className="w-full px-4 py-2 border rounded-md">
            <option value="/avatars/eye/eyes_1.png">Eyes 1</option>
            <option value="/avatars/eye/eyes_2.png">Eyes 2</option>
          </select>
        </div>

        <div className="mb-4">
          <label>Mouth Image:</label>
          <select value={mouthImage} onChange={(e) => setMouthImage(e.target.value)} className="w-full px-4 py-2 border rounded-md">
            <option value="/avatars/mouth/mouth_1.png">Mouth 1</option>
            <option value="/avatars/mouth/mouth_2.png">Mouth 2</option>
          </select>
        </div>

        <div className="mb-4">
          <label>Head Image:</label>
          <select value={headImage} onChange={(e) => setHeadImage(e.target.value)} className="w-full px-4 py-2 border rounded-md">
            <option value="/avatars/head/rabbit.png">Rabbit</option>
            <option value="/avatars/head/bull.png">Bull</option>
          </select>
        </div>

        <div className="mb-4">
          <label>Top Image:</label>
          <select value={topImage} onChange={(e) => setTopImage(e.target.value)} className="w-full px-4 py-2 border rounded-md">
            <option value="/avatars/top/blue_top.png">Blue Top</option>
            <option value="/avatars/top/white_top.png">White Top</option>
            <option value="/avatars/top/yellow_top.png">Yellow Top</option>
          </select>
        </div>

        <div className="mb-4">
          <label>Background Image:</label>
          <select value={backgroundImage} onChange={(e) => setBackgroundImage(e.target.value)} className="w-full px-4 py-2 border rounded-md">
            <option value="/avatars/background/background1.png">Background 1</option>
            <option value="/avatars/background/background2.png">Background 2</option>
            <option value="/avatars/background/background3.png">Background 3</option>
          </select>
        </div>

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
          <button onClick={mint} className="px-6 py-2 bg-blue-600 text-white rounded-md">
            Mint NFT
          </button>
        </div>

        {error && <p className="mt-4 text-red-600">{error}</p>}

        <div className="mt-6 text-center">
          <a href="https://pg-club.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
           Inventory
          </a>
        </div>
      </div>
    </Container>
  );
}
