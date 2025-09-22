#!/usr/bin/env node

const { ethers } = require('ethers');

/**
 * Test to recover address from signature and debug mismatch
 */

async function recoverAddressTest() {
    console.log('🔍 Signature Recovery Test');
    console.log('==========================\n');

    const signature = '0x6efd78042df5d4fb3a4acfef2307772127894fe53423ce46cb710baf543b03db52d2781ea4b2ae29cc45626d5d61b96f32526896434eb4db81bc345a1396562b1c';
    const expectedAddress = '0x5Dde7d9b46D1Ae3338A3d9f7d6dC2F214738Ed15';
    const reportedRecoveredAddress = '0x2bc6bb9055c2e9ef9887c398f11e50dd82ee5186';
    const reportedSigningHash = '0xf835d18ea61037135b0cff331a73afa5f83d54233b89927ff1196dccd7ef4f78';

    console.log('📝 Given Information:');
    console.log('Signature:', signature);
    console.log('Expected Address:', expectedAddress);
    console.log('Reported Recovered Address:', reportedRecoveredAddress);
    console.log('Reported Signing Hash:', reportedSigningHash);
    console.log('');

    // Domain and types from our successful signing
    const domain = {
        name: "Gnosis Protocol",
        version: "v2",
        chainId: 1,
        verifyingContract: "0x9008D19f58AAbD9eD0D60971565AA8510560ab41"
    };

    const types = {
        Order: [
            { name: "sellToken", type: "address" },
            { name: "buyToken", type: "address" },
            { name: "receiver", type: "address" },
            { name: "sellAmount", type: "uint256" },
            { name: "buyAmount", type: "uint256" },
            { name: "validTo", type: "uint32" },
            { name: "appData", type: "bytes32" },
            { name: "feeAmount", type: "uint256" },
            { name: "kind", type: "bytes32" },
            { name: "partiallyFillable", type: "bytes1" },
            { name: "sellTokenBalance", type: "bytes32" },
            { name: "buyTokenBalance", type: "bytes32" }
        ]
    };

    const message = {
        sellToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        buyToken: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        receiver: "0x0000000000000000000000000000000000000000",
        sellAmount: "9077413",
        buyAmount: "9061733",
        validTo: 1758213165,
        appData: "0x04bc4286b5202cee3733fe058851602586be788e278e88a29baab1f95b77a043",
        feeAmount: "922587",
        kind: "0xf3b277728b3fee749481eb3e0b3b48980dbbab78658fc419025cb16eee346775",
        partiallyFillable: "0x00",
        sellTokenBalance: "0x5a28e9363bb942b639270062aa6bb295f434bcdfc42c97267bf003f272060dc9",
        buyTokenBalance: "0x5a28e9363bb942b639270062aa6bb295f434bcdfc42c97267bf003f272060dc9"
    };

    console.log('🔨 Testing Our EIP-712 Recovery:');
    try {
        const recoveredAddress = ethers.verifyTypedData(domain, types, message, signature);
        console.log('Our Recovered Address:', recoveredAddress);
        console.log('Matches Expected:', recoveredAddress.toLowerCase() === expectedAddress.toLowerCase());
        console.log('');
    } catch (error) {
        console.log('❌ EIP-712 Recovery Failed:', error.message);
        console.log('');
    }

    console.log('🔨 Testing Raw Hash Recovery:');
    try {
        const recoveredFromRawHash = ethers.recoverAddress(reportedSigningHash, signature);
        console.log('Recovered from Raw Hash:', recoveredFromRawHash);
        console.log('Matches Reported:', recoveredFromRawHash.toLowerCase() === reportedRecoveredAddress.toLowerCase());
        console.log('Matches Expected:', recoveredFromRawHash.toLowerCase() === expectedAddress.toLowerCase());
        console.log('');
    } catch (error) {
        console.log('❌ Raw Hash Recovery Failed:', error.message);
        console.log('');
    }

    console.log('🔨 Computing Our EIP-712 Hash:');
    // Calculate our EIP-712 hash
    const domainTypeHash = ethers.keccak256(ethers.toUtf8Bytes(
        'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'
    ));
    const nameHash = ethers.keccak256(ethers.toUtf8Bytes(domain.name));
    const versionHash = ethers.keccak256(ethers.toUtf8Bytes(domain.version));
    const domainSeparator = ethers.keccak256(ethers.solidityPacked(
        ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
        [domainTypeHash, nameHash, versionHash, domain.chainId, domain.verifyingContract]
    ));

    const orderTypeHash = ethers.keccak256(ethers.toUtf8Bytes(
        'Order(address sellToken,address buyToken,address receiver,uint256 sellAmount,uint256 buyAmount,uint32 validTo,bytes32 appData,uint256 feeAmount,bytes32 kind,bytes1 partiallyFillable,bytes32 sellTokenBalance,bytes32 buyTokenBalance)'
    ));

    const structHash = ethers.keccak256(ethers.solidityPacked(
        ['bytes32', 'address', 'address', 'address', 'uint256', 'uint256', 'uint32', 'bytes32', 'uint256', 'bytes32', 'bytes1', 'bytes32', 'bytes32'],
        [
            orderTypeHash,
            message.sellToken,
            message.buyToken,
            message.receiver,
            message.sellAmount,
            message.buyAmount,
            message.validTo,
            message.appData,
            message.feeAmount,
            message.kind,
            message.partiallyFillable,
            message.sellTokenBalance,
            message.buyTokenBalance
        ]
    ));

    const ourEIP712Hash = ethers.keccak256(ethers.solidityPacked(
        ['string', 'bytes32', 'bytes32'],
        ['\x19\x01', domainSeparator, structHash]
    ));

    console.log('Our EIP-712 Hash:', ourEIP712Hash);
    console.log('Reported Hash:   ', reportedSigningHash);
    console.log('Hashes Match:', ourEIP712Hash.toLowerCase() === reportedSigningHash.toLowerCase());
    console.log('');

    console.log('🔨 Testing Recovery with Our Hash:');
    try {
        const recoveredFromOurHash = ethers.recoverAddress(ourEIP712Hash, signature);
        console.log('Recovered from Our Hash:', recoveredFromOurHash);
        console.log('Matches Expected:', recoveredFromOurHash.toLowerCase() === expectedAddress.toLowerCase());
    } catch (error) {
        console.log('❌ Recovery with Our Hash Failed:', error.message);
    }

    console.log('');
    console.log('🔍 Analysis:');
    if (ourEIP712Hash.toLowerCase() !== reportedSigningHash.toLowerCase()) {
        console.log('❌ Hash mismatch detected! The CoW Protocol API is computing a different hash than ours.');
        console.log('   This suggests differences in:');
        console.log('   - Domain separator construction');
        console.log('   - Message type encoding');
        console.log('   - Field ordering or types');
        console.log('   - Message values encoding');
    } else {
        console.log('✅ Hashes match - the issue might be in signature format or recovery method');
    }
}

if (require.main === module) {
    recoverAddressTest().catch(console.error);
}

module.exports = { recoverAddressTest };