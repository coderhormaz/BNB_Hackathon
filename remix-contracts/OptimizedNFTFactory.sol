// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OptimizedNFTFactory
 * @dev Gas-optimized factory contract for minting NFTs on opBNB with Greenfield integration
 */
contract OptimizedNFTFactory is ERC721, ERC721URIStorage, Ownable {
    
    // Use uint256 for token counter (cheaper than Counters library)
    uint256 private _currentTokenId;
    
    // Packed struct to save gas (fits in 2 storage slots)
    struct NFTInfo {
        address creator;        // 20 bytes
        uint96 timestamp;      // 12 bytes - fits until ~2.5 trillion years
        // Slot 1: 32 bytes total
        
        string name;           // Dynamic - Slot 2+
        string description;    // Dynamic - Additional slots
        string tokenURI;       // Dynamic - Additional slots
    }
    
    // More efficient mappings
    mapping(uint256 => NFTInfo) public nftInfo;
    mapping(address => uint256[]) public creatorNFTs;
    
    // Cache frequently accessed data
    uint256 public totalSupply;
    
    event NFTMinted(
        uint256 indexed tokenId,
        address indexed to,
        address indexed creator,
        string tokenURI
    ); // Removed redundant name/description from event
    
    constructor() ERC721("opBNB AI NFTs", "OPBNB-NFT") Ownable(msg.sender) {
        // Start from 1 for gas savings on first mint
        _currentTokenId = 1;
    }
    
    /**
     * @dev Mint a new NFT with metadata (gas optimized)
     * @param to Address that will receive the NFT
     * @param uri IPFS or Greenfield URL containing metadata
     * @param name NFT name
     * @param description NFT description
     */
    function mintNFT(
        address to,
        string calldata uri, // calldata instead of memory, renamed to avoid shadowing
        string calldata name,     // calldata instead of memory
        string calldata description // calldata instead of memory
    ) external returns (uint256) {
        
        uint256 tokenId = _currentTokenId;
        
        // Mint the NFT
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        // Store NFT information efficiently
        nftInfo[tokenId] = NFTInfo({
            creator: msg.sender,
            timestamp: uint96(block.timestamp),
            name: name,
            description: description,
            tokenURI: uri
        });
        
        // Update mappings
        creatorNFTs[msg.sender].push(tokenId);
        
        // Increment counters efficiently
        unchecked {
            _currentTokenId = tokenId + 1;
            ++totalSupply;
        }
        
        emit NFTMinted(tokenId, to, msg.sender, uri);
        
        return tokenId;
    }
    
    /**
     * @dev Batch mint multiple NFTs (highly gas optimized)
     */
    function batchMintNFT(
        address[] calldata recipients,
        string[] calldata tokenURIs,
        string[] calldata names,
        string[] calldata descriptions
    ) external returns (uint256[] memory tokenIds) {
        
        uint256 length = recipients.length;
        require(
            length == tokenURIs.length &&
            length == names.length &&
            length == descriptions.length &&
            length > 0 && length <= 50, // Limit batch size
            "Invalid arrays"
        );
        
        tokenIds = new uint256[](length);
        uint256 startTokenId = _currentTokenId;
        
        unchecked {
            for (uint256 i = 0; i < length; ++i) {
                uint256 tokenId = startTokenId + i;
                tokenIds[i] = tokenId;
                
                // Mint NFT
                _safeMint(recipients[i], tokenId);
                _setTokenURI(tokenId, tokenURIs[i]);
                
                // Store info
                nftInfo[tokenId] = NFTInfo({
                    creator: msg.sender,
                    timestamp: uint96(block.timestamp),
                    name: names[i],
                    description: descriptions[i],
                    tokenURI: tokenURIs[i]
                });
                
                // Track creator NFTs
                creatorNFTs[msg.sender].push(tokenId);
                
                emit NFTMinted(tokenId, recipients[i], msg.sender, tokenURIs[i]);
            }
            
            // Update counters once
            _currentTokenId += length;
            totalSupply += length;
        }
    }
    
    /**
     * @dev Get NFT information by token ID
     */
    function getNFTInfo(uint256 tokenId) external view returns (NFTInfo memory) {
        require(_ownerOf(tokenId) != address(0), "NFT !exist");
        return nftInfo[tokenId];
    }
    
    /**
     * @dev Get all NFTs created by an address
     */
    function getCreatorNFTs(address creator) external view returns (uint256[] memory) {
        return creatorNFTs[creator];
    }
    
    /**
     * @dev Get current total supply
     */
    function getTotalNFTs() external view returns (uint256) {
        return totalSupply;
    }
    
    /**
     * @dev Check if NFT exists (gas optimized)
     */
    function exists(uint256 tokenId) external view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    // Required overrides for ERC721URIStorage
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
