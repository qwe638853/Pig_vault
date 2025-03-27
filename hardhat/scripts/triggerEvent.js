const hre = require("hardhat");

async function main() {
  const signer = (await hre.ethers.getSigners())[0];
  console.log("👤 使用者地址:", signer.address);

  const contractAddress = "0x2D4dD52CA23addBFF58635953229C1F82fD75B35";

  const PiggyBankArtifact = await hre.artifacts.readArtifact("PiggyBank");

  const PiggyBank = new hre.ethers.Contract(
    contractAddress,
    PiggyBankArtifact.abi,
    signer
  );

  const tx = await PiggyBank.deposit({
    value: hre.ethers.parseEther("0.01") // 修正：使用 hre.ethers.parseEther
  });

  await tx.wait();
  console.log("✅ 成功呼叫 deposit，Webhook 應該會收到事件！");
}

main().catch((error) => {
  console.error("❌ 發生錯誤：", error.message);
  process.exitCode = 1;
});