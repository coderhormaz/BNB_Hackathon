// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title NFTFactory
 * @dev Factory contract for minting NFTs on opBNB with Greenfield integration
 */
contract NFTFactory is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    // NFT metadata structure
    struct NFTInfo {
        uint256 tokenId;
        address creator;
        string name;
        string description;
        string tokenURI;
        uint256 timestamp;
    }
    
    // Mapping from token ID to NFT info
    mapping(uint256 => NFTInfo) public nftInfo;
    
    // Mapping from creator to their NFTs
    mapping(address => uint256[]) public creatorNFTs;
    
    // Array of all minted NFTs
    uint256[] public allNFTs;
    
    event NFTMinted(
        uint256 indexed tokenId,
        address indexed to,
        address indexed creator,
        string tokenURI,
        string name,
        string description
    );
    
    constructor() ERC721("opBNB AI NFTs", "OPBNB-NFT") Ownable(msg.sender) {
        // Start token IDs from 1
        _tokenIdCounter.increment();
    }
    
    /**
     * @dev Mint a new NFT with metadata
     * @param to Address that will receive the NFT
     * @param tokenURI IPFS or Greenfield URL containing metadata
     * @param name NFT name
     * @param description NFT description
     */
    function mintNFT(
        address to,
        string memory tokenURI,
        string memory name,
        string memory description
    ) external returns (uint256) {
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        // Mint the NFT
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        // Store NFT information
        nftInfo[tokenId] = NFTInfo({
            tokenId: tokenId,
            creator: msg.sender,
            name: name,
            description: description,
            tokenURI: tokenURI,
            timestamp: block.timestamp
        });
        
        // Track creator's NFTs
        creatorNFTs[msg.sender].push(tokenId);
        allNFTs.push(tokenId);
        
        emit NFTMinted(tokenId, to, msg.sender, tokenURI, name, description);
        
        return tokenId;
    }
    
    /**
     * @dev Batch mint multiple NFTs
     */
    function batchMintNFT(
        address[] memory recipients,
        string[] memory tokenURIs,
        string[] memory names,
        string[] memory descriptions
    ) external returns (uint256[] memory) {
        
        require(
            recipients.length == tokenURIs.length &&
            tokenURIs.length == names.length &&
            names.length == descriptions.length,
            "Array lengths must match"
        );
        
        uint256[] memory tokenIds = new uint256[](recipients.length);
        
        for (uint256 i = 0; i < recipients.length; i++) {
            tokenIds[i] = mintNFT(recipients[i], tokenURIs[i], names[i], descriptions[i]);
        }
        
        return tokenIds;
    }
    
    /**
     * @dev Get NFT information by token ID
     */
    function getNFTInfo(uint256 tokenId) external view returns (NFTInfo memory) {
        require(_ownerOf(tokenId) != address(0), "NFT does not exist");
        return nftInfo[tokenId];
    }
    
    /**
     * @dev Get all NFTs created by an address
     */
    function getCreatorNFTs(address creator) external view returns (uint256[] memory) {
        return creatorNFTs[creator];
    }
    
    /**
     * @dev Get total number of NFTs minted
     */
    function getTotalNFTs() external view returns (uint256) {
        return _tokenIdCounter.current() - 1;
    }
    
    /**
     * @dev Get all NFTs (paginated)
     */
    function getAllNFTs(uint256 offset, uint256 limit) external view returns (uint256[] memory) {
        require(offset < allNFTs.length, "Offset out of bounds");
        
        uint256 end = offset + limit;
        if (end > allNFTs.length) {
            end = allNFTs.length;
        }
        
        uint256[] memory result = new uint256[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = allNFTs[i];
        }
        
        return result;
    }
    
    /**
     * @dev Check if NFT exists
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
