"use client";

import { useState, useEffect, useRef } from "react";
import { useActiveAccount, ConnectButton } from "thirdweb/react";
import { getContract, sendAndConfirmTransaction, createThirdwebClient, defineChain } from "thirdweb";
import { mintWithSignature } from "thirdweb/extensions/erc721";
import { ThirdwebStorage } from "@thirdweb-dev/storage";
import { createWallet } from "thirdweb/wallets";
import { baseSepolia } from "thirdweb/chains";
import AvatarCanvas from "../components/AvatarCanvas";
import styles from "../styles/Home.module.css";
import { Sketch } from "@uiw/react-color";

const NFT_COLLECTION_ADDRESS = "0x92F2666443EBFa7129f39c9E43758B33CD5D73F8";

export default function Home() {
  const clientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID;
  const storageClientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID;
  const storageSecretKey = process.env.TW_SECRET_KEY;

  if (!clientId) {
    throw new Error("CLIENT_ID is not defined in environment variables");
  }

  const account = useActiveAccount();
  const [wallet, setWallet] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<{ payload: any, signature: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nftName, setNftName] = useState<string>("");
  const [hairStyle, setHairStyle] = useState<string>("short");
  const [skinColor, setSkinColor] = useState<string>("#FFDAB9");
  const canvasRef = useRef<any>();

  useEffect(() => {
    if (account?.address) {
      setWallet(account.address);
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
  ];

  return (
    <main className="p-4 pb-10 min-h-[100vh] flex items-center justify-center container max-w-screen-lg mx-auto">
      <div className="py-20">
        <Header
          client={client}
          wallets={wallets}
          chain={defineChain(baseSepolia)}
        />

        <div className={styles.collectionContainer}>
          <h2 className={styles.ourCollection}>Mint your own Avatar NFT:</h2>

          <input
            type="text"
            placeholder="Name of your NFT"
            className={styles.textInput}
            maxLength={26}
            onChange={(e) => setNftName(e.target.value)}
          />

          <div className={styles.centered}>
            <label>
              <input
                type="radio"
                value="short"
                checked={hairStyle === "short"}
                onChange={() => setHairStyle("short")}
              />
              Short Hair
            </label>
            <label>
              <input
                type="radio"
                value="long"
                checked={hairStyle === "long"}
                onChange={() => setHairStyle("long")}
              />
              Long Hair
            </label>
            <label>
              <input
                type="radio"
                value="bald"
                checked={hairStyle === "bald"}
                onChange={() => setHairStyle("bald")}
              />
              Bald
            </label>
          </div>

          <div className={styles.colorPicker}>
            <label>Body Color:</label><br/>
            <Sketch
              color={skinColor}
              onChange={(color) => setSkinColor(color.hex)}
            />
          </div>

          <div className={styles.canvasContainer}>
            <AvatarCanvas hairStyle={hairStyle} skinColor={skinColor} ref={canvasRef} />
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <button onClick={mint} className={styles.mintButton}>
            Mint NFT
          </button>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

      

        
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

      <div className={""}>
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
          titleIcon: "",
          welcomeScreen: {
            subtitle:
              "Log In Or Sign Up To Get Started",
            title: "PublicGoodsClub",
            img: {
              src: "",
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




