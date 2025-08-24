// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PaymentContract
 * @dev Handle payments and fees for the opBNB AI Assistant platform
 */
contract PaymentContract is Ownable, ReentrancyGuard {
    
    // Platform fee percentage (in basis points: 250 = 2.5%)
    uint256 public platformFee = 250;
    
    // Minimum transaction amount
    uint256 public minimumAmount = 0.001 ether;
    
    // Platform treasury address
    address public treasury;
    
    // Payment tracking
    struct Payment {
        address from;
        address to;
        uint256 amount;
        uint256 fee;
        string purpose; // "token_creation", "nft_mint", "transfer", etc.
        uint256 timestamp;
    }
    
    mapping(bytes32 => Payment) public payments;
    mapping(address => uint256) public userPayments;
    
    uint256 public totalPayments;
    uint256 public totalFeesCollected;
    
    event PaymentProcessed(
        bytes32 indexed paymentId,
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 fee,
        string purpose
    );
    
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    
    constructor(address _treasury) Ownable(msg.sender) {
        require(_treasury != address(0), "Invalid treasury address");
        treasury = _treasury;
    }
    
    /**
     * @dev Process a payment with platform fee
     */
    function processPayment(
        address to,
        string memory purpose
    ) external payable nonReentrant returns (bytes32) {
        
        require(msg.value >= minimumAmount, "Amount below minimum");
        require(to != address(0), "Invalid recipient");
        
        uint256 fee = (msg.value * platformFee) / 10000;
        uint256 netAmount = msg.value - fee;
        
        bytes32 paymentId = keccak256(
            abi.encodePacked(
                msg.sender,
                to,
                msg.value,
                purpose,
                block.timestamp,
                totalPayments
            )
        );
        
        // Store payment record
        payments[paymentId] = Payment({
            from: msg.sender,
            to: to,
            amount: netAmount,
            fee: fee,
            purpose: purpose,
            timestamp: block.timestamp
        });
        
        // Update counters
        userPayments[msg.sender] += msg.value;
        totalPayments += msg.value;
        totalFeesCollected += fee;
        
        // Transfer net amount to recipient
        if (netAmount > 0) {
            payable(to).transfer(netAmount);
        }
        
        // Transfer fee to treasury
        if (fee > 0) {
            payable(treasury).transfer(fee);
        }
        
        emit PaymentProcessed(paymentId, msg.sender, to, netAmount, fee, purpose);
        
        return paymentId;
    }
    
    /**
     * @dev Direct BNB transfer without fee (for simple transfers)
     */
    function directTransfer(address to) external payable nonReentrant {
        require(msg.value > 0, "Amount must be greater than 0");
        require(to != address(0), "Invalid recipient");
        
        payable(to).transfer(msg.value);
        
        // Record as zero-fee payment
        bytes32 paymentId = keccak256(
            abi.encodePacked(
                msg.sender,
                to,
                msg.value,
                "direct_transfer",
                block.timestamp,
                totalPayments
            )
        );
        
        payments[paymentId] = Payment({
            from: msg.sender,
            to: to,
            amount: msg.value,
            fee: 0,
            purpose: "direct_transfer",
            timestamp: block.timestamp
        });
        
        userPayments[msg.sender] += msg.value;
        totalPayments += msg.value;
        
        emit PaymentProcessed(paymentId, msg.sender, to, msg.value, 0, "direct_transfer");
    }
    
    /**
     * @dev Update platform fee (only owner)
     */
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee cannot exceed 10%"); // Max 10%
        
        uint256 oldFee = platformFee;
        platformFee = newFee;
        
        emit FeeUpdated(oldFee, newFee);
    }
    
    /**
     * @dev Update treasury address (only owner)
     */
    function updateTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        
        address oldTreasury = treasury;
        treasury = newTreasury;
        
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }
    
    /**
     * @dev Update minimum amount (only owner)
     */
    function updateMinimumAmount(uint256 newMinimum) external onlyOwner {
        minimumAmount = newMinimum;
    }
    
    /**
     * @dev Get payment details
     */
    function getPayment(bytes32 paymentId) external view returns (Payment memory) {
        return payments[paymentId];
    }
    
    /**
     * @dev Emergency withdraw (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Calculate fee for amount
     */
    function calculateFee(uint256 amount) external view returns (uint256) {
        return (amount * platformFee) / 10000;
    }
    
    // Fallback function to accept BNB
    receive() external payable {
        // Direct deposits go to contract balance
    }
}
