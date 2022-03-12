/**
 * Shape of response when BaseRepository's upsert method is called.
 */
export interface MergeDatabaseResponse<T> {
  upsertedRows: T[];
}
