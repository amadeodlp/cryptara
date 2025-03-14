// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CosmosToken
 * @dev The native ERC20 token for the COSMOS decentralized finance platform
 */
contract CosmosToken is ERC20, Ownable {
    // Events
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    event TokensLocked(address indexed holder, uint256 amount, uint256 unlockTime);
    event TokensUnlocked(address indexed holder, uint256 amount);

    // Struct to track locked tokens
    struct Lock {
        uint256 amount;
        uint256 unlockTime;
    }

    // Mapping of address to locked token information
    mapping(address => Lock[]) private _locks;

    /**
     * @dev Constructor that gives the msg.sender an initial supply of tokens
     */
    constructor(uint256 initialSupply) ERC20("COSMOS", "COSM") {
        _mint(msg.sender, initialSupply);
        _transferOwnership(msg.sender);
    }

    /**
     * @dev Function to mint tokens
     * @param to The address that will receive the minted tokens
     * @param amount The amount of tokens to mint
     * @return A boolean that indicates if the operation was successful
     */
    function mint(address to, uint256 amount) public onlyOwner returns (bool) {
        _mint(to, amount);
        emit TokensMinted(to, amount);
        return true;
    }

    /**
     * @dev Function to burn tokens
     * @param from The address that will have tokens burned
     * @param amount The amount of tokens to burn
     * @return A boolean that indicates if the operation was successful
     */
    function burn(address from, uint256 amount) public returns (bool) {
        require(from == msg.sender || msg.sender == owner(), "COSMOS: burn from not authorized");
        _burn(from, amount);
        emit TokensBurned(from, amount);
        return true;
    }

    /**
     * @dev Function to lock tokens for a specified time
     * @param amount Amount of tokens to lock
     * @param unlockTime Timestamp when tokens will be unlocked
     */
    function lockTokens(uint256 amount, uint256 unlockTime) public {
        require(unlockTime > block.timestamp, "COSMOS: unlock time must be in the future");
        require(amount > 0, "COSMOS: lock amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "COSMOS: insufficient balance to lock");
        
        // Transfer tokens to contract
        _transfer(msg.sender, address(this), amount);
        
        // Add lock record
        _locks[msg.sender].push(Lock(amount, unlockTime));
        
        emit TokensLocked(msg.sender, amount, unlockTime);
    }
    
    /**
     * @dev Function to unlock tokens that have passed their lock time
     * @param lockIndex Index of the lock to release
     */
    function unlockTokens(uint256 lockIndex) public {
        require(lockIndex < _locks[msg.sender].length, "COSMOS: invalid lock index");
        
        Lock memory lock = _locks[msg.sender][lockIndex];
        require(block.timestamp >= lock.unlockTime, "COSMOS: tokens are still locked");
        
        // Remove lock by replacing with the last element and popping
        uint256 amount = lock.amount;
        _locks[msg.sender][lockIndex] = _locks[msg.sender][_locks[msg.sender].length - 1];
        _locks[msg.sender].pop();
        
        // Return tokens to owner
        _transfer(address(this), msg.sender, amount);
        
        emit TokensUnlocked(msg.sender, amount);
    }
    
    /**
     * @dev Function to get all locks for an address
     * @param owner Address to check locks for
     * @return Array of Lock structures
     */
    function getLocksForAddress(address owner) public view returns (Lock[] memory) {
        return _locks[owner];
    }
}
