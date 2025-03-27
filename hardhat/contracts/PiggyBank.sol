// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PiggyBank {
    event Deposit(address indexed from, uint256 amount);

    function deposit() public payable {
        require(msg.value > 0, "Must send ETH");
        emit Deposit(msg.sender, msg.value);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
