#!/usr/bin/env node

const crypto = require('crypto');
const { ethers } = require('ethers');

/**
 * EIP-712 Signature Generator
 * 
 * This script generates EIP-712 signatures with automatic deadline generation.
 * It takes a private key, domain parameters, message types, and message data,
 * then returns the signature and deadline.
 */

class EIP712Signer {
    constructor(privateKey) {
        this.wallet = new ethers.Wallet(privateKey);
    }

    /**
     * Generate a deadline timestamp (current time + duration in seconds)
     * @param {number} durationSeconds - Duration in seconds from now (default: 1 hour)
     * @returns {number} Unix timestamp
     */
    generateDeadline(durationSeconds = 3600) {
        return Math.floor(Date.now() / 1000) + durationSeconds;
    }

    /**
     * Check if message fields are in the same order as type definition
     * @param {Object} types - Message types
     * @param {Object} message - Message data
     * @returns {Object} { isOrdered, typeOrder, messageOrder, reorderedMessage }
     */
    checkFieldOrder(types, message) {
        // Get the primary type (usually the first non-EIP712Domain type)
        const primaryType = Object.keys(types).find(key => key !== 'EIP712Domain');
        if (!primaryType) {
            return { isOrdered: true, typeOrder: [], messageOrder: [], reorderedMessage: message };
        }

        const typeOrder = types[primaryType].map(field => field.name);
        const messageOrder = Object.keys(message);
        const isOrdered = JSON.stringify(typeOrder) === JSON.stringify(messageOrder);

        // Create reordered message following type definition order
        const reorderedMessage = {};
        typeOrder.forEach(fieldName => {
            if (message.hasOwnProperty(fieldName)) {
                reorderedMessage[fieldName] = message[fieldName];
            }
        });

        return {
            isOrdered,
            typeOrder,
            messageOrder,
            reorderedMessage,
            primaryType
        };
    }

    /**
     * Sign EIP-712 typed data
     * @param {Object} domain - EIP-712 domain
     * @param {Object} types - Message types
     * @param {Object} value - Message data
     * @param {number} deadline - Optional deadline (will generate if not provided)
     * @returns {Object} { signature, deadline, recoveredAddress }
     */
    async signTypedData(domain, types, value, deadline = null) {
        try {
            // Check field ordering
            const orderCheck = this.checkFieldOrder(types, value);
            
            console.log('\n🔍 Field Order Check:');
            console.log('Primary Type:', orderCheck.primaryType);
            console.log('Type Order  :', orderCheck.typeOrder.join(', '));
            console.log('Message Order:', orderCheck.messageOrder.join(', '));
            
            if (!orderCheck.isOrdered) {
                console.log('⚠️  Field order mismatch detected!');
                console.log('\nField-by-field comparison:');
                const maxLength = Math.max(orderCheck.typeOrder.length, orderCheck.messageOrder.length);
                for (let i = 0; i < maxLength; i++) {
                    const typeField = orderCheck.typeOrder[i] || 'MISSING';
                    const msgField = orderCheck.messageOrder[i] || 'MISSING';
                    const match = typeField === msgField ? '✅' : '❌';
                    console.log(`  ${i + 1}. ${match} Type: ${typeField} | Message: ${msgField}`);
                }
                console.log('\n📝 Using reordered message for signing...');
                value = orderCheck.reorderedMessage;
            } else {
                console.log('✅ Field order matches type definition');
            }
            console.log('');
            // Generate deadline if not provided
            if (!deadline) {
                deadline = this.generateDeadline();
            }

            // Add deadline to the message if it has a deadline field
            const messageWithDeadline = { ...value };
            if (types[Object.keys(types).find(key => key !== 'EIP712Domain')]) {
                const messageType = types[Object.keys(types).find(key => key !== 'EIP712Domain')];
                if (messageType.some(field => field.name === 'deadline')) {
                    messageWithDeadline.deadline = deadline;
                }
            }

            // Sign the typed data
            const signature = await this.wallet.signTypedData(domain, types, messageWithDeadline);

            // Verify signature by recovering address
            const recoveredAddress = ethers.verifyTypedData(domain, types, messageWithDeadline, signature);

            return {
                signature,
                deadline,
                recoveredAddress,
                messageWithDeadline,
                signer: this.wallet.address
            };
        } catch (error) {
            throw new Error(`Failed to sign typed data: ${error.message}`);
        }
    }

    /**
     * Create a permit signature (common EIP-712 use case)
     * @param {Object} permitData - Permit parameters
     * @returns {Object} Signature result
     */
    async signPermit(permitData) {
        const {
            tokenName,
            tokenVersion = '1',
            chainId,
            verifyingContract,
            owner,
            spender,
            value,
            nonce,
            deadline = null
        } = permitData;

        const domain = {
            name: tokenName,
            version: tokenVersion,
            chainId: chainId,
            verifyingContract: ethers.getAddress(verifyingContract)
        };

        const types = {
            Permit: [
                { name: 'owner', type: 'address' },
                { name: 'spender', type: 'address' },
                { name: 'value', type: 'uint256' },
                { name: 'nonce', type: 'uint256' },
                { name: 'deadline', type: 'uint256' }
            ]
        };

        const message = {
            owner: owner ? ethers.getAddress(owner) : this.wallet.address,
            spender: ethers.getAddress(spender),
            value,
            nonce,
            deadline: deadline || this.generateDeadline()
        };

        return await this.signTypedData(domain, types, message, message.deadline);
    }
}

/**
 * Command line interface
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log(`
EIP-712 Signature Generator

Usage:
  node eip712-signer.js <private_key> [options]

Options:
  --domain-name <name>          Domain name
  --domain-version <version>    Domain version (default: "1")
  --chain-id <id>              Chain ID (default: 1)
  --verifying-contract <addr>   Contract address
  --permit                     Generate a permit signature
  --owner <address>            Owner address (default: derived from private key)
  --spender <address>          Spender address (required for permit)
  --value <amount>             Amount to approve (required for permit)
  --nonce <nonce>              Nonce (required for permit)
  --deadline <timestamp>       Custom deadline (default: 1 hour from now)
  --deadline-duration <seconds> Deadline duration in seconds (default: 3600)
  --custom-json <json>         Custom EIP-712 message as JSON

Examples:
  # Generate a permit signature
  node eip712-signer.js 0x1234... --permit \\
    --domain-name "USD Coin" \\
    --chain-id 1 \\
    --verifying-contract 0xA0b86a33E6441e3a8b06dd2BC5BF6ef5C0aA2CB0 \\
    --spender 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D \\
    --value 1000000000000000000 \\
    --nonce 0

  # Custom EIP-712 signature
  node eip712-signer.js 0x1234... \\
    --domain-name "MyApp" \\
    --chain-id 1 \\
    --verifying-contract 0x... \\
    --custom-json '{"types":{"Message":[{"name":"content","type":"string"}]},"message":{"content":"Hello"}}'
        `);
        process.exit(0);
    }

    const privateKey = args[0];
    if (!privateKey || !privateKey.startsWith('0x')) {
        console.error('Error: Please provide a valid private key starting with 0x');
        process.exit(1);
    }

    try {
        const signer = new EIP712Signer(privateKey);
        
        // Parse command line arguments
        const options = {};
        for (let i = 1; i < args.length; i++) {
            const arg = args[i];
            if (arg.startsWith('--')) {
                const key = arg.replace('--', '').replace(/-/g, '_');
                // Check if this is a boolean flag
                if (i + 1 >= args.length || args[i + 1].startsWith('--')) {
                    options[key] = true;
                } else {
                    options[key] = args[i + 1];
                    i++; // Skip the value
                }
            }
        }

        let result;

        if (options.permit) {
            // Generate permit signature
            const permitData = {
                tokenName: options.domain_name || 'Token',
                tokenVersion: options.domain_version || '1',
                chainId: parseInt(options.chain_id) || 1,
                verifyingContract: options.verifying_contract,
                owner: options.owner,
                spender: options.spender,
                value: options.value,
                nonce: parseInt(options.nonce) || 0,
                deadline: options.deadline ? parseInt(options.deadline) : null
            };

            if (!permitData.verifyingContract || !permitData.spender || !permitData.value) {
                console.error('Error: For permit signatures, --verifying-contract, --spender, and --value are required');
                process.exit(1);
            }

            result = await signer.signPermit(permitData);
        } else if (options.custom_json) {
            // Custom EIP-712 signature
            const customData = JSON.parse(options.custom_json);
            const domain = {
                name: options.domain_name || 'Custom',
                version: options.domain_version || '1',
                chainId: parseInt(options.chain_id) || 1,
                verifyingContract: options.verifying_contract ? ethers.getAddress(options.verifying_contract) : ethers.ZeroAddress
            };

            const deadlineDuration = options.deadline_duration ? parseInt(options.deadline_duration) : 3600;
            const deadline = options.deadline ? parseInt(options.deadline) : signer.generateDeadline(deadlineDuration);

            result = await signer.signTypedData(domain, customData.types, customData.message, deadline);
        } else {
            console.error('Error: Please specify either --permit or --custom-json');
            process.exit(1);
        }

        // Output result
        console.log(JSON.stringify({
            signature: result.signature,
            deadline: result.deadline,
            signer: result.signer,
            recoveredAddress: result.recoveredAddress,
            messageWithDeadline: result.messageWithDeadline,
            timestamp: new Date().toISOString()
        }, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Export for use as a module
module.exports = { EIP712Signer };

// Run CLI if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}