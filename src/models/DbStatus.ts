export interface DbStatus {
  type: 'mongodb' | 'local';
  connected: boolean;
  message: string;
  databaseName?: string;
}
