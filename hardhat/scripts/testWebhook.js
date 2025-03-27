const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("使用帳號:", deployer.address);

  // 請改成你部署到 Arbitrum Sepolia 的合約地址
  const contractAddress = "0x2D4dD52CA23addBFF58635953229C1F82fD75B35";

  // 讀取 ABI
  const PiggyBank = await hre.ethers.getContractAt("PiggyBank", contractAddress);

  // 呼叫 deposit 並傳入一些 ETH（例如 0.001 ETH）
  const tx = await PiggyBank.deposit({ value: hre.ethers.parseEther("0.001") });
  console.log("交易發送中...");

  const receipt = await tx.wait();
  console.log("交易成功，交易 hash:", receipt.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
