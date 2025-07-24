/**
 * Exchange Rate Update Script
 * 
 * This script fetches the latest USD to CAD exchange rate and updates it in the database.
 * It can be run as a scheduled task (e.g., daily cron job) to keep rates current.
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for admin access
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch latest USD to CAD exchange rate from a free API
 */
async function fetchLatestExchangeRate() {
  try {
    // Using Exchange Rate API (free tier)
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.rates && data.rates.CAD) {
      return data.rates.CAD;
    } else {
      throw new Error('CAD rate not found in API response');
    }
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return null;
  }
}

/**
 * Update exchange rate in the database
 */
async function updateExchangeRate(rate) {
  try {
    // Check if record exists
    const { data } = await supabase
      .from('exchange_rates')
      .select('id')
      .eq('from_currency', 'USD')
      .eq('to_currency', 'CAD')
      .single();
    
    if (data) {
      // Update existing record
      const { error } = await supabase
        .from('exchange_rates')
        .update({
          rate: rate,
          last_updated: new Date().toISOString()
        })
        .eq('id', data.id);
      
      if (error) {
        throw error;
      }
      
      console.log(`Exchange rate updated: 1 USD = ${rate} CAD`);
    } else {
      // Create new record
      const { error } = await supabase
        .from('exchange_rates')
        .insert({
          from_currency: 'USD',
          to_currency: 'CAD',
          rate: rate,
          last_updated: new Date().toISOString()
        });
      
      if (error) {
        throw error;
      }
      
      console.log(`Exchange rate created: 1 USD = ${rate} CAD`);
    }
  } catch (error) {
    console.error('Error updating exchange rate in database:', error);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Fetching latest USD to CAD exchange rate...');
  
  const rate = await fetchLatestExchangeRate();
  
  if (rate) {
    console.log(`Latest rate: 1 USD = ${rate} CAD`);
    await updateExchangeRate(rate);
  } else {
    console.log('Failed to fetch exchange rate. No updates made.');
  }
}

// Run the script
main()
  .then(() => {
    console.log('Exchange rate update completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
