import { NextApiRequest, NextApiResponse } from 'next';
import { createThirdwebClient, getContract } from 'thirdweb';
import { privateKeyToAccount } from 'thirdweb/wallets';
import { generateMintSignature } from 'thirdweb/extensions/erc721';
import { defineChain } from 'thirdweb/chains';

const client = createThirdwebClient({
  clientId: "3872c336ba269d320eaa98336bcddf7e"
});

const privateKey = process.env.WALLET_PRIVATE_KEY;
const adminAddress = process.env.ADMIN_ADDRESS;

if (!privateKey) {
  throw new Error("WALLET_PRIVATE_KEY is not defined in environment variables");
}

const account = privateKeyToAccount({
  client,
  privateKey: privateKey
});

const contract = getContract({
  client,
  chain: defineChain(84532),
  address: "0x92F2666443EBFa7129f39c9E43758B33CD5D73F8"
});

function bigIntToJSON(key: string, value: any) {
  return typeof value === 'bigint' ? value.toString() : value;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { authorAddress, nftName, image } = req.body;

      if (!authorAddress) {
        throw new Error("Missing authorAddress");
      }
      if (!nftName) {
        throw new Error("Missing nftName");
      }
      if (!image) {
        throw new Error("Missing image");
      }

      const { payload, signature } = await generateMintSignature({
        account,
        contract,
        mintRequest: {
          to: authorAddress,
          metadata: {
            name: nftName,
            description: "Public Goods Club",
            image: image,
          },
          price: "0.0015",
          royaltyRecipient: adminAddress,
          royaltyBps: 0,
          primarySaleRecipient: adminAddress,
        },
      });

      // Serialize the response, then parse it back to handle BigInt serialization
      const responseData = JSON.parse(JSON.stringify({ payload, signature }, bigIntToJSON));
      res.status(200).json(responseData);
    } catch (error: any) {
      console.error("Error generating mint signature:", error);
      res.status(400).json({ error: `Error generating mint signature: ${error.message}` });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
