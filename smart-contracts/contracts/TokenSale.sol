// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenSale is Ownable {
    IERC20 public fitToken;
    uint256 public tokenPrice; // Price in ETH per FIT token (in wei)
    
    event TokensPurchased(address buyer, uint256 ethAmount, uint256 tokenAmount);
    
    constructor(address _tokenAddress, uint256 _initialPrice) Ownable(msg.sender) {
        fitToken = IERC20(_tokenAddress);
        tokenPrice = _initialPrice;
    }
    
    function buyTokens() public payable {
        require(msg.value > 0, "ETH amount must be greater than 0");
        
        uint256 tokenAmount = (msg.value * 1e18) / tokenPrice; // Calculate tokens to purchase
        require(fitToken.balanceOf(address(this)) >= tokenAmount, "Not enough tokens available for sale");
        
        bool success = fitToken.transfer(msg.sender, tokenAmount);
        require(success, "Token transfer failed");
        
        emit TokensPurchased(msg.sender, msg.value, tokenAmount);
    }
    
    function setTokenPrice(uint256 _newPrice) public onlyOwner {
        require(_newPrice > 0, "Price must be greater than 0");
        tokenPrice = _newPrice;
    }
    
    function withdrawETH() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    function withdrawUnsoldTokens() public onlyOwner {
        uint256 balance = fitToken.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        bool success = fitToken.transfer(owner(), balance);
        require(success, "Token transfer failed");
    }
}