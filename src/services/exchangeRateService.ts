/**
 * Exchange Rate Service
 * Handles fetching and caching of currency exchange rates
 */
import { supabase } from '@/integrations/supabase/client';

// Interface for exchange rate data
export interface ExchangeRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  last_updated: string;
}

// Cache for exchange rates to minimize database calls
interface RateCache {
  [key: string]: {
    rate: number;
    timestamp: number;
  };
}

class ExchangeRateService {
  private static instance: ExchangeRateService;
  private cache: RateCache = {};
  private cacheTTL = 1000 * 60 * 60; // 1 hour cache

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ExchangeRateService {
    if (!ExchangeRateService.instance) {
      ExchangeRateService.instance = new ExchangeRateService();
    }
    return ExchangeRateService.instance;
  }

  /**
   * Get exchange rate from USD to CAD
   * Uses cached value if available and not expired
   */
  public async getUsdToCadRate(): Promise<number> {
    const cacheKey = 'USD_CAD';
    
    // Check cache first
    const cachedRate = this.cache[cacheKey];
    const now = Date.now();
    
    if (cachedRate && now - cachedRate.timestamp < this.cacheTTL) {
      console.log('Using cached exchange rate');
      return cachedRate.rate;
    }
    
    try {
      // Fetch from database
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('from_currency', 'USD')
        .eq('to_currency', 'CAD')
        .single();
      
      if (error) {
        console.error('Error fetching exchange rate:', error);
        // Fallback to default rate if error
        return 1.35; // Default USD to CAD rate as fallback
      }
      
      if (data) {
        // Update cache
        this.cache[cacheKey] = {
          rate: data.rate,
          timestamp: now
        };
        
        return data.rate;
      }
      
      // If no data found, use default and try to create a record
      await this.createDefaultRate();
      return 1.35; // Default USD to CAD rate
    } catch (error) {
      console.error('Unexpected error in getUsdToCadRate:', error);
      return 1.35; // Default USD to CAD rate as fallback
    }
  }

  /**
   * Convert USD amount to CAD
   */
  public async convertUsdToCad(amountUsd: number): Promise<number> {
    if (!amountUsd) return 0;
    
    const rate = await this.getUsdToCadRate();
    return amountUsd * rate;
  }

  /**
   * Create default exchange rate record if none exists
   */
  private async createDefaultRate(): Promise<void> {
    try {
      const { error } = await supabase
        .from('exchange_rates')
        .insert({
          from_currency: 'USD',
          to_currency: 'CAD',
          rate: 1.35, // Default rate
          last_updated: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error creating default exchange rate:', error);
      }
    } catch (error) {
      console.error('Unexpected error in createDefaultRate:', error);
    }
  }

  /**
   * Update exchange rate in database
   * This would be called by a scheduled function/cron job
   */
  public async updateExchangeRate(fromCurrency: string, toCurrency: string, newRate: number): Promise<void> {
    try {
      // Check if record exists
      const { data } = await supabase
        .from('exchange_rates')
        .select('id')
        .eq('from_currency', fromCurrency)
        .eq('to_currency', toCurrency)
        .single();
      
      if (data) {
        // Update existing record
        await supabase
          .from('exchange_rates')
          .update({
            rate: newRate,
            last_updated: new Date().toISOString()
          })
          .eq('id', data.id);
      } else {
        // Create new record
        await supabase
          .from('exchange_rates')
          .insert({
            from_currency: fromCurrency,
            to_currency: toCurrency,
            rate: newRate,
            last_updated: new Date().toISOString()
          });
      }
      
      // Clear cache
      const cacheKey = `${fromCurrency}_${toCurrency}`;
      delete this.cache[cacheKey];
    } catch (error) {
      console.error('Error updating exchange rate:', error);
    }
  }

  /**
   * Fetch latest exchange rate from external API
   * This would be called by a scheduled function/cron job
   */
  public async fetchLatestRate(): Promise<number | null> {
    try {
      // Using Exchange Rate API (free tier)
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await response.json();
      
      if (data && data.rates && data.rates.CAD) {
        const newRate = data.rates.CAD;
        
        // Update in database
        await this.updateExchangeRate('USD', 'CAD', newRate);
        
        return newRate;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching latest exchange rate:', error);
      return null;
    }
  }
}

// Export singleton instance
export const exchangeRateService = ExchangeRateService.getInstance();
