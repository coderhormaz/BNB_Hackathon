// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title OptimizedPaymentContract
 * @dev Gas-optimized payment handling for the opBNB AI Assistant platform
 */
contract OptimizedPaymentContract is Ownable, ReentrancyGuard {
    
    // Pack fee and minimum amount in single slot
    struct FeeConfig {
        uint128 platformFee;    // 16 bytes - fee in basis points
        uint128 minimumAmount;  // 16 bytes - minimum transaction amount
        // Total: 32 bytes = 1 storage slot
    }
    
    FeeConfig public feeConfig;
    address public treasury;
    
    // Pack payment counters in single slot
    struct PaymentStats {
        uint128 totalPayments;
        uint128 totalFeesCollected;
        // Total: 32 bytes = 1 storage slot
    }
    
    PaymentStats public paymentStats;
    
    // Optimized payment struct (2 slots)
    struct Payment {
        address from;           // 20 bytes
        uint96 amount;         // 12 bytes
        // Slot 1: 32 bytes
        
        address to;            // 20 bytes  
        uint96 fee;           // 12 bytes
        // Slot 2: 32 bytes
        
        uint32 timestamp;     // 4 bytes - good until 2106
        bytes32 purposeHash;  // 32 bytes - hash instead of string
        // Slot 3: 36 bytes (fits in slot with some waste)
    }
    
    mapping(bytes32 => Payment) public payments;
    mapping(address => uint256) public userPaymentTotals;
    
    event PaymentProcessed(
        bytes32 indexed paymentId,
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 fee,
        bytes32 purposeHash
    );
    
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    
    constructor(address _treasury) Ownable(msg.sender) {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
        
        // Initialize with default values
        feeConfig = FeeConfig({
            platformFee: 250,           // 2.5%
            minimumAmount: 0.001 ether  // 0.001 BNB
        });
    }
    
    /**
     * @dev Process a payment with platform fee (gas optimized)
     */
    function processPayment(
        address to,
        string calldata purpose // calldata instead of memory
    ) external payable nonReentrant returns (bytes32) {
        
        FeeConfig memory config = feeConfig; // Load once to memory
        
        require(msg.value >= config.minimumAmount, "Amount too low");
        require(to != address(0), "Invalid recipient");
        
        uint256 fee = (msg.value * config.platformFee) / 10000;
        uint256 netAmount = msg.value - fee;
        
        // Hash purpose for gas savings
        bytes32 purposeHash = keccak256(bytes(purpose));
        
        // Generate payment ID efficiently
        bytes32 paymentId;
        unchecked {
            paymentId = keccak256(
                abi.encode(
                    msg.sender,
                    to,
                    msg.value,
                    purposeHash,
                    block.timestamp
                )
            );
        }
        
        // Store payment record efficiently
        payments[paymentId] = Payment({
            from: msg.sender,
            amount: uint96(netAmount),
            to: to,
            fee: uint96(fee),
            timestamp: uint32(block.timestamp),
            purposeHash: purposeHash
        });
        
        // Update stats efficiently
        unchecked {
            userPaymentTotals[msg.sender] += msg.value;
            paymentStats.totalPayments += uint128(msg.value);
            paymentStats.totalFeesCollected += uint128(fee);
        }
        
        // Transfer funds
        if (netAmount > 0) {
            payable(to).transfer(netAmount);
        }
        if (fee > 0) {
            payable(treasury).transfer(fee);
        }
        
        emit PaymentProcessed(paymentId, msg.sender, to, netAmount, fee, purposeHash);
        
        return paymentId;
    }
    
    /**
     * @dev Direct BNB transfer without fee (gas optimized)
     */
    function directTransfer(address to) external payable nonReentrant {
        require(msg.value > 0, "Amount must be > 0");
        require(to != address(0), "Invalid recipient");
        
        payable(to).transfer(msg.value);
        
        // Generate payment ID for tracking
        bytes32 paymentId = keccak256(abi.encode(msg.sender, to, msg.value, block.timestamp));
        bytes32 purposeHash = keccak256("direct_transfer");
        
        payments[paymentId] = Payment({
            from: msg.sender,
            amount: uint96(msg.value),
            to: to,
            fee: 0,
            timestamp: uint32(block.timestamp),
            purposeHash: purposeHash
        });
        
        unchecked {
            userPaymentTotals[msg.sender] += msg.value;
            paymentStats.totalPayments += uint128(msg.value);
        }
        
        emit PaymentProcessed(paymentId, msg.sender, to, msg.value, 0, purposeHash);
    }
    
    /**
     * @dev Batch process multiple payments (gas optimized, stack-safe)
     */
    function batchProcessPayments(
        address[] calldata recipients,
        uint256[] calldata amounts,
        string calldata commonPurpose
    ) external payable nonReentrant returns (bytes32[] memory paymentIds) {
        
        uint256 length = recipients.length;
        require(length == amounts.length && length > 0 && length <= 20, "Invalid arrays");
        
        FeeConfig memory config = feeConfig;
        uint256 totalRequired = 0;
        
        // Calculate total required amount
        unchecked {
            for (uint256 i = 0; i < length; ++i) {
                require(amounts[i] >= config.minimumAmount, "Amount too low");
                totalRequired += amounts[i];
            }
        }
        
        require(msg.value >= totalRequired, "Insufficient payment");
        
        paymentIds = new bytes32[](length);
        bytes32 purposeHash = keccak256(bytes(commonPurpose));
        
        // Process payments in batches to avoid stack depth issues
        unchecked {
            for (uint256 i = 0; i < length; ++i) {
                paymentIds[i] = _processSinglePayment(
                    recipients[i], 
                    amounts[i], 
                    config.platformFee, 
                    purposeHash, 
                    i
                );
            }
            
            // Update stats once
            userPaymentTotals[msg.sender] += totalRequired;
            paymentStats.totalPayments += uint128(totalRequired);
        }
    }
    
    /**
     * @dev Internal function to process single payment (avoids stack depth)
     */
    function _processSinglePayment(
        address recipient,
        uint256 amount,
        uint128 platformFee,
        bytes32 purposeHash,
        uint256 index
    ) internal returns (bytes32) {
        
        uint256 fee = (amount * platformFee) / 10000;
        uint256 netAmount = amount - fee;
        
        bytes32 paymentId = keccak256(abi.encodePacked(
            msg.sender, 
            recipient, 
            amount, 
            purposeHash, 
            index,
            block.timestamp
        ));
        
        payments[paymentId] = Payment({
            from: msg.sender,
            amount: uint96(netAmount),
            to: recipient,
            fee: uint96(fee),
            timestamp: uint32(block.timestamp),
            purposeHash: purposeHash
        });
        
        // Transfer funds
        payable(recipient).transfer(netAmount);
        if (fee > 0) {
            payable(treasury).transfer(fee);
        }
        
        emit PaymentProcessed(paymentId, msg.sender, recipient, netAmount, fee, purposeHash);
        
        return paymentId;
    }
    
    /**
     * @dev Update platform fee (only owner)
     */
    function updatePlatformFee(uint128 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee > 10%");
        
        uint128 oldFee = feeConfig.platformFee;
        feeConfig.platformFee = newFee;
        
        emit FeeUpdated(oldFee, newFee);
    }
    
    /**
     * @dev Update treasury address (only owner)
     */
    function updateTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury");
        
        address oldTreasury = treasury;
        treasury = newTreasury;
        
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }
    
    /**
     * @dev Get payment stats
     */
    function getPaymentStats() external view returns (uint256 totalPayments, uint256 totalFees) {
        PaymentStats memory stats = paymentStats;
        return (stats.totalPayments, stats.totalFeesCollected);
    }
    
    /**
     * @dev Calculate fee for amount
     */
    function calculateFee(uint256 amount) external view returns (uint256) {
        return (amount * feeConfig.platformFee) / 10000;
    }
    
    // Optimized receive function
    receive() external payable {
        // Direct deposits - minimal gas
    }
}
