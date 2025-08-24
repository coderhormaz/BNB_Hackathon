import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface NFT {
  id: string;
  name: string;
  description: string;
  image: string;
  contractAddress: string;
  tokenId: string;
  metadata: any;
  createdAt: Date;
}

const NFTs: React.FC = () => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [showMintModal, setShowMintModal] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null as File | null
  });
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    // Mock NFTs for demonstration
    const mockNFTs: NFT[] = [
      {
        id: '1',
        name: 'My First NFT',
        description: 'This is my very first NFT created on opBNB',
        image: 'https://via.placeholder.com/300x300?text=NFT+1',
        contractAddress: '0x1234567890123456789012345678901234567890',
        tokenId: '1',
        metadata: {
          attributes: [
            { trait_type: 'Rarity', value: 'Rare' },
            { trait_type: 'Color', value: 'Blue' }
          ]
        },
        createdAt: new Date(Date.now() - 86400000)
      },
      {
        id: '2',
        name: 'Digital Art Piece',
        description: 'A beautiful digital artwork stored on BNB Greenfield',
        image: 'https://via.placeholder.com/300x300?text=NFT+2',
        contractAddress: '0x0987654321098765432109876543210987654321',
        tokenId: '2',
        metadata: {
          attributes: [
            { trait_type: 'Style', value: 'Abstract' },
            { trait_type: 'Artist', value: 'AI Generated' }
          ]
        },
        createdAt: new Date(Date.now() - 172800000)
      }
    ];
    setNfts(mockNFTs);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMintNFT = async () => {
    if (!formData.name || !formData.description || !formData.image) return;

    setIsMinting(true);
    
    // Simulate NFT minting with Greenfield storage
    setTimeout(() => {
      const newNFT: NFT = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        image: imagePreview || 'https://via.placeholder.com/300x300?text=New+NFT',
        contractAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
        tokenId: (nfts.length + 1).toString(),
        metadata: {
          attributes: [
            { trait_type: 'Creator', value: 'opBNB User' },
            { trait_type: 'Storage', value: 'BNB Greenfield' }
          ]
        },
        createdAt: new Date()
      };
      
      setNfts(prev => [newNFT, ...prev]);
      setShowMintModal(false);
      setFormData({ name: '', description: '', image: null });
      setImagePreview('');
      setIsMinting(false);
    }, 3000);
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="nfts-container">
      <div className="nfts-header">
        <h1>My NFTs</h1>
        <motion.button
          className="mint-nft-btn"
          onClick={() => setShowMintModal(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          + Mint NFT
        </motion.button>
      </div>

      <div className="nfts-grid">
        {nfts.length === 0 ? (
          <div className="no-nfts">
            <div className="no-nfts-icon">🖼️</div>
            <h3>No NFTs minted yet</h3>
            <p>Create your first NFT with metadata stored on BNB Greenfield</p>
            <motion.button
              className="mint-first-nft-btn"
              onClick={() => setShowMintModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Mint Your First NFT
            </motion.button>
          </div>
        ) : (
          nfts.map((nft, index) => (
            <motion.div
              key={nft.id}
              className="nft-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="nft-image">
                <img src={nft.image} alt={nft.name} />
              </div>
              
              <div className="nft-content">
                <h3 className="nft-name">{nft.name}</h3>
                <p className="nft-description">{nft.description}</p>
                
                <div className="nft-details">
                  <div className="nft-detail">
                    <span className="label">Token ID:</span>
                    <span className="value">#{nft.tokenId}</span>
                  </div>
                  <div className="nft-detail">
                    <span className="label">Contract:</span>
                    <span className="value">{shortenAddress(nft.contractAddress)}</span>
                  </div>
                  <div className="nft-detail">
                    <span className="label">Created:</span>
                    <span className="value">{nft.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>

                {nft.metadata?.attributes && (
                  <div className="nft-attributes">
                    <h4>Attributes</h4>
                    <div className="attributes-grid">
                      {nft.metadata.attributes.map((attr: any, i: number) => (
                        <div key={i} className="attribute">
                          <span className="trait-type">{attr.trait_type}</span>
                          <span className="trait-value">{attr.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="nft-actions">
                  <motion.button
                    className="action-btn primary"
                    onClick={() => window.open(`https://opbnb.bscscan.com/token/${nft.contractAddress}?a=${nft.tokenId}`, '_blank')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View on Explorer
                  </motion.button>
                  <motion.button
                    className="action-btn secondary"
                    onClick={() => {/* Open metadata view */}}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View Metadata
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Mint NFT Modal */}
      {showMintModal && (
        <div className="modal-overlay" onClick={() => setShowMintModal(false)}>
          <motion.div
            className="modal mint-nft-modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h3>Mint NFT</h3>
            <div className="modal-form">
              <div className="form-group">
                <label>NFT Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., My Digital Art"
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your NFT..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Upload Image</label>
                <div className="file-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    id="nft-image-upload"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="nft-image-upload" className="file-upload-label">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="image-preview" />
                    ) : (
                      <div className="upload-placeholder">
                        <span>📁</span>
                        <p>Click to upload image</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
              
              <div className="minting-info">
                <p>🌱 Metadata will be stored on BNB Greenfield</p>
                <p>💰 Estimated gas fee: ~0.002 BNB</p>
                <p>⏱️ Processing time: 1-3 minutes</p>
              </div>

              <div className="modal-actions">
                <button
                  className="modal-btn secondary"
                  onClick={() => setShowMintModal(false)}
                  disabled={isMinting}
                >
                  Cancel
                </button>
                <button
                  className="modal-btn primary"
                  onClick={handleMintNFT}
                  disabled={!formData.name || !formData.description || !formData.image || isMinting}
                >
                  {isMinting ? 'Minting NFT...' : 'Mint NFT'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default NFTs;
