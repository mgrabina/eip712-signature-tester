#!/usr/bin/env node

const { ethers } = require('ethers');

/**
 * Detailed breakdown of OUR EIP-712 computation
 */

async function showOurEIP712Breakdown() {
    console.log('🔍 OUR EIP-712 Computation Breakdown');
    console.log('====================================\n');

    // ===========================================
    // 1. FIELD ORDERING IN ORDER TYPE DEFINITION
    // ===========================================
    console.log('1️⃣ **FIELD ORDERING** in Order type:');
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
    
    console.log('Our Order type array:');
    types.Order.forEach((field, index) => {
        console.log(`  ${index + 1}. ${field.name}: ${field.type}`);
    });
    console.log('');

    // ===========================================
    // 2. TYPE ENCODING 
    // ===========================================
    console.log('2️⃣ **TYPE ENCODING** - Order type hash:');
    const orderTypeString = 'Order(address sellToken,address buyToken,address receiver,uint256 sellAmount,uint256 buyAmount,uint32 validTo,bytes32 appData,uint256 feeAmount,bytes32 kind,bytes1 partiallyFillable,bytes32 sellTokenBalance,bytes32 buyTokenBalance)';
    const orderTypeHash = ethers.keccak256(ethers.toUtf8Bytes(orderTypeString));
    
    console.log('Type string:', orderTypeString);
    console.log('Type hash:', orderTypeHash);
    console.log('');

    // ===========================================
    // 3. DOMAIN SEPARATOR CONSTRUCTION
    // ===========================================
    console.log('3️⃣ **DOMAIN SEPARATOR** construction:');
    const domain = {
        name: "Gnosis Protocol",
        version: "v2",
        chainId: 1,
        verifyingContract: "0x9008D19f58AAbD9eD0D60971565AA8510560ab41"
    };

    const domainTypeString = 'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)';
    const domainTypeHash = ethers.keccak256(ethers.toUtf8Bytes(domainTypeString));
    const nameHash = ethers.keccak256(ethers.toUtf8Bytes(domain.name));
    const versionHash = ethers.keccak256(ethers.toUtf8Bytes(domain.version));
    
    console.log('Domain type string:', domainTypeString);
    console.log('Domain type hash:', domainTypeHash);
    console.log('Name hash:', nameHash, `(from: "${domain.name}")`);
    console.log('Version hash:', versionHash, `(from: "${domain.version}")`);
    console.log('Chain ID:', domain.chainId);
    console.log('Verifying Contract:', domain.verifyingContract);
    
    const domainSeparator = ethers.keccak256(ethers.solidityPacked(
        ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
        [domainTypeHash, nameHash, versionHash, domain.chainId, domain.verifyingContract]
    ));
    console.log('Domain Separator:', domainSeparator);
    console.log('');

    // ===========================================
    // 4. MESSAGE ENCODING FOR BYTES FIELDS
    // ===========================================
    console.log('4️⃣ **MESSAGE ENCODING** for bytes fields:');
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

    console.log('Message field encoding:');
    console.log('  sellToken (address):', message.sellToken);
    console.log('  buyToken (address):', message.buyToken);
    console.log('  receiver (address):', message.receiver);
    console.log('  sellAmount (uint256):', message.sellAmount);
    console.log('  buyAmount (uint256):', message.buyAmount);
    console.log('  validTo (uint32):', message.validTo);
    console.log('  appData (bytes32):', message.appData);
    console.log('  feeAmount (uint256):', message.feeAmount);
    console.log('  kind (bytes32):', message.kind);
    console.log('  partiallyFillable (bytes1):', message.partiallyFillable);
    console.log('  sellTokenBalance (bytes32):', message.sellTokenBalance);
    console.log('  buyTokenBalance (bytes32):', message.buyTokenBalance);
    console.log('');

    // ===========================================
    // STRUCT HASH CALCULATION
    // ===========================================
    console.log('📊 **STRUCT HASH** calculation:');
    console.log('solidityPacked array types:');
    const packTypes = ['bytes32', 'address', 'address', 'address', 'uint256', 'uint256', 'uint32', 'bytes32', 'uint256', 'bytes32', 'bytes1', 'bytes32', 'bytes32'];
    const packValues = [
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
    ];

    packTypes.forEach((type, index) => {
        console.log(`  ${index + 1}. ${type}: ${packValues[index]}`);
    });

    const structHash = ethers.keccak256(ethers.solidityPacked(packTypes, packValues));
    console.log('Struct Hash:', structHash);
    console.log('');

    // ===========================================
    // FINAL EIP-712 HASH
    // ===========================================
    console.log('🎯 **FINAL EIP-712 HASH**:');
    const finalHash = ethers.keccak256(ethers.solidityPacked(
        ['string', 'bytes32', 'bytes32'],
        ['\x19\x01', domainSeparator, structHash]
    ));
    console.log('Final pack: solidityPacked([string, bytes32, bytes32], ["\\x19\\x01", domainSeparator, structHash])');
    console.log('  "\\x19\\x01"');
    console.log('  domainSeparator:', domainSeparator);
    console.log('  structHash:', structHash);
    console.log('**OUR FINAL HASH:**', finalHash);
    console.log('');

    console.log('🆚 **COMPARISON**:');
    console.log('Our Hash:     ', finalHash);
    console.log('CoW API Hash: ', '0xf835d18ea61037135b0cff331a73afa5f83d54233b89927ff1196dccd7ef4f78');
    console.log('Match:', finalHash.toLowerCase() === '0xf835d18ea61037135b0cff331a73afa5f83d54233b89927ff1196dccd7ef4f78');

    return {
        orderTypeString,
        orderTypeHash,
        domainSeparator,
        structHash,
        finalHash,
        types,
        domain,
        message
    };
}

if (require.main === module) {
    showOurEIP712Breakdown().catch(console.error);
}

module.exports = { showOurEIP712Breakdown };