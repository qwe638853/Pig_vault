import { ethers } from "ethers";

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const ERC4626Address = "0xYourPiggyBankAddress";
const ERC4626Abi = [...]; // 你的合約 ABI
const ERC4626 = new ethers.Contract(piggyBankAddress, piggyBankAbi, signer);

async function depositUSDC(amount) {
    const usdcAddress = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
    const usdc = new ethers.Contract(usdcAddress, ["function approve(address spender, uint256 amount) public returns (bool)"], signer);
    
    // 批准 PiggyBank 使用 USDC
    const approveTx = await usdc.approve(piggyBankAddress, amount);
    await approveTx.wait();

    // 存入 USDC
    const depositTx = await piggyBank.deposit(amount);
    await depositTx.wait();
    console.log("Deposit successful!");
}