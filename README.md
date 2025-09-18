# EIP-712 Signature Generator

A comprehensive Node.js script for generating EIP-712 signatures with automatic deadline generation. Perfect for DeFi applications, permit signatures, and any protocol requiring typed data signatures.

## Features

- 🔐 **Secure**: Uses ethers.js for cryptographic operations
- ⏰ **Automatic Deadlines**: Generates deadlines automatically or accepts custom ones
- 🎯 **Permit Support**: Built-in support for ERC-20 permit signatures
- 🔧 **Flexible**: Supports custom EIP-712 domains and message types
- 📱 **CLI Ready**: Command-line interface for easy integration
- 🧩 **Modular**: Can be imported as a Node.js module

## Installation

```bash
npm install
```

Or install ethers manually:
```bash
npm install ethers
```

## Quick Start

### 1. Generate a Permit Signature

```bash
node eip712-signer.js 0x1234567890abcdef1234567890abcdef12345678 \
  --permit \
  --domain-name "USD Coin" \
  --chain-id 1 \
  --verifying-contract 0xA0b86a33E6441e3a8b06dd2BC5BF6ef5C0aA2CB0 \
  --spender 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D \
  --value 1000000000000000000 \
  --nonce 0
```

### 2. Custom EIP-712 Message

```bash
node eip712-signer.js 0x1234567890abcdef1234567890abcdef12345678 \
  --domain-name "MyDApp" \
  --chain-id 1 \
  --verifying-contract 0x742d35Cc6634C0532925a3b8D3Ac6532495dCe66 \
  --custom-json '{"types":{"Vote":[{"name":"proposal","type":"uint256"},{"name":"support","type":"bool"}]},"message":{"proposal":1,"support":true}}'
```

## API Reference

### EIP712Signer Class

```javascript
const { EIP712Signer } = require('./eip712-signer.js');

const signer = new EIP712Signer('0x1234567890abcdef...');
```

#### Methods

##### `generateDeadline(durationSeconds = 3600)`
Generate a deadline timestamp.
- `durationSeconds`: Duration from now in seconds (default: 1 hour)
- Returns: Unix timestamp

##### `signTypedData(domain, types, value, deadline = null)`
Sign EIP-712 typed data.
- `domain`: EIP-712 domain object
- `types`: Message types object
- `value`: Message data object
- `deadline`: Optional deadline (auto-generated if not provided)
- Returns: `{ signature, deadline, recoveredAddress, messageWithDeadline, signer }`

##### `signPermit(permitData)`
Generate a permit signature.
- `permitData`: Permit configuration object
- Returns: Signature result object

## Common Use Cases

### 1. ERC-20 Permit Signatures

```javascript
const { EIP712Signer } = require('./eip712-signer.js');

const signer = new EIP712Signer('0x...');

const result = await signer.signPermit({
  tokenName: 'USD Coin',
  chainId: 1,
  verifyingContract: '0xA0b86a33E6441e3a8b06dd2BC5BF6ef5C0aA2CB0', // USDC address
  spender: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router
  value: '1000000', // 1 USDC (6 decimals)
  nonce: 0
});

console.log('Signature:', result.signature);
console.log('Deadline:', result.deadline);
```

### 2. Aave Credit Delegation

```javascript
const domain = {
  name: 'Aave variable debt bearing USDC',
  version: '1',
  chainId: 1,
  verifyingContract: '0x619beb58998eD2278e08620f97007e1116D5D25b'
};

const types = {
  DelegationWithSig: [
    { name: 'delegatee', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' }
  ]
};

const message = {
  delegatee: '0x742d35Cc6634C0532925a3b8D3Ac6532495dCe66',
  value: '1000000000000000000',
  nonce: 0
};

const result = await signer.signTypedData(domain, types, message);
```

### 3. OpenSea Seaport Orders

```javascript
const domain = {
  name: 'Seaport',
  version: '1.1',
  chainId: 1,
  verifyingContract: '0x00000000006c3852cbEf3e08E8dF289169EdE581'
};

const types = {
  OrderComponents: [
    { name: 'offerer', type: 'address' },
    { name: 'zone', type: 'address' },
    { name: 'offer', type: 'OfferItem[]' },
    { name: 'consideration', type: 'ConsiderationItem[]' },
    { name: 'orderType', type: 'uint8' },
    { name: 'startTime', type: 'uint256' },
    { name: 'endTime', type: 'uint256' },
    { name: 'zoneHash', type: 'bytes32' },
    { name: 'salt', type: 'uint256' },
    { name: 'counter', type: 'uint256' }
  ],
  OfferItem: [
    { name: 'itemType', type: 'uint8' },
    { name: 'token', type: 'address' },
    { name: 'identifierOrCriteria', type: 'uint256' },
    { name: 'startAmount', type: 'uint256' },
    { name: 'endAmount', type: 'uint256' }
  ],
  ConsiderationItem: [
    { name: 'itemType', type: 'uint8' },
    { name: 'token', type: 'address' },
    { name: 'identifierOrCriteria', type: 'uint256' },
    { name: 'startAmount', type: 'uint256' },
    { name: 'endAmount', type: 'uint256' },
    { name: 'recipient', type: 'address' }
  ]
};

// Your order data here...
const result = await signer.signTypedData(domain, types, orderData);
```

## Command Line Options

| Option | Description | Required |
|--------|-------------|----------|
| `--permit` | Generate a permit signature | No |
| `--domain-name` | Domain name | Yes |
| `--domain-version` | Domain version (default: "1") | No |
| `--chain-id` | Chain ID (default: 1) | No |
| `--verifying-contract` | Contract address | Yes |
| `--spender` | Spender address (permit only) | Yes (for permit) |
| `--value` | Amount to approve (permit only) | Yes (for permit) |
| `--nonce` | Nonce (permit only) | Yes (for permit) |
| `--owner` | Owner address (default: from private key) | No |
| `--deadline` | Custom deadline timestamp | No |
| `--deadline-duration` | Deadline duration in seconds | No |
| `--custom-json` | Custom EIP-712 message as JSON | No |

## Output Format

The script returns a JSON object with:

```json
{
  "signature": "0x...",
  "deadline": 1234567890,
  "signer": "0x...",
  "recoveredAddress": "0x...",
  "messageWithDeadline": { ... },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Security Notes

- ⚠️ **Never commit private keys to version control**
- 🔒 Use environment variables for private keys in production
- 🔍 Always verify the `recoveredAddress` matches your expected signer
- ⏰ Set appropriate deadline durations for your use case
- 🧪 Test signatures on testnets before mainnet deployment

## Environment Variables

You can use environment variables instead of command line arguments:

```bash
export PRIVATE_KEY="0x..."
export CHAIN_ID="1"
export VERIFYING_CONTRACT="0x..."

node eip712-signer.js $PRIVATE_KEY --permit --domain-name "USDC" --spender "0x..." --value "1000000" --nonce 0
```

## Common Networks

| Network | Chain ID |
|---------|----------|
| Ethereum Mainnet | 1 |
| Goerli | 5 |
| Sepolia | 11155111 |
| Polygon | 137 |
| Arbitrum One | 42161 |
| Optimism | 10 |

## Troubleshooting

### Invalid Private Key
Ensure your private key starts with `0x` and is 64 characters long (32 bytes).

### Signature Verification Failed
Check that:
- Domain parameters match the contract
- Message types are correctly defined
- All required fields are included

### Node.js Version
Requires Node.js 14+ for ethers v6 compatibility.

## License

MIT License - feel free to use in your projects!