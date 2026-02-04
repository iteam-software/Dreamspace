import { CosmosClient, type Database } from '@azure/cosmos';
import type { ContainerConfig } from './repositories/BaseRepository';
import {
  UserRepository,
  DreamsRepository,
  WeeksRepository,
  ConnectsRepository,
  ScoringRepository,
  TeamsRepository,
  PromptsRepository,
  ItemsRepository,
} from './repositories';

/**
 * Container configuration for Cosmos DB
 * Maps logical container names to their properties
 */
export const CONTAINER_CONFIG: ContainerConfig = {
  users: {
    name: 'users',
    partitionKey: '/userId',
  },
  dreams: {
    name: 'dreams',
    partitionKey: '/userId',
  },
  connects: {
    name: 'connects',
    partitionKey: '/userId',
  },
  scoring: {
    name: 'scoring',
    partitionKey: '/userId',
  },
  teams: {
    name: 'teams',
    partitionKey: '/managerId',
  },
  coaching_alerts: {
    name: 'coaching_alerts',
    partitionKey: '/managerId',
  },
  currentWeek: {
    name: 'currentWeek',
    partitionKey: '/userId',
  },
  pastWeeks: {
    name: 'pastWeeks',
    partitionKey: '/userId',
  },
  meeting_attendance: {
    name: 'meeting_attendance',
    partitionKey: '/teamId',
  },
  prompts: {
    name: 'prompts',
    partitionKey: '/partitionKey',
  },
  items: {
    name: 'items',
    partitionKey: '/userId',
  },
};

/**
 * Database client singleton for Cosmos DB operations.
 * Provides access to all repositories.
 */
export class DatabaseClient {
  private static instance: DatabaseClient | null = null;

  private client: CosmosClient;
  private database: Database;

  public readonly users: UserRepository;
  public readonly dreams: DreamsRepository;
  public readonly weeks: WeeksRepository;
  public readonly connects: ConnectsRepository;
  public readonly scoring: ScoringRepository;
  public readonly teams: TeamsRepository;
  public readonly prompts: PromptsRepository;
  public readonly items: ItemsRepository;

  private constructor(endpoint: string, key: string, databaseName = 'dreamspace') {
    this.client = new CosmosClient({ endpoint, key });
    this.database = this.client.database(databaseName);

    // Initialize repositories
    this.users = new UserRepository(this.database, CONTAINER_CONFIG);
    this.dreams = new DreamsRepository(this.database, CONTAINER_CONFIG);
    this.weeks = new WeeksRepository(this.database, CONTAINER_CONFIG);
    this.connects = new ConnectsRepository(this.database, CONTAINER_CONFIG);
    this.scoring = new ScoringRepository(this.database, CONTAINER_CONFIG);
    this.teams = new TeamsRepository(this.database, CONTAINER_CONFIG);
    this.prompts = new PromptsRepository(this.database, CONTAINER_CONFIG);
    this.items = new ItemsRepository(this.database, CONTAINER_CONFIG);
  }

  /**
   * Gets the singleton instance of DatabaseClient
   * @param endpoint - Cosmos DB endpoint (required on first call)
   * @param key - Cosmos DB key (required on first call)
   * @param databaseName - Database name (defaults to 'dreamspace')
   * @returns DatabaseClient instance
   */
  static getInstance(
    endpoint?: string,
    key?: string,
    databaseName?: string
  ): DatabaseClient {
    if (!DatabaseClient.instance) {
      if (!endpoint || !key) {
        throw new Error('COSMOS_ENDPOINT and COSMOS_KEY are required for first initialization');
      }
      DatabaseClient.instance = new DatabaseClient(endpoint, key, databaseName);
    }
    return DatabaseClient.instance;
  }

  /**
   * Resets the singleton instance (useful for testing)
   */
  static reset(): void {
    DatabaseClient.instance = null;
  }

  /**
   * Gets the underlying Cosmos Database instance
   * @returns Cosmos Database instance
   */
  getDatabase(): Database {
    return this.database;
  }
}

/**
 * Initializes and returns the database client
 * @returns DatabaseClient instance
 */
export function getDatabaseClient(): DatabaseClient {
  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;

  if (!endpoint || !key) {
    throw new Error('COSMOS_ENDPOINT and COSMOS_KEY environment variables are required');
  }

  return DatabaseClient.getInstance(endpoint, key);
}
