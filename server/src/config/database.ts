import { config } from './env.js';

export interface DatabaseStatus {
  mode: 'demo' | 'oracle';
  connected: boolean;
  message: string;
  dialect: string;
  details?: {
    user?: string;
    connectString?: string;
  };
}

let oraclePool: any = null;

export async function initDatabase(): Promise<DatabaseStatus> {
  if (config.dbMode === 'oracle') {
    try {
      // Dynamic import of oracledb so app starts smoothly in demo/FreeSQL mode even if native driver is absent
      const oracledb = await import('oracledb');
      
      if (config.oracle.libDir) {
        oracledb.default.initOracleClient({ libDir: config.oracle.libDir });
      }

      oraclePool = await oracledb.default.createPool({
        user: config.oracle.user,
        password: config.oracle.password,
        connectString: config.oracle.connectString,
        poolMin: 1,
        poolMax: 5,
        poolIncrement: 1,
      });

      console.log('✅ Oracle Database connection pool initialized successfully.');
      return {
        mode: 'oracle',
        connected: true,
        message: 'Connected to live Oracle Database instance.',
        dialect: 'Oracle Database 19c/21c/23c (PL/SQL)',
        details: {
          user: config.oracle.user,
          connectString: config.oracle.connectString,
        },
      };
    } catch (err: any) {
      console.warn('⚠️  Could not connect to Oracle Database:', err.message);
      console.warn('ℹ️  Running in Demo Mode (FreeSQL/Local development).');
      return {
        mode: 'oracle',
        connected: false,
        message: `Oracle connection failed: ${err.message}. Operating with local sample data repository.`,
        dialect: 'Oracle Database (Disconnected / Fallback)',
        details: {
          user: config.oracle.user,
          connectString: config.oracle.connectString,
        },
      };
    }
  }

  // Demo Mode
  return {
    mode: 'demo',
    connected: true,
    message: 'Active in Demo Mode with persistent sample data and PL/SQL-equivalent business rules engine.',
    dialect: 'CampusConnect Demo In-Memory Repository (Oracle PL/SQL Emulation)',
  };
}

export function getOraclePool() {
  return oraclePool;
}
