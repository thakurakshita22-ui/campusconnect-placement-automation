import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  dbMode: (process.env.DB_MODE || 'demo').toLowerCase() as 'demo' | 'oracle',
  oracle: {
    user: process.env.ORACLE_USER || '',
    password: process.env.ORACLE_PASSWORD || '',
    connectString: process.env.ORACLE_CONNECT_STRING || '',
    libDir: process.env.ORACLE_LIB_DIR || '',
    tnsAdmin: process.env.TNS_ADMIN || '',
  },
};
