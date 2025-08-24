// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TokenFactory
 * @dev Factory contract for creating BEP-20 tokens on opBNB
 */
contract TokenFactory is Ownable {
    
    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 totalSupply,
        uint8 decimals
    );
    
    // Mapping to track tokens created by each address
    mapping(address => address[]) public createdTokens;
    
    // Array to store all created tokens
    address[] public allTokens;
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Create a new BEP-20 token
     * @param name Token name
     * @param symbol Token symbol
     * @param totalSupply Total supply (will be multiplied by 10^decimals)
     * @param decimals Number of decimals (typically 18)
     */
    function createToken(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint8 decimals
    ) external returns (address) {
        
        // Deploy new token contract
        CustomToken newToken = new CustomToken(
            name,
            symbol,
            totalSupply,
            decimals,
            msg.sender
        );
        
        address tokenAddress = address(newToken);
        
        // Track the created token
        createdTokens[msg.sender].push(tokenAddress);
        allTokens.push(tokenAddress);
        
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
     * @dev Get tokens created by a specific address
     */
    function getCreatedTokens(address creator) external view returns (address[] memory) {
        return createdTokens[creator];
    }
    
    /**
     * @dev Get total number of tokens created
     */
    function getTotalTokensCount() external view returns (uint256) {
        return allTokens.length;
    }
    
    /**
     * @dev Get all created tokens (paginated)
     */
    function getAllTokens(uint256 offset, uint256 limit) external view returns (address[] memory) {
        require(offset < allTokens.length, "Offset out of bounds");
        
        uint256 end = offset + limit;
        if (end > allTokens.length) {
            end = allTokens.length;
        }
        
        address[] memory result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = allTokens[i];
        }
        
        return result;
    }
}

/**
 * @title CustomToken
 * @dev BEP-20 token implementation created by TokenFactory
 */
contract CustomToken is ERC20, Ownable {
    
    uint8 private _decimals;
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint8 tokenDecimals,
        address creator
    ) ERC20(name, symbol) Ownable(creator) {
        _decimals = tokenDecimals;
        
        // Mint total supply to creator
        uint256 supply = totalSupply * 10**tokenDecimals;
        _mint(creator, supply);
    }
    
    /**
     * @dev Returns the number of decimals used to get user representation
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    /**
     * @dev Mint additional tokens (only owner)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Burn tokens from owner's balance
     */
    function burn(uint256 amount) external onlyOwner {
        _burn(msg.sender, amount);
    }
}
