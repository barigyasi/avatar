import { NextApiRequest, NextApiResponse } from 'next';
import { createThirdwebClient, getContract } from 'thirdweb';
import { privateKeyToAccount } from 'thirdweb/wallets';
import { generateMintSignature } from 'thirdweb/extensions/erc721';
import { defineChain } from 'thirdweb/chains';

const client = createThirdwebClient({
  clientId: "67991b945c24524db688cb2f9a366a5b"
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
  chain: defineChain(8453),
  address: "0x3917465c972d6c6D4eB4fB0f21E8D5023dDaF3Cf"
});

function bigIntToJSON(key: string, value: any) {
  return typeof value === 'bigint' ? value.toString() : value;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { authorAddress, nftName, image, traits } = req.body;

      if (!authorAddress) {
        throw new Error("Missing authorAddress");
      }
      if (!nftName) {
        throw new Error("Missing nftName");
      }
      if (!image) {
        throw new Error("Missing image");
      }

      // Check for traits
      if (!traits) {
        throw new Error("Missing traits");
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
            attributes: [
              { trait_type: "Eyes", value: traits.eye },
              { trait_type: "Mouth", value: traits.mouth },
              { trait_type: "Head", value: traits.head },
              { trait_type: "Top", value: traits.top },
              { trait_type: "Chain", value: traits.chain },
              { trait_type: "Glasses", value: traits.glasses },
            ],
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
