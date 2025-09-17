// Test script to check available station IDs and data in the database
import { createClient } from '@/lib/supabase';

async function checkDashboardData() {
  const supabase = createClient();
  
  if (!supabase) {
    console.log("❌ Supabase client not available - check environment variables");
    return;
  }

  try {
    // 1. Check available station IDs
    console.log("🔍 Checking available station IDs...");
    const { data: stations, error: stationsError } = await supabase
      .from('sensor_readings')
      .select('station_id')
      .order('timestamp', { ascending: false })
      .limit(10);

    if (stationsError) {
      console.error("❌ Error fetching stations:", stationsError);
    } else {
      console.log("📊 Available station IDs:", stations?.map((s: any) => s.station_id) || []);
    }

    // 2. Check recent data for VCBI
    console.log("\n🔍 Checking recent data for 'VCBI'...");
    const { data: vcbiData, error: vcbiError } = await supabase
      .from('sensor_readings')
      .select('*')
      .eq('station_id', 'VCBI')
      .order('timestamp', { ascending: false })
      .limit(5);

    if (vcbiError) {
      console.error("❌ Error fetching VCBI data:", vcbiError);
    } else {
      console.log("📊 Recent VCBI data:", vcbiData || []);
    }

    // 3. Check recent data for VCBI-ESP32
    console.log("\n🔍 Checking recent data for 'VCBI-ESP32'...");
    const { data: esp32Data, error: esp32Error } = await supabase
      .from('sensor_readings')
      .select('*')
      .eq('station_id', 'VCBI-ESP32')
      .order('timestamp', { ascending: false })
      .limit(5);

    if (esp32Error) {
      console.error("❌ Error fetching VCBI-ESP32 data:", esp32Error);
    } else {
      console.log("📊 Recent VCBI-ESP32 data:", esp32Data || []);
    }

    // 4. Check total record count
    console.log("\n🔍 Checking total record count...");
    const { count, error: countError } = await supabase
      .from('sensor_readings')
      .select('id', { count: 'exact', head: true });

    if (countError) {
      console.error("❌ Error getting count:", countError);
    } else {
      console.log("📊 Total records in database:", count);
    }

  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// For browser console debugging
if (typeof window !== 'undefined') {
  (window as any).checkDashboardData = checkDashboardData;
}

export default checkDashboardData;