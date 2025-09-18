#!/usr/bin/env node

/**
 * Test Examples for EIP-712 Signer
 * 
 * This file demonstrates various use cases and validates the functionality
 * of the EIP-712 signature generator.
 */

const { EIP712Signer } = require('./eip712-signer.js');
const { ethers } = require('ethers');

// Generate a test private key (DO NOT use in production)
const testWallet = ethers.Wallet.createRandom();
const TEST_PRIVATE_KEY = testWallet.privateKey;

console.log('🧪 Testing EIP-712 Signer');
console.log('📝 Test wallet address:', testWallet.address);
console.log('🔑 Test private key:', TEST_PRIVATE_KEY);
console.log('');

async function runTests() {
    const signer = new EIP712Signer(TEST_PRIVATE_KEY);

    console.log('1️⃣ Testing deadline generation...');
    const deadline1h = signer.generateDeadline();
    const deadline24h = signer.generateDeadline(86400);
    console.log('   ✅ 1 hour deadline:', new Date(deadline1h * 1000).toISOString());
    console.log('   ✅ 24 hour deadline:', new Date(deadline24h * 1000).toISOString());
    console.log('');

    console.log('2️⃣ Testing ERC-20 Permit signature...');
    try {
        const permitResult = await signer.signPermit({
            tokenName: 'Test Token',
            chainId: 1,
            verifyingContract: ethers.getAddress('0xA0b86a33E6441e3a8b06dd2BC5BF6ef5C0aA2CB0'),
            spender: ethers.getAddress('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'),
            value: '1000000000000000000', // 1 ETH
            nonce: 0
        });
        console.log('   ✅ Permit signature generated');
        console.log('   📝 Signature:', permitResult.signature.substring(0, 20) + '...');
        console.log('   ⏰ Deadline:', new Date(permitResult.deadline * 1000).toISOString());
        console.log('   🔍 Recovered address matches:', permitResult.recoveredAddress === testWallet.address);
    } catch (error) {
        console.log('   ❌ Permit test failed:', error.message);
    }
    console.log('');

    console.log('3️⃣ Testing custom EIP-712 message...');
    try {
        const domain = {
            name: 'TestDApp',
            version: '1',
            chainId: 1,
            verifyingContract: ethers.getAddress('0x742d35Cc6634C0532925a3b8D3Ac6532495dCe66')
        };

        const types = {
            Vote: [
                { name: 'proposal', type: 'uint256' },
                { name: 'support', type: 'bool' },
                { name: 'voter', type: 'address' }
            ]
        };

        const message = {
            proposal: 1,
            support: true,
            voter: testWallet.address
        };

        const customResult = await signer.signTypedData(domain, types, message);
        console.log('   ✅ Custom signature generated');
        console.log('   📝 Signature:', customResult.signature.substring(0, 20) + '...');
        console.log('   ⏰ Deadline:', new Date(customResult.deadline * 1000).toISOString());
        console.log('   🔍 Recovered address matches:', customResult.recoveredAddress === testWallet.address);
    } catch (error) {
        console.log('   ❌ Custom message test failed:', error.message);
    }
    console.log('');

    console.log('4️⃣ Testing message with deadline field...');
    try {
        const domain = {
            name: 'DeadlineTest',
            version: '1',
            chainId: 1,
            verifyingContract: '0x1234567890123456789012345678901234567890'
        };

        const types = {
            Action: [
                { name: 'user', type: 'address' },
                { name: 'action', type: 'string' },
                { name: 'deadline', type: 'uint256' }
            ]
        };

        const message = {
            user: testWallet.address,
            action: 'withdraw'
        };

        const deadlineResult = await signer.signTypedData(domain, types, message);
        console.log('   ✅ Deadline-aware signature generated');
        console.log('   📝 Message includes deadline:', deadlineResult.messageWithDeadline.deadline === deadlineResult.deadline);
        console.log('   ⏰ Generated deadline:', new Date(deadlineResult.deadline * 1000).toISOString());
        console.log('   🔍 Recovered address matches:', deadlineResult.recoveredAddress === testWallet.address);
    } catch (error) {
        console.log('   ❌ Deadline message test failed:', error.message);
    }
    console.log('');

    console.log('5️⃣ Testing signature verification...');
    try {
        const domain = {
            name: 'VerificationTest',
            version: '1',
            chainId: 1,
            verifyingContract: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
        };

        const types = {
            Message: [
                { name: 'content', type: 'string' },
                { name: 'sender', type: 'address' }
            ]
        };

        const message = {
            content: 'Hello, World!',
            sender: testWallet.address
        };

        const result = await signer.signTypedData(domain, types, message);
        
        // Verify signature manually
        const recoveredAddress = ethers.verifyTypedData(
            domain,
            types,
            result.messageWithDeadline,
            result.signature
        );

        console.log('   ✅ Manual verification successful');
        console.log('   📝 Original address:', testWallet.address);
        console.log('   📝 Recovered address:', recoveredAddress);
        console.log('   🔍 Addresses match:', recoveredAddress === testWallet.address);
    } catch (error) {
        console.log('   ❌ Verification test failed:', error.message);
    }
    console.log('');

    console.log('🎉 All tests completed!');
    console.log('');
    console.log('💡 Usage examples:');
    console.log(`   node eip712-signer.js ${TEST_PRIVATE_KEY} --permit --domain-name "USDC" --chain-id 1 --verifying-contract 0xA0b86a33E6441e3a8b06dd2BC5BF6ef5C0aA2CB0 --spender 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D --value 1000000 --nonce 0`);
    console.log('');
    console.log(`   node eip712-signer.js ${TEST_PRIVATE_KEY} --domain-name "MyApp" --chain-id 1 --verifying-contract 0x742d35Cc... --custom-json '{"types":{"Vote":[{"name":"proposal","type":"uint256"}]},"message":{"proposal":1}}'`);
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests, TEST_PRIVATE_KEY };