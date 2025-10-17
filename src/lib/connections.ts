/**
 * Connections Service - Smart switcher between mock and real implementations
 * 
 * Set VITE_USE_MOCK=true in .env.local for development with mock data
 * Set VITE_USE_MOCK=false (or omit) for production with real Supabase
 */

import { USE_MOCK_DATA } from "../services/config";
import * as mockConnections from "./connections.mock";
import * as realConnections from "./connections.real";

// Log which implementation we're using
if (USE_MOCK_DATA) {
  console.log("�� Using MOCK connections (everyone is connected)");
} else {
  console.log("🔌 Using REAL connections (Supabase)");
}

// Export the appropriate implementation based on env variable
const connectionsService = USE_MOCK_DATA ? mockConnections : realConnections;

export const getFriends = connectionsService.getFriends;
export const areConnected = connectionsService.areConnected;
