import { config } from '../config/env.js';
import { IPlacementRepository } from './IPlacementRepository.js';
import { DemoPlacementRepository } from './DemoPlacementRepository.js';
import { OraclePlacementRepository } from './OraclePlacementRepository.js';
import { getOraclePool } from '../config/database.js';

let repositoryInstance: IPlacementRepository | null = null;

export function getRepository(): IPlacementRepository {
  if (!repositoryInstance) {
    if (config.dbMode === 'oracle' && getOraclePool()) {
      console.log('📦 Using Oracle Database Repository (Live PL/SQL Engine)');
      repositoryInstance = new OraclePlacementRepository();
    } else {
      console.log('📦 Using Demo Placement Repository (In-Memory PL/SQL Emulation)');
      repositoryInstance = new DemoPlacementRepository();
    }
  }
  return repositoryInstance;
}
