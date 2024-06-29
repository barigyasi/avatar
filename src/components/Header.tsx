// /app/components/Header.tsx
"use client";
import { Container } from "./Container";
import { NavLink } from "./NavLink";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "next-themes";
import { ConnectWallet } from "@thirdweb-dev/react";
import MobileNavigation from "./MobileNavigation";
import { ConnectButton } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
import { baseSepolia } from "thirdweb/chains";
import { createThirdwebClient, defineChain } from "thirdweb";

const CLIENT_ID = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID;

const wallets = [
  createWallet("com.coinbase.wallet"),
  createWallet("io.metamask"),
];

export function Header() {
  const { theme } = useTheme();

  if (!CLIENT_ID) {
    throw new Error("CLIENT_ID is not defined in environment variables");
  }

  const client = createThirdwebClient({
    clientId: CLIENT_ID,
    secretKey: undefined,
  });

  return (
    <header className="bg-blue-600"> {/* Use Tailwind class for blue background */}
      <Container>
        <nav className="relative z-50 flex justify-between items-center p-4 md:pt-4">
          <div className="flex items-center md:gap-x-12 justify-center">
            <Link href="/">
              <div className="flex items-center">
                <Image
                  src={
                    theme === "dark"
                      ? "/pgc-logo-dark.png"
                      : "/pgc-logo-light.png"
                  }
                  alt="public goods logo image"
                  width={50}
                  height={50}
                />
              </div>
            </Link>
          </div>
          <div className="hidden md:flex md:gap-x-6 text-white font-lineal">
            <NavLink href="https://x.com/PublicGoodsClub" target="_blank">
              Community
            </NavLink>
            <NavLink
              href="https://mirror.xyz/bigtrav.eth/6hD4LTjGWC8TXef4DGIxbdVSibreKLTWila-wOku0DM"
              target="_blank"
            >
              Learn
            </NavLink>
            <NavLink 
            href="https://pg-club.netlify.app/"
            target="_blank"
            > View Inventory</NavLink>
          </div>
          <div className="flex items-center gap-x-5 md:gap-x-8">
            <div className="hidden md:block">
              {/* <ConnectWallet  switchToActiveChain={true} /> */}
              <ConnectButton
                client={client}
                wallets={wallets}
                chain={defineChain(baseSepolia)}
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
            <ThemeToggle />
            <div className="-mr-1 md:hidden">
              <MobileNavigation />
            </div>
          </div>
        </nav>
      </Container>
    </header>
  );
}
