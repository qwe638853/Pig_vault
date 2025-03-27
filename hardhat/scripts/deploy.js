const hre = require("hardhat");

async function main() {
  console.log("📦 Deploying PiggyBank...");

  const PiggyBank = await hre.ethers.getContractFactory("PiggyBank");
  const piggyBank = await PiggyBank.deploy();

  await piggyBank.waitForDeployment();

  const address = await piggyBank.getAddress();
  console.log("✅ PiggyBank deployed to:", address);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
