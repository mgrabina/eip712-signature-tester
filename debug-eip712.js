#!/usr/bin/env node

const { ethers } = require('ethers');

/**
 * Debug EIP-712 Construction
 * Shows exactly how domain separator and typed data hash are built
 */

async function debugEIP712Construction() {
    const privateKey = '0x1137a988850a48f6079308dad260bcab640a19af78852b2407fc3d1debe582d0';
    const wallet = new ethers.Wallet(privateKey);

    console.log('🔍 EIP-712 Construction Debug');
    console.log('===============================\n');

    console.log('🔑 Wallet Address:', wallet.address);
    console.log('');

    // Domain
    const domain = {
        name: "Gnosis Protocol",
        version: "v2",
        chainId: 1,
        verifyingContract: ethers.getAddress("0x9008D19f58AAbD9eD0D60971565AA8510560ab41")
    };

    console.log('🌐 Domain:');
    console.log(JSON.stringify(domain, null, 2));
    console.log('');

    // Types
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

    console.log('📋 Types:');
    console.log(JSON.stringify(types, null, 2));
    console.log('');

    // Message
    const message = {
        sellToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        buyToken: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        receiver: "0x5Dde7d9b46D1Ae3338A3d9f7d6dC2F214738Ed15",
        sellAmount: "9077413",
        buyAmount: "9061733",
        validTo: 1758209010,
        appData: "0x04bc4286b5202cee3733fe058851602586be788e278e88a29baab1f95b77a043",
        feeAmount: "922587",
        kind: "Sell",
        partiallyFillable: false,
        sellTokenBalance: "erc20",
        buyTokenBalance: "erc20"
    };

    console.log('💬 Message:');
    console.log(JSON.stringify(message, null, 2));
    console.log('');

    // Calculate domain separator manually
    console.log('🔨 Domain Separator Construction:');
    const domainTypeHash = ethers.keccak256(ethers.toUtf8Bytes(
        'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'
    ));
    console.log('Domain Type Hash:', domainTypeHash);

    const nameHash = ethers.keccak256(ethers.toUtf8Bytes(domain.name));
    const versionHash = ethers.keccak256(ethers.toUtf8Bytes(domain.version));
    
    console.log('Name Hash:', nameHash);
    console.log('Version Hash:', versionHash);
    console.log('Chain ID:', domain.chainId);
    console.log('Verifying Contract:', domain.verifyingContract);

    const domainSeparator = ethers.keccak256(ethers.solidityPacked(
        ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
        [domainTypeHash, nameHash, versionHash, domain.chainId, domain.verifyingContract]
    ));
    console.log('🎯 Domain Separator:', domainSeparator);
    console.log('');

    // Calculate message hash manually
    console.log('🔨 Message Hash Construction:');
    const orderTypeHash = ethers.keccak256(ethers.toUtf8Bytes(
        'Order(address sellToken,address buyToken,address receiver,uint256 sellAmount,uint256 buyAmount,uint32 validTo,bytes32 appData,uint256 feeAmount,string kind,bool partiallyFillable,string sellTokenBalance,string buyTokenBalance)'
    ));
    console.log('Order Type Hash:', orderTypeHash);

    const kindHash = ethers.keccak256(ethers.toUtf8Bytes(message.kind));
    const sellTokenBalanceHash = ethers.keccak256(ethers.toUtf8Bytes(message.sellTokenBalance));
    const buyTokenBalanceHash = ethers.keccak256(ethers.toUtf8Bytes(message.buyTokenBalance));

    console.log('Kind Hash:', kindHash);
    console.log('SellTokenBalance Hash:', sellTokenBalanceHash);
    console.log('BuyTokenBalance Hash:', buyTokenBalanceHash);

    const structHash = ethers.keccak256(ethers.solidityPacked(
        ['bytes32', 'address', 'address', 'address', 'uint256', 'uint256', 'uint32', 'bytes32', 'uint256', 'bytes32', 'bool', 'bytes32', 'bytes32'],
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
            kindHash,
            message.partiallyFillable,
            sellTokenBalanceHash,
            buyTokenBalanceHash
        ]
    ));
    console.log('🎯 Struct Hash:', structHash);
    console.log('');

    // Calculate final digest
    const digest = ethers.keccak256(ethers.solidityPacked(
        ['string', 'bytes32', 'bytes32'],
        ['\x19\x01', domainSeparator, structHash]
    ));
    console.log('🎯 Final Digest:', digest);
    console.log('');

    // Sign using ethers built-in method
    console.log('✍️  Signing with ethers.signTypedData:');
    const signature = await wallet.signTypedData(domain, types, message);
    console.log('Signature:', signature);

    // Verify
    const recoveredAddress = ethers.verifyTypedData(domain, types, message, signature);
    console.log('Recovered Address:', recoveredAddress);
    console.log('Matches Wallet:', recoveredAddress === wallet.address);
    console.log('');

    // Manual signing of digest
    console.log('✍️  Manual signing of digest:');
    const manualSignature = await wallet.signMessage(ethers.getBytes(digest));
    console.log('Manual Signature:', manualSignature);
    
    return {
        domain,
        types,
        message,
        domainSeparator,
        structHash,
        digest,
        signature,
        recoveredAddress
    };
}

if (require.main === module) {
    debugEIP712Construction().catch(console.error);
}

module.exports = { debugEIP712Construction };