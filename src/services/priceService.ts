// Free BNB price fetching service
export interface PriceData {
  price: number;
  change24h: number;
  lastUpdated: number;
  source: string;
}

export class PriceService {
  private static cachedPrice: PriceData | null = null;
  private static cacheExpiry = 5 * 60 * 1000; // 5 minutes cache

  // Multiple free price sources for redundancy
  private static priceSources = [
    {
      name: 'CoinGecko',
      url: 'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd&include_24hr_change=true',
      parser: (data: { binancecoin: { usd: number; usd_24h_change?: number } }) => ({
        price: data.binancecoin.usd,
        change24h: data.binancecoin.usd_24h_change || 0,
        source: 'CoinGecko',
        lastUpdated: Date.now()
      })
    },
    {
      name: 'CoinCap',
      url: 'https://api.coincap.io/v2/assets/binance-coin',
      parser: (data: { data: { priceUsd: string; changePercent24Hr?: string } }) => ({
        price: parseFloat(data.data.priceUsd),
        change24h: parseFloat(data.data.changePercent24Hr || '0'),
        source: 'CoinCap',
        lastUpdated: Date.now()
      })
    },
    {
      name: 'Binance',
      url: 'https://api.binance.com/api/v3/ticker/24hr?symbol=BNBUSDT',
      parser: (data: { lastPrice: string; priceChangePercent?: string }) => ({
        price: parseFloat(data.lastPrice),
        change24h: parseFloat(data.priceChangePercent || '0'),
        source: 'Binance',
        lastUpdated: Date.now()
      })
    }
  ];

  // Get current BNB price with caching
  static async getBNBPrice(): Promise<PriceData> {
    try {
      // Return cached price if still valid
      if (this.cachedPrice && Date.now() - this.cachedPrice.lastUpdated < this.cacheExpiry) {
        console.log('💰 Using cached BNB price:', this.cachedPrice.price);
        return this.cachedPrice;
      }

      console.log('🔄 Fetching fresh BNB price...');
      const priceData = await this.fetchPriceFromSources();
      
      // Cache the result
      this.cachedPrice = {
        ...priceData,
        lastUpdated: Date.now()
      };

      console.log(`✅ BNB Price updated: $${priceData.price} (${priceData.change24h > 0 ? '+' : ''}${priceData.change24h.toFixed(2)}%) - ${priceData.source}`);
      
      return this.cachedPrice;
    } catch (error) {
      console.error('❌ Failed to fetch BNB price:', error);
      
      // Return fallback price if all sources fail
      const fallbackPrice: PriceData = {
        price: 600, // Conservative fallback
        change24h: 0,
        lastUpdated: Date.now(),
        source: 'Fallback'
      };

      console.log('⚠️ Using fallback BNB price:', fallbackPrice.price);
      return fallbackPrice;
    }
  }

  // Try multiple sources until one works
  private static async fetchPriceFromSources(): Promise<PriceData> {
    const errors: string[] = [];

    for (const source of this.priceSources) {
      try {
        console.log(`🔍 Trying ${source.name}...`);
        
        const response = await fetch(source.url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          // Add timeout and abort controller
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const priceData = source.parser(data);

        // Validate price data
        if (!priceData.price || isNaN(priceData.price) || priceData.price <= 0) {
          throw new Error('Invalid price data received');
        }

        console.log(`✅ Successfully fetched from ${source.name}: $${priceData.price}`);
        return priceData;

      } catch (error) {
        const errorMsg = `${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.warn(`⚠️ ${source.name} failed:`, error);
        continue;
      }
    }

    // If all sources fail, throw combined error
    throw new Error(`All price sources failed: ${errors.join(', ')}`);
  }

  // Convert BNB amount to USD
  static async convertBNBToUSD(bnbAmount: string | number): Promise<string> {
    try {
      const priceData = await this.getBNBPrice();
      const amount = typeof bnbAmount === 'string' ? parseFloat(bnbAmount) : bnbAmount;
      const usdValue = amount * priceData.price;
      
      return usdValue.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
      });
    } catch (error) {
      console.error('Failed to convert BNB to USD:', error);
      return '$0.00';
    }
  }

  // Get price with change indicator
  static async getPriceWithChange(): Promise<string> {
    try {
      const priceData = await this.getBNBPrice();
      const changeIndicator = priceData.change24h >= 0 ? '📈' : '📉';
      
      return `${changeIndicator} $${priceData.price.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })} (${priceData.change24h >= 0 ? '+' : ''}${priceData.change24h.toFixed(2)}%)`;
    } catch (error) {
      console.error('Failed to get price with change:', error);
      return '💰 $600.00 (±0.00%)';
    }
  }

  // Calculate gas costs in USD for user display
  static async calculateGasCostsUSD(): Promise<{
    nftMint: string;
    tokenCreation: string;
    bnbTransfer: string;
    minBalance: string;
  }> {
    try {
      const priceData = await this.getBNBPrice();
      
      // opBNB gas costs in BNB (realistic estimates)
      const gasCosts = {
        nftMint: 0.0001,      // ~$0.06-0.12
        tokenCreation: 0.0003, // ~$0.18-0.36
        bnbTransfer: 0.00001,  // ~$0.006-0.012
        minBalance: 0.00001    // Minimum needed
      };

      return {
        nftMint: `$${(gasCosts.nftMint * priceData.price).toFixed(3)}`,
        tokenCreation: `$${(gasCosts.tokenCreation * priceData.price).toFixed(3)}`,
        bnbTransfer: `$${(gasCosts.bnbTransfer * priceData.price).toFixed(4)}`,
        minBalance: `$${(gasCosts.minBalance * priceData.price).toFixed(4)}`
      };
    } catch (error) {
      console.error('Failed to calculate gas costs:', error);
      // Fallback costs at $600/BNB
      return {
        nftMint: '$0.060',
        tokenCreation: '$0.180',
        bnbTransfer: '$0.006',
        minBalance: '$0.006'
      };
    }
  }

  // Force refresh price (bypass cache)
  static async refreshPrice(): Promise<PriceData> {
    this.cachedPrice = null;
    return this.getBNBPrice();
  }

  // Get cached price without fetching
  static getCachedPrice(): PriceData | null {
    if (this.cachedPrice && Date.now() - this.cachedPrice.lastUpdated < this.cacheExpiry) {
      return this.cachedPrice;
    }
    return null;
  }
}
