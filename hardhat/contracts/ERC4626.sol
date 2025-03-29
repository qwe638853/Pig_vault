// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// 引入 OpenZeppelin 的 ERC20 和 IERC20 介面
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// 定義 ERC4626 介面（Yearn 的金庫符合 ERC4626 標準）
interface IERC4626 {
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);
    function totalAssets() external view returns (uint256);
    function totalSupply() external view returns (uint256);
}

// 你的「豬公」合約，實現 ERC20 和 ERC4626，並與 Yearn 交互
contract PiggyBank is ERC20 {
    // USDC 地址（Polygon 主網）
    address public constant USDC = 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359;
    
    // Yearn 的 USDC 金庫地址（Polygon 主網）
    address public constant YEARN_USDC_VAULT = 0xE9ac18BD8cBC14632a253aA9Ce2783CD712aB3CA;

    // 儲存使用者的存款（用於計算利息）
    mapping(address => uint256) public userDeposits;

    // 構造函數，初始化 ERC20 代幣（「豬公 token」）
    constructor() ERC20("PiggyBank Token", "PIGGY") {}

    // 存入 USDC，存入 Yearn 金庫，發行 PIGGY token
    function deposit(uint256 amount) external returns (uint256 shares) {
        // 1. 從使用者轉入 USDC 到合約
        IERC20(USDC).transferFrom(msg.sender, address(this), amount);

        // 2. 批准 Yearn 金庫使用 USDC
        IERC20(USDC).approve(YEARN_USDC_VAULT, amount);

        // 3. 存入 Yearn 金庫，獲取 Yearn 份額
        uint256 yearnShares = IERC4626(YEARN_USDC_VAULT).deposit(amount, address(this));

        // 4. 按比例發行 PIGGY token 給使用者（這裡假設 1:1 比例）
        shares = yearnShares;
        _mint(msg.sender, shares);

        // 5. 記錄使用者的存款（用於計算利息）
        userDeposits[msg.sender] += amount;

        return shares;
    }

    // 提領 USDC 和利息
    function withdraw(uint256 shares) external returns (uint256 assets) {
        // 1. 從 Yearn 金庫提領 USDC
        assets = IERC4626(YEARN_USDC_VAULT).redeem(shares, address(this), address(this));

        // 2. 燒毀使用者的 PIGGY token
        _burn(msg.sender, shares);

        // 3. 更新使用者的存款記錄
        uint256 userDeposit = (shares * userDeposits[msg.sender]) / balanceOf(msg.sender);
        userDeposits[msg.sender] -= userDeposit;

        // 4. 將 USDC 轉給使用者
        IERC20(USDC).transfer(msg.sender, assets);

        return assets;
    }

    // 查看使用者的總資產（包括利息）
    function totalAssetsOf(address user) external view returns (uint256) {
        uint256 userShares = balanceOf(user);
        uint256 totalShares = totalSupply();
        if (totalShares == 0) return 0;

        uint256 totalAssets = IERC4626(YEARN_USDC_VAULT).totalAssets();
        return (userShares * totalAssets) / totalShares;
    }

    // 查看使用者的利息
    function getUserProfit(address user) external view returns (uint256) {
        uint256 userAssets = totalAssetsOf(user);
        uint256 userDeposit = userDeposits[user];
        return userAssets > userDeposit ? userAssets - userDeposit : 0;
    }

    // 符合 ERC4626 標準：查看合約持有的總資產
    function totalAssets() external view returns (uint256) {
        return IERC4626(YEARN_USDC_VAULT).totalAssets();
    }
}