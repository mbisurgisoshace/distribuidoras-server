import { MergeQuery } from './MergeQuery';

/**
 * Merge Config object that should be specified when using the MergeQueryBuilder
 *
 * @param identityKeys - auto increment columns. these will be excluded from inserts and updates
 * @param autoFillMissingValues - all rows should be consistent (ie: same attributes). However, if this is true, missing values will be replaced with null or defaults
 * @param defaults - optionally, defaults can be specified in an object for missing values
 */
export interface MergeConfig {
  identityKeys: string[];
  autoFillMissingValues: boolean;
  autoFillMissingWith: Record<string, unknown>;
}

/**
 * This class can be used to put together data required to generate a MERGE query. Once initialised, the following methods should be called:
 * 1. config
 * 2. upsertOn
 * 3. deleteWhen
 */
export class MergeQueryBuilder<T> {
  private dbRows: T[];
  private tableName: string;
  private onKeys: string[];
  private onDeleteString: string = null;
  private deleteParamBindings: string[];
  private mergeConfig: MergeConfig;

  constructor(tableName: string, dbRows: T[]) {
    this.tableName = tableName;
    this.dbRows = dbRows;
  }

  /**
   * some configs to control MERGE behavior. Conforms to the MergeConfig interface
   * @param mergeConfig
   */
  config(mergeConfig: MergeConfig) {
    this.mergeConfig = mergeConfig;
    return this;
  }

  /**
   * Array of column names to use for the ON portion of the MERGE query.
   * @param onKeys
   */
  upsertOn(onKeys: string[]) {
    this.onKeys = onKeys;
    return this;
  }

  /**
   * SQL statement string to add to the DELETE condition of the MERGE query. (eg: deleteWhen(`Land_ID = ? AND LandInventory_ID = ?`, [1234, 4]))
   * @param deleteString
   * @param deleteParamBindings
   */
  deleteWhen(deleteString: string, deleteParamBindings: (string | number)[]) {
    const bindingCount = ((deleteString || '').match(/\?/g) || []).length;

    if (bindingCount !== deleteParamBindings.length) {
      throw new Error(
        `Merge query delete parameter binding mismatch. Delete string: ${deleteString} Bindings: ${deleteParamBindings}`,
      );
    }

    this.onDeleteString = deleteString;
    this.deleteParamBindings = deleteParamBindings.map((param) => param + '');
    return this;
  }

  /**
   * Call this once the builder is fully configured to generate a MergeQuery object.
   * The MergeQuery object knows how to generate a MERGE query. Refer the jsdoc comments in that class for more info.
   */
  build() {
    if (!this.mergeConfig) {
      throw new Error('Merge configuration should be set using config method before calling build.');
    }
    if (!this.onKeys) {
      throw new Error('Upsert ON keys should be set using upsertOn method before calling build.');
    }
    return new MergeQuery(
      this.tableName,
      this.dbRows,
      this.onKeys,
      this.onDeleteString,
      this.deleteParamBindings,
      this.mergeConfig,
    );
  }
}
