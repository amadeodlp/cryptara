// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Wallet
 * @dev A simple wallet contract for the Finance Simplified application
 */
contract Wallet is Ownable {
    using SafeERC20 for IERC20;

    // Mapping to track token balances for each user
    mapping(address => mapping(address => uint256)) private _balances;

    // Events
    event Deposited(address indexed token, address indexed user, uint256 amount);
    event Withdrawn(address indexed token, address indexed user, uint256 amount);
    event TransferredBetweenUsers(address indexed token, address indexed from, address indexed to, uint256 amount);

    /**
     * @dev Constructor
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Deposit tokens into the wallet
     * @param token The token contract address
     * @param amount The amount of tokens to deposit
     */
    function deposit(address token, uint256 amount) external {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than zero");

        // Transfer tokens from sender to this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Update balance
        _balances[token][msg.sender] += amount;

        emit Deposited(token, msg.sender, amount);
    }

    /**
     * @dev Withdraw tokens from the wallet
     * @param token The token contract address
     * @param amount The amount of tokens to withdraw
     */
    function withdraw(address token, uint256 amount) external {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than zero");
        require(_balances[token][msg.sender] >= amount, "Insufficient balance");

        // Update balance before transfer to prevent reentrancy
        _balances[token][msg.sender] -= amount;

        // Transfer tokens from this contract to sender
        IERC20(token).safeTransfer(msg.sender, amount);

        emit Withdrawn(token, msg.sender, amount);
    }

    /**
     * @dev Transfer tokens between users within the wallet
     * @param token The token contract address
     * @param to The recipient address
     * @param amount The amount of tokens to transfer
     */
    function transfer(address token, address to, uint256 amount) external {
        require(token != address(0), "Invalid token address");
        require(to != address(0), "Invalid recipient address");
        require(to != msg.sender, "Cannot transfer to self");
        require(amount > 0, "Amount must be greater than zero");
        require(_balances[token][msg.sender] >= amount, "Insufficient balance");

        // Update balances
        _balances[token][msg.sender] -= amount;
        _balances[token][to] += amount;

        emit TransferredBetweenUsers(token, msg.sender, to, amount);
    }

    /**
     * @dev Get the balance of a specific token for a user
     * @param token The token contract address
     * @param user The user address
     * @return The token balance
     */
    function balanceOf(address token, address user) external view returns (uint256) {
        return _balances[token][user];
    }
}
