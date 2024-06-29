"use client";
import {
  Popover,
  Transition,
  PopoverButton,
  PopoverPanel,
  PopoverBackdrop,
} from "@headlessui/react";
import clsx from "clsx";
import Link from "next/link";
import { Fragment } from "react";
import { usePathname } from "next/navigation";
//import { ConnectWallet } from "@thirdweb-dev/react";
import { useTheme } from "next-themes";
import { darkTheme, lightTheme } from "thirdweb/react";
import { baseSepolia } from "thirdweb/chains";
import { client, wallets } from "../components/const/utils";
import { defineChain } from "thirdweb";
import { ConnectButton } from "thirdweb/react";

function MobileNavLink({
  href,
  target,
  children,
}: {
  href: string;
  target?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  //console.log("mobile nav path: ", href, pathname);
  return (
    <PopoverButton
      as={Link}
      href={href}
      target={target}
      className={clsx(
        "block w-full p-2",
        pathname === href && "text-background-light"
      )}
    >
      {children}
    </PopoverButton>
  );
}

function MobileNavIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5 overflow-visible stroke-slate-700"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path
        d="M0 1H14M0 7H14M0 13H14"
        className={clsx(
          "origin-center transition",
          open && "scale-90 opacity-0"
        )}
      />
      <path
        d="M2 2L12 12M12 2L2 12"
        className={clsx(
          "origin-center transition",
          !open && "scale-90 opacity-0"
        )}
      />
    </svg>
  );
}

export default function MobileNavigation() {
  return (
    <Popover>
      {({ open }) => (
        <>
          <PopoverButton
            className="relative z-10 flex h-8 w-8 items-center justify-center [&:not(:focus-visible)]:focus:outline-none"
            aria-label="Toggle Navigation"
          >
            <MobileNavIcon open={open} />
          </PopoverButton>
          <Transition
            as={Fragment}
            enter="duration-150 ease-out"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="duration-150 ease-in"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <PopoverBackdrop className="fixed inset-0 bg-slate-300/50" />
          </Transition>
          <Transition
            as={Fragment}
            enter="duration-150 ease-out"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="duration-100 ease-in"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <PopoverPanel
              as="div"
              className="absolute inset-x-0 top-full mt-4 flex origin-top flex-col rounded-2xl bg-white dark:bg-black p-4 text-lg tracking-tight text-background-dark dark:text-foreground-dark shadow-xl ring-1 ring-slate-900/5"
            >
              <MobileNavLink
                href="https://x.com/PublicGoodsClub"
                target="_blank"
              >
                Community
              </MobileNavLink>
              <MobileNavLink
                href="https://mirror.xyz/bigtrav.eth/6hD4LTjGWC8TXef4DGIxbdVSibreKLTWila-wOku0DM"
                target="_blank"
              >
                Learn
              </MobileNavLink>
              <MobileNavLink href="/">My NFTs</MobileNavLink>
              <ConnectButton
                client={client}
                wallets={wallets}
                chain={defineChain(baseSepolia)}
                theme={"dark"}
                appMetadata={{
                  name: "PGC Members",
                  url: "https://publicgoods.club",
                }}
                connectButton={{ label: "Log In or Sign Up" }}
                connectModal={{
                  size: "wide",
                  title: "Choose Method",
                  welcomeScreen: {
                    title: "PublicGoodsClub",
                    img: {
                      src: "/pgc-logo-pgcword.png",
                      width: 150,
                      height: 150,
                    },
                  },
                  showThirdwebBranding: false,
                }}
              />
            </PopoverPanel>
          </Transition>
        </>
      )}
    </Popover>
  );
}
