// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OptimizedTokenFactory
 * @dev Gas-optimized factory contract for creating BEP-20 tokens on opBNB
 */
contract OptimizedTokenFactory is Ownable {
    
    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 totalSupply,
        uint8 decimals
    );
    
    // Packed struct to save storage slots
    struct TokenInfo {
        address tokenAddress;
        uint96 totalSupply; // Reduced from uint256 - supports up to ~79B tokens
        uint8 decimals;
        uint32 timestamp; // Reduced from uint256 - good until 2106
        // Total: 1 storage slot (32 bytes)
    }
    
    // More efficient storage
    mapping(address => TokenInfo[]) public createdTokensByUser;
    TokenInfo[] public allTokens;
    
    // Cache frequently accessed values
    uint256 public totalTokensCreated;
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Create a new BEP-20 token (gas optimized)
     * @param name Token name
     * @param symbol Token symbol  
     * @param totalSupply Total supply (will be multiplied by 10^decimals)
     * @param decimals Number of decimals (typically 18)
     */
    function createToken(
        string calldata name, // calldata instead of memory
        string calldata symbol, // calldata instead of memory
        uint96 totalSupply, // Reduced size
        uint8 decimals
    ) external returns (address) {
        
        // Deploy new token contract
        OptimizedCustomToken newToken = new OptimizedCustomToken(
            name,
            symbol,
            totalSupply,
            decimals,
            msg.sender
        );
        
        address tokenAddress = address(newToken);
        
        // Pack data efficiently
        TokenInfo memory tokenInfo = TokenInfo({
            tokenAddress: tokenAddress,
            totalSupply: totalSupply,
            decimals: decimals,
            timestamp: uint32(block.timestamp)
        });
        
        // Single storage write
        createdTokensByUser[msg.sender].push(tokenInfo);
        allTokens.push(tokenInfo);
        
        // Update counter efficiently
        unchecked {
            ++totalTokensCreated;
        }
        
        emit TokenCreated(
            tokenAddress,
            msg.sender,
            name,
            symbol,
            totalSupply,
            decimals
        );
        
        return tokenAddress;
    }
    
    /**
     * @dev Get tokens created by a specific address (gas optimized)
     */
    function getCreatedTokens(address creator) external view returns (address[] memory tokens) {
        TokenInfo[] memory userTokens = createdTokensByUser[creator];
        uint256 length = userTokens.length;
        
        tokens = new address[](length);
        
        // Use unchecked for gas savings
        unchecked {
            for (uint256 i = 0; i < length; ++i) {
                tokens[i] = userTokens[i].tokenAddress;
            }
        }
    }
    
    /**
     * @dev Get total number of tokens created
     */
    function getTotalTokensCount() external view returns (uint256) {
        return totalTokensCreated;
    }
    
    /**
     * @dev Get all created tokens (paginated, gas optimized)
     */
    function getAllTokens(uint256 offset, uint256 limit) external view returns (address[] memory tokens) {
        require(offset < allTokens.length, "Offset OOB");
        
        uint256 end = offset + limit;
        if (end > allTokens.length) {
            end = allTokens.length;
        }
        
        uint256 resultLength = end - offset;
        tokens = new address[](resultLength);
        
        unchecked {
            for (uint256 i = 0; i < resultLength; ++i) {
                tokens[i] = allTokens[offset + i].tokenAddress;
            }
        }
    }
}

/**
 * @title OptimizedCustomToken
 * @dev Gas-optimized BEP-20 token implementation
 */
contract OptimizedCustomToken is ERC20, Ownable {
    
    uint8 private immutable _decimals; // Immutable for gas savings
    
    constructor(
        string memory name,
        string memory symbol,
        uint96 totalSupply, // Reduced size
        uint8 tokenDecimals,
        address creator
    ) ERC20(name, symbol) Ownable(creator) {
        _decimals = tokenDecimals;
        
        // Mint total supply to creator
        _mint(creator, uint256(totalSupply) * 10**tokenDecimals);
    }
    
    /**
     * @dev Returns the number of decimals used to get user representation
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    /**
     * @dev Mint additional tokens (only owner, gas optimized)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Burn tokens from owner's balance (gas optimized)
     */
    function burn(uint256 amount) external onlyOwner {
        _burn(msg.sender, amount);
    }
}
