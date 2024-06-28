import {
    prepareContractCall,
    getContract,
    createThirdwebClient,
} from "thirdweb";
import { ContractOptions, readContract, sendTransaction } from "thirdweb";
import { createWallet, injectedProvider } from "thirdweb/wallets";
//import { client } from "./constants";
import { WalletId } from "thirdweb/wallets";
import { getOwnedNFTs } from "thirdweb/extensions/erc1155";
import { SmartWalletOptions } from "thirdweb/wallets";
import { baseSepolia } from "thirdweb/chains";
import {
    implementation,
    nftDropAddress,
    idNFT,
    factoryAddress,
    entryPoint,
} from "./constants";
import { smartWallet } from "thirdweb/wallets";
import { clientId, allow_list, ALLOW_LIST_TYPE } from "./constants";
import { Account } from "thirdweb/wallets";
const NFT_COLLECTION_ADDRESS = process.env.NEXT_PUBLIC_NFT_DROP_ADDRESS;


export const truncate = (address: string, chars: number) => {
    return `${address.substring(0, chars + 2)}...${address.substring(42 - chars)}`;
}

const supported_wallets: WalletId[] = ["io.metamask", "com.coinbase.wallet", "me.rainbow"];

const create_account = async (id: WalletId) => {
    const metamask = createWallet(id); // pass the wallet id
    let account = await metamask.connect({ client });
    return account
}

export async function get_wallet_id(): Promise<string> {
    //export const get_wallet_id: () => Promise<WalletId> = async () => {
    for (let i = 0; i < supported_wallets.length; i++) {
        let wallet: WalletId = supported_wallets[i];
        if (injectedProvider(wallet)) {
            console.log("detected wallet: ", wallet)
            return wallet
            //return create_account(wallet)
        }
    }
    return ""
}

export const claim2 = (contract: ContractOptions, address: string, token_id: bigint, quantity: bigint, currency: string, price_per_token: bigint, allow_list_proof: any, data: string) => {
    const tx = prepareContractCall({
        contract,
        method:
            "function claim(address _receiver, uint256 _tokenId,  uint256 _quantity, address _currency, uint256 _pricePerToken, (bytes32[],uint256,uint256,address) _allowlistProof, bytes _data) public",
        params: [address, token_id, quantity, currency, price_per_token, allow_list_proof, data]
    } as any);
    return tx
}


export const fetchNFTs = async (walletAddress: string, contract: Readonly<ContractOptions<[]>>) => {
    const ownedNFTs = await getOwnedNFTs({
        contract,
        start: 0,
        count: 10,
        address: walletAddress,
    });
    console.log("Owned NFTs:", ownedNFTs);
    return ownedNFTs
};

export const newSmartWallet = (token_bound_address: string) => {
    const config: SmartWalletOptions = {
        chain: baseSepolia,
        sponsorGas: true,
        factoryAddress: factoryAddress,
        overrides: {
            entrypointAddress: entryPoint,
            accountAddress: token_bound_address,
        },
    };

    return smartWallet(config);
};

// BigInt(84532)
export const get_tba_address = async (nft: any, registry_contract: Readonly<ContractOptions<[]>>, chain_id: bigint) => {
    let { id } = nft;
    const tba_address = await readContract({
        contract: registry_contract,
        method:
            "function account( address implementation, uint256 chainId, address tokenContract, uint256 tokenId, uint256 salt) view returns (address)",
        params: [implementation, chain_id, nftDropAddress, BigInt(id), 0n],
    });
    console.log("get_tba_address():", tba_address);
    return tba_address;
};

export const claim = async (
    contract: Readonly<ContractOptions<[]>>,
    account: Account,
    tba_address: string,
    token_id: BigInt,
    quantity: BigInt,
    currency: string,
    _allow_list: ALLOW_LIST_TYPE,
    data: String
) => {
    const tx = prepareContractCall({
        contract: contract,
        method:
            "function claim(address _receiver, uint256 _tokenId,  uint256 _quantity, address _currency, uint256 _pricePerToken, (bytes32[],uint256,uint256,address) _allowlistProof, bytes _data) public",
        params: [tba_address, token_id, quantity, currency, 0n, allow_list, data],
    } as any);

    const transactionResult = await sendTransaction({
        transaction: tx,
        account: account!,
    });

    return transactionResult;
};

export const client = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "",
});

export const bounded_token_contract = getContract({
    client,
    chain: baseSepolia,
    address: NFT_COLLECTION_ADDRESS!,
});

export const registry_contract = getContract({
    client,
    chain: baseSepolia,
    address: process.env.NEXT_PUBLIC_FACTORY_ADDRESS || "",
});

export const pgc_1155_id_contract = getContract({
    client,
    chain: baseSepolia,
    address: process.env.NEXT_PUBLIC_ID_NFT || "", // deploy a drop contract from thirdweb.com/explore
});



export const wallets = [
    createWallet("com.coinbase.wallet"),
    createWallet("io.metamask"),
];
