import { baseSepolia, Chain } from "thirdweb/chains";
import { createThirdwebClient } from "thirdweb";
import { ThirdwebClient } from "thirdweb";
import { createWallet, inAppWallet } from "thirdweb/wallets";

export const factoryAddress: string = `${process.env.NEXT_PUBLIC_FACTORY_ADDRESS}`;
export const TWApiKey: string = `${process.env.NEXT_PUBLIC_SECRET_KEY}`;
export const activeChain: Chain = baseSepolia;
export const nftDropAddress: string = `${process.env.NEXT_PUBLIC_NFT_DROP_ADDRESS}`;
export const clientId: string = `${process.env.NEXT_PUBLIC_CLIENT_ID}`;
export const secretKey: string = `${process.env.NEXT_PUBLIC_SECRET_KEY}`;
export const implementation: string = `${process.env.NEXT_PUBLIC_IMPLEMENTATION}`;
export const entryPoint: string = `${process.env.NEXT_PUBLIC_ENTRY}`;
export const idNFT: string = `${process.env.NEXT_PUBLIC_ID_NFT}`;
export const client: ThirdwebClient = createThirdwebClient({ clientId });
export const wallets = [
    inAppWallet(),
    createWallet("io.metamask"),
    createWallet("com.coinbase.wallet"),
    createWallet("me.rainbow"),
];

export type ALLOW_LIST_TYPE = [string[], string, string, string];

export const allow_list: ALLOW_LIST_TYPE = [
    ["0x0000000000000000000000000000000000000000000000000000000000000000"],
    "115792089237316195423570985008687907853269984665640564039457584007913129639935",
    "0",
    "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
];
export const currency = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
const old_drop = "0x5dabeebc71b75fb9681d67cc4aeb654c6c858126"