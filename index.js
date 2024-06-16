const { ethers } = require("ethers");
const RPC_URL="https://public-en-baobab.klaytn.net"
const data = require('./data.json')
const erc20abi = require('./erc20abi.json')
var assert = require('assert');
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
var contractAddr = ""
var sidlen = data.student_id.length
var sid_lasttwo = data.student_id.slice(sidlen-2, sidlen)
var expected_symbol = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(data.initial_name + sid_lasttwo)).slice(2,6)
var expected_name = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(data.full_name + data.student_id)).slice(2,10)
var expected_decimals = parseInt('0x'+ethers.utils.keccak256(ethers.utils.toUtf8Bytes(data.full_name + data.student_id)).slice(65,66), 16)

describe('Problem 1', function(done) {

    // check problem 1
    var tx;
    var c;

    before(async function() {
        tx = await provider.getTransactionReceipt(data.problem1.deploy_tx_hash)
        c = new ethers.Contract(tx.contractAddress, erc20abi, provider)
        contractAddr = tx.contractAddress
    })
    it('1-1. check decimal', async function() {
        const decimals = await c.decimals()
        assert.equal(decimals, expected_decimals)
    })
    it('1-2. check symbol', async function() {
        const symbol = await c.symbol();
        assert.equal(symbol, expected_symbol)
    })
    it('1-3. check name', async function() {
        const name = await c.name();
        assert.equal(name, expected_name)
    })
    it('1-4. check initial supply', async function() {
        var passed = false
        for(var i = 0; i < tx.logs.length; i++) {
            if(tx.logs[i].topics[0] == ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Transfer(address,address,uint256)"))) {
                let iface = new ethers.utils.Interface(erc20abi)
                let log = iface.parseLog(tx.logs[i])
                assert.equal(log.args.from, "0x0000000000000000000000000000000000000000")
                assert.equal(log.args.to.toLowerCase(), data.deployer_addr.toLowerCase())
                assert.equal(log.args.value.toString(), ethers.BigNumber.from("10000000000").mul(ethers.BigNumber.from(10).pow(ethers.BigNumber.from(expected_decimals))).toString())
                passed = true
            }
        }
        assert.equal(passed, true)
    })
})

describe('Problem 2', function(done) {
    var tx
    var c; 

    before(async function() {
        c = new ethers.Contract(contractAddr, erc20abi, provider)
    })

    it('2-1. check minter role updated', async function() {
        tx = await provider.getTransactionReceipt(data.problem2.txhash2_1)
        assert.equal(tx.status, 1)
        let iface = new ethers.utils.Interface(erc20abi)
        var passed = false
        for(var i = 0; i < tx.logs.length; i++) {
            l = iface.parseLog(tx.logs[i])
            if(l.name == 'RoleGranted') {
                assert.equal(l.args.role, await c.MINTER_ROLE())
                assert.equal(l.args.account.toLowerCase(), data.problem2.minter.toLowerCase())
                assert.equal(l.args.sender.toLowerCase(), data.deployer_addr.toLowerCase())
                passed = true
            }
        }
        assert(passed)
    })
    it('2-2. check minted', async function() {
        tx = await provider.getTransactionReceipt(data.problem2.txhash2_2)
        assert.equal(tx.status, 1)
        let iface = new ethers.utils.Interface(erc20abi)
        var passed = false
        for(var i = 0; i < tx.logs.length; i++) {
            l = iface.parseLog(tx.logs[i])
            if(l.name == 'Transfer') {
                assert.equal(l.args.from, "0x0000000000000000000000000000000000000000")
                assert.equal(l.args.to.toLowerCase(), data.problem2.minter.toLowerCase())
                assert.equal(l.args.value.toString(), ethers.BigNumber.from("10000000000").mul(ethers.BigNumber.from(10).pow(ethers.BigNumber.from(expected_decimals))).toString())
                passed = true
            }
            assert(passed)
        }
    })
})

describe('Problem3', function() {
    it('check transfer', async function() {
        var tx = await provider.getTransactionReceipt(data.problem3.txhash)
        assert.equal(tx.status, 1)
        let iface = new ethers.utils.Interface(erc20abi)
        var passed = false
        for(var i = 0; i < tx.logs.length; i++) {
            l = iface.parseLog(tx.logs[i])
            if(l.name == 'Transfer') {
                assert.equal(l.args.from.toLowerCase(), data.deployer_addr.toLowerCase())
                assert.equal(l.args.to.toLowerCase(), data.problem2.minter.toLowerCase())
                assert.equal(l.args.value.toString(), ethers.BigNumber.from(data.student_id).mul(ethers.BigNumber.from(10).pow(ethers.BigNumber.from(expected_decimals))).toString())
                passed = true
            }
        }
        assert(passed)
    })
})

describe('Problem4', function() {
    it('check burn', async function() {
        var tx = await provider.getTransactionReceipt(data.problem4.txhash)
        assert.equal(tx.status, 1)
        let iface = new ethers.utils.Interface(erc20abi)
        var passed = false
        for(var i = 0; i < tx.logs.length; i++) {
            l = iface.parseLog(tx.logs[i])
            if(l.name == 'Transfer') {
                assert.equal(l.args.from.toLowerCase(), data.problem2.minter.toLowerCase())
                assert.equal(l.args.to.toLowerCase(), '0x0000000000000000000000000000000000000000')
                assert.equal(l.args.value.toString(), ethers.BigNumber.from(data.student_id).mul(ethers.BigNumber.from(10).pow(ethers.BigNumber.from(expected_decimals))).toString())
                passed = true
            }
        }
        assert(passed)
    })
})

describe('Problem5', function() {
    it('5-1. check pause', async function() {
        var tx = await provider.getTransactionReceipt(data.problem5.txhash5_1)
        assert.equal(tx.status, 1)
        let iface = new ethers.utils.Interface(erc20abi)
        var passed = false
        for(var i = 0; i < tx.logs.length; i++) {
            l = iface.parseLog(tx.logs[i])
            if(l.name == 'Paused') {
                assert.equal(l.args.account.toLowerCase(), data.deployer_addr.toLowerCase())
                passed = true
            }
        }
        assert(passed)
    })

    it('5-2. check transfer failed', async function() {
        var receipt = await provider.getTransactionReceipt(data.problem5.txhash5_2)
        assert.equal(receipt.status, 0)

        var tx = await provider.getTransaction(data.problem5.txhash5_2)
        let iface = new ethers.utils.Interface(erc20abi)
        let txdata = iface.decodeFunctionData('transfer', tx.data)
        assert.equal(txdata.to.toLowerCase(), data.problem2.minter.toLowerCase())
        assert.equal(txdata.amount.toString(), ethers.BigNumber.from(10).mul(ethers.BigNumber.from(10).pow(ethers.BigNumber.from(expected_decimals))).toString())
    })

    it('5-3. check unpaused', async function() {
        var receipt = await provider.getTransactionReceipt(data.problem5.txhash5_3)
        assert.equal(receipt.status, 1)

        let iface = new ethers.utils.Interface(erc20abi)
        var passed = false
        for(var i = 0; i < receipt.logs.length; i++) {
            l = iface.parseLog(receipt.logs[i])
            if(l.name == 'Unpaused') {
                assert.equal(l.args.account.toLowerCase(), data.deployer_addr.toLowerCase())
                passed = true
            }
        }
        assert(passed)
    })
})

describe('Problem6', function() {
    it('6-1. check approve', async function() {
        var receipt = await provider.getTransactionReceipt(data.problem6.txhash6_1)
        assert.equal(receipt.status, 1)

        let iface = new ethers.utils.Interface(erc20abi)
        var passed = false
        for(var i = 0; i < receipt.logs.length; i++) {
            l = iface.parseLog(receipt.logs[i])
            if(l.name == 'Approval') {
                assert.equal(l.args.owner.toLowerCase(), data.problem2.minter.toLowerCase())
                assert.equal(l.args.spender.toLowerCase(), data.problem6.spender.toLowerCase())
                assert.equal(l.args.value.toString(), ethers.BigNumber.from(100).mul(ethers.BigNumber.from(10).pow(ethers.BigNumber.from(expected_decimals))).toString())
                passed = true
            }
        }
        assert(passed)
    })

    it('6-2. check unallowed transfer', async function() {
        var receipt = await provider.getTransactionReceipt(data.problem6.txhash6_2)
        assert.equal(receipt.status, 0)

        var tx = await provider.getTransaction(data.problem6.txhash6_2)
        let iface = new ethers.utils.Interface(erc20abi)
        let txdata = iface.decodeFunctionData('transferFrom', tx.data)
        assert.equal(txdata.from.toLowerCase(), data.problem2.minter.toLowerCase())
        assert.equal(txdata.to.toLowerCase(), data.problem6.spender.toLowerCase())
        assert.equal(txdata.amount.toString(), ethers.BigNumber.from(200).mul(ethers.BigNumber.from(10).pow(ethers.BigNumber.from(expected_decimals))).toString())
    })

    it('6-3. check transfer', async function() {
        var receipt = await provider.getTransactionReceipt(data.problem6.txhash6_3)
        assert.equal(receipt.status, 1)

        let iface = new ethers.utils.Interface(erc20abi)
        var passed = false
        for(var i = 0; i < receipt.logs.length; i++) {
            l = iface.parseLog(receipt.logs[i])
            if(l.name == 'Transfer') {
                assert.equal(l.args.from.toLowerCase(), data.problem2.minter.toLowerCase())
                assert.equal(l.args.to.toLowerCase(), data.problem6.spender.toLowerCase())
                assert.equal(l.args.value.toString(), ethers.BigNumber.from(20).mul(ethers.BigNumber.from(10).pow(ethers.BigNumber.from(expected_decimals))).toString())
                passed = true
            }
        }
        assert(passed)
    })
})