import { ethers, keccak256, AbiCoder } from 'ethers';

/**
 * Sign Aster API requests using Web3 signature (V3 API)
 * Based on consolidation.js and tx.py examples
 */
export class AsterSigner {
  private wallet: ethers.Wallet;
  private user: string;
  private signer: string;

  constructor(user: string, signer: string, privateKey: string) {
    this.wallet = new ethers.Wallet(privateKey);
    this.user = user;
    this.signer = signer;
  }

  /**
   * Generate nonce (current time in microseconds)
   */
  generateNonce(): bigint {
    return BigInt(Date.now()) * 1000n; // Convert milliseconds to microseconds
  }

  /**
   * Sign API request parameters
   *
   * Process:
   * 1. Sort params by key (ASCII order)
   * 2. Convert to JSON string
   * 3. ABI encode: (string, address, address, uint256)
   * 4. Keccak256 hash
   * 5. ECDSA sign with personal_sign
   */
  async signRequest(params: Record<string, any>, nonce: bigint): Promise<string> {
    // 1. Remove null/undefined values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== null && v !== undefined)
    );

    // 2. Convert all values to strings
    const stringifiedParams = this.stringifyParams(cleanParams);

    // 3. Sort by keys and generate JSON string
    const sortedKeys = Object.keys(stringifiedParams).sort();
    const sortedParams: Record<string, string> = {};
    sortedKeys.forEach(key => {
      sortedParams[key] = stringifiedParams[key];
    });

    const jsonStr = JSON.stringify(sortedParams);

    // 4. ABI encode: (string, address, address, uint256)
    const abiCoder = AbiCoder.defaultAbiCoder();
    const encoded = abiCoder.encode(
      ['string', 'address', 'address', 'uint256'],
      [jsonStr, this.user, this.signer, nonce]
    );

    // 5. Keccak256 hash
    const hash = keccak256(encoded);

    // 6. Sign with ethers (uses personal_sign automatically)
    const signature = await this.wallet.signMessage(ethers.getBytes(hash));

    return signature;
  }

  /**
   * Recursively convert all values to strings
   */
  private stringifyParams(params: Record<string, any>): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        result[key] = JSON.stringify(
          value.map(item =>
            typeof item === 'object' ? JSON.stringify(this.stringifyParams(item)) : String(item)
          )
        );
      } else if (value !== null && typeof value === 'object') {
        result[key] = JSON.stringify(this.stringifyParams(value));
      } else {
        result[key] = String(value);
      }
    }

    return result;
  }

  getUserAddress(): string {
    return this.user;
  }

  getSignerAddress(): string {
    return this.signer;
  }
}
