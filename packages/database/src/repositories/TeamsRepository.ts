import type { Database } from '@azure/cosmos';
import type { TeamDocument, CoachingAlertDocument, MeetingAttendanceDocument } from '@dreamspace/shared';
import { BaseRepository, type ContainerConfig } from './BaseRepository';

/**
 * Repository for team-related operations.
 * Handles teams, coaching alerts, and meeting attendance.
 */
export class TeamsRepository extends BaseRepository {
  constructor(database: Database, containerConfig: ContainerConfig) {
    super(database, containerConfig);
  }

  /**
   * Gets team by manager ID
   * @param managerId - Manager ID
   * @returns Team document or null if not found
   */
  async getTeam(managerId: string): Promise<TeamDocument | null> {
    const container = this.getContainer('teams');
    
    try {
      const { resource } = await container.item(managerId, managerId).read<TeamDocument>();
      return resource ?? null;
    } catch (error) {
      return this.handleReadError<TeamDocument>(error);
    }
  }

  /**
   * Gets all team relationships
   * @returns Array of team documents
   */
  async getTeamRelationships(): Promise<TeamDocument[]> {
    const container = this.getContainer('teams');
    
    try {
      const query = {
        query: 'SELECT * FROM c WHERE c.type = @type',
        parameters: [{ name: '@type', value: 'team_relationship' }]
      };
      
      const { resources } = await container.items.query<TeamDocument>(query).fetchAll();
      return resources;
    } catch (error) {
      console.error('Error fetching team relationships:', error);
      return [];
    }
  }

  /**
   * Gets a team relationship by manager ID
   * @param managerId - Manager ID
   * @returns Team document or null if not found
   */
  async getTeamByManagerId(managerId: string): Promise<TeamDocument | null> {
    const container = this.getContainer('teams');
    
    try {
      const query = {
        query: 'SELECT * FROM c WHERE c.type = @type AND c.managerId = @managerId',
        parameters: [
          { name: '@type', value: 'team_relationship' },
          { name: '@managerId', value: managerId }
        ]
      };
      
      const { resources } = await container.items.query<TeamDocument>(query).fetchAll();
      return resources.length > 0 ? (resources[0] ?? null) : null;
    } catch (error) {
      console.error('Error fetching team by manager ID:', error);
      return null;
    }
  }

  /**
   * Upserts team document
   * @param managerId - Manager ID
   * @param teamData - Team data
   * @returns Saved team document
   */
  async upsertTeam(managerId: string, teamData: Partial<TeamDocument>): Promise<TeamDocument> {
    const container = this.getContainer('teams');
    
    const document: TeamDocument = {
      id: managerId,
      managerId,
      ...teamData,
    } as TeamDocument;

    this.addTimestamps(document, !teamData.createdAt);

    const { resource } = await container.items.upsert(document);
    
    if (!resource) {
      throw new Error('Failed to upsert team');
    }
    
    return this.castResource<TeamDocument>(resource);
  }

  /**
   * Creates a new team document
   * @param teamData - Team data
   * @returns Saved team document
   */
  async createTeam(teamData: Omit<TeamDocument, 'id'>): Promise<TeamDocument> {
    const container = this.getContainer('teams');
    
    const document: TeamDocument = {
      ...teamData,
      id: teamData.teamId || `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    } as TeamDocument;

    this.addTimestamps(document, true);

    const { resource } = await container.items.create(document);
    
    if (!resource) {
      throw new Error('Failed to create team');
    }
    
    return resource;
  }

  /**
   * Updates a team document by ID
   * @param teamId - Team ID
   * @param managerId - Manager ID (partition key)
   * @param teamData - Team data to update
   * @returns Updated team document
   */
  async updateTeam(teamId: string, managerId: string, teamData: Partial<TeamDocument>): Promise<TeamDocument> {
    const container = this.getContainer('teams');
    
    const document: TeamDocument = {
      ...teamData,
      id: teamId,
      managerId,
    } as TeamDocument;

    this.addTimestamps(document, !teamData.createdAt);

    const { resource } = await container.item(teamId, managerId).replace(document);
    
    if (!resource) {
      throw new Error('Failed to update team');
    }
    
    return this.castResource<TeamDocument>(resource);
  }

  /**
   * Gets coaching alerts for a manager
   * @param managerId - Manager ID
   * @returns Array of coaching alert documents
   */
  async getCoachingAlerts(managerId: string): Promise<CoachingAlertDocument[]> {
    const container = this.getContainer('coaching_alerts');
    
    try {
      const query = {
        query: 'SELECT * FROM c WHERE c.managerId = @managerId ORDER BY c.createdAt DESC',
        parameters: [{ name: '@managerId', value: managerId }],
      };
      
      const { resources } = await container.items
        .query<CoachingAlertDocument>(query)
        .fetchAll();
      return resources;
    } catch (error) {
      console.error('Error fetching coaching alerts:', error);
      return [];
    }
  }

  /**
   * Creates coaching alert
   * @param alertData - Alert data
   * @returns Saved alert document
   */
  async createCoachingAlert(
    alertData: Omit<CoachingAlertDocument, 'id'>
  ): Promise<CoachingAlertDocument> {
    const container = this.getContainer('coaching_alerts');
    
    const document: CoachingAlertDocument = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    } as CoachingAlertDocument;

    this.addTimestamps(document, true);

    const { resource } = await container.items.create(document);
    
    if (!resource) {
      throw new Error('Failed to create coaching alert');
    }
    
    return resource;
  }

  /**
   * Gets meeting attendance for a team
   * @param teamId - Team ID
   * @returns Array of meeting attendance documents
   */
  async getMeetingAttendance(teamId: string): Promise<MeetingAttendanceDocument[]> {
    const container = this.getContainer('meeting_attendance');
    
    try {
      const query = {
        query: 'SELECT * FROM c WHERE c.teamId = @teamId ORDER BY c.meetingDate DESC',
        parameters: [{ name: '@teamId', value: teamId }],
      };
      
      const { resources } = await container.items
        .query<MeetingAttendanceDocument>(query)
        .fetchAll();
      return resources;
    } catch (error) {
      console.error('Error fetching meeting attendance:', error);
      return [];
    }
  }

  /**
   * Upserts meeting attendance
   * @param attendanceData - Attendance data
   * @returns Saved attendance document
   */
  async upsertMeetingAttendance(
    attendanceData: Partial<MeetingAttendanceDocument>
  ): Promise<MeetingAttendanceDocument> {
    const container = this.getContainer('meeting_attendance');
    
    const id =
      attendanceData.id ||
      `attendance_${attendanceData.teamId}_${attendanceData.meetingDate}`;
    
    const document: MeetingAttendanceDocument = {
      ...attendanceData,
      id,
    } as MeetingAttendanceDocument;

    this.addTimestamps(document, !attendanceData.createdAt);

    const { resource } = await container.items.upsert(document);
    
    if (!resource) {
      throw new Error('Failed to upsert meeting attendance');
    }
    
    return this.castResource<MeetingAttendanceDocument>(resource);
  }
}
