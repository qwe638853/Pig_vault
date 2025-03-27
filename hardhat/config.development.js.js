// deployment-config.development.js
module.exports = {
    deployerPrivateKey: [process.env.PRIVATE_KEY],
    deploymentEndpoint: "https://pn32hsq7vnadhbxxdpfflsk2di.multibaas.com",
    ethChainId: 421614, // Arbitrum Sepolia 的 Chain ID
    web3Key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzQzMDAxOTYwLCJqdGkiOiIwZGU0OWM1NC05ZGE4LTRiMWQtODJjMC0yYzQ0ZTVmM2E0OWYifQ.pPDF5M0PCmbll5EnibdokR5VXqJ6pUHbLNtwMCvbWPc", // web3 proxy 用的 API Key（只要 key 本體，不是整段 URL）
    adminApiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzQzMDAxODM3LCJqdGkiOiI1ODgxM2QwZC1iYWE3LTRlNGEtYTU4ZS00YjVhMjRiZjA5YjkifQ.LOuKhaAhBNt6nbidwbxO05yQmP8Jg6Wt4R1pu_nJe5A" // 具備管理權限的 API Key
  };


  //web3 用來查資料、做 JSON-RPC，用途廣泛但權限低，可前端用

  //adminApiKey 用來部署、編輯、綁 webhook 等管理級操作，只能後端或 local 用
  