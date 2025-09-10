import React, { useState, useEffect } from 'react';
import { JsonRpcProvider } from 'near-api-js/lib/providers';
import { Big } from 'big.js';
import HolographicEffect from './HolographicEffect';

// Essential constants from TokenPrices.tsx
const TOKENS = {
  NEAR: "wrap.near",
};

const TOKEN_DECIMALS = {
  [TOKENS.NEAR]: 24,
};

// USDC token and pool constants
const USDC = '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1';
const NEAR_USDC_POOL = 4512;
const USDC_DECIMALS = 6;

// Function to get token exchange rate
const getReturn = async (args: {
  pool_id: number;
  token_in: string;
  token_out: string;
  amount_in: string;
}): Promise<string | null> => {
  try {
    const provider = new JsonRpcProvider({ url: 'https://free.rpc.fastnear.com' });
    const args_base64 = Buffer.from(JSON.stringify(args)).toString('base64');
    
    const response: any = await provider.query({
      request_type: 'call_function',
      account_id: 'v2.ref-finance.near',
      method_name: 'get_return',
      args_base64,
      finality: 'final'
    });
    
    if (response && response.result) {
      const resultBytes = Buffer.from(response.result);
      const resultText = new TextDecoder().decode(resultBytes);
      return JSON.parse(resultText);
    }
    
    return null;
  } catch (error) {
    console.error('Error in getReturn:', error);
    return null;
  }
};

// Get NEAR price in USDC
const getNearPriceInUSDC = async (): Promise<Big> => {
  try {
    const provider = new JsonRpcProvider({ url: 'https://free.rpc.fastnear.com' });
    const args = {
      pool_id: NEAR_USDC_POOL,
      token_in: TOKENS.NEAR,
      token_out: USDC,
      amount_in: '1000000000000000000000000' // 1 NEAR (24 decimals)
    };
    const args_base64 = Buffer.from(JSON.stringify(args)).toString('base64');
    
    const response: any = await provider.query({
      request_type: 'call_function',
      account_id: 'v2.ref-finance.near',
      method_name: 'get_return',
      args_base64,
      finality: 'final'
    });
    
    if (response && response.result) {
      const resultBytes = Buffer.from(response.result);
      const resultText = new TextDecoder().decode(resultBytes);
      const usdcAmount = JSON.parse(resultText);
      
      return new Big(usdcAmount).div(new Big(10).pow(USDC_DECIMALS));
    }
    
    return new Big(0);
  } catch (error) {
    console.error('Error getting NEAR price:', error);
    return new Big(0);
  }
};

// Hook for token prices - optimized for Navbar display
export function useTokenPrices() {
  const [nearInUsdc, setNearInUsdc] = useState<string>('—');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get NEAR price in USDC
        const nearPrice = await getNearPriceInUSDC();
        if (nearPrice.gt(0)) {
          setNearInUsdc(nearPrice.toFixed(2));
        }

      } catch (err: any) {
        console.error('Failed to fetch token prices:', err);
        setError(err.message || 'Failed to fetch prices');
        // Keep showing "—" on error
        setNearInUsdc('—');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrices();
    
    // Refresh prices every 5 minutes
    const intervalId = setInterval(() => {
      fetchPrices();
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  return { 
    nearInUsdc: isLoading ? '—' : nearInUsdc, 
    isLoading, 
    error 
  };
}

// Component for displaying token prices in Navbar
export default function TokenPriceDisplay() {
  const { nearInUsdc, isLoading } = useTokenPrices();

  return (
    <div className="space-y-2">
      <HolographicEffect type="border" className="flex items-center justify-between rounded-lg border border-[rgba(237,201,81,0.4)] bg-gradient-to-r from-[rgba(237,201,81,0.08)] to-[rgba(237,201,81,0.12)] px-3 py-2.5 hover:bg-gradient-to-r hover:from-[rgba(237,201,81,0.12)] hover:to-[rgba(237,201,81,0.16)] transition-all duration-200">
        <HolographicEffect type="text" intensity="strong">
          <span className="text-sm font-bold text-[rgb(237,201,81)] tracking-wide">NEAR</span>
        </HolographicEffect>
        <HolographicEffect type="text" intensity="strong">
          <span className="text-sm text-[rgb(237,201,81)] font-semibold">
            {nearInUsdc === '—' ? '—' : `$${nearInUsdc}`}
          </span>
        </HolographicEffect>
      </HolographicEffect>
    </div>
  );
}
