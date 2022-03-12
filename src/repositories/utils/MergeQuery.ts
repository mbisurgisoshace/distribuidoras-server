import { MergeConfig } from './MergeQueryBuilder';
import {
  GetTableValueConstructor,
  mergeGenerateInsertColString,
  mergeGenerateInsertValueString,
  mergeGenerateNotInIdentityValues,
  mergeGenerateOnKeysString,
  mergeGenerateUpdateString
} from './queryGeneratorUtils';

/**
 * MergeQuery class contains data and functions to generate a Merge query to be executed against an MSSQL database.
 */
export class MergeQuery<T> {
  private readonly tableName: string;
  private readonly dbRows: T[];
  private readonly mergeConfig: MergeConfig;
  private readonly onKeys: string[];
  private readonly onDeleteString: string | null;
  private readonly deleteParamBindings: string[];

  /**
   *
   * @param tableName - table name to execute the MERGE query against.
   * @param dbRows - data to be MERGED.
   * @param onKeys - the column names to use for the ON clause in the merge query.
   * @param onDeleteString - Conditional SQL statement string to be used to DELETE rows through the MERGE query.
   * @param deleteParamBindings - Parameter bindings array for the onDeleteString SQL statement.
   * @param mergeConfig - A few configuration values to be used in MERGE query generation.
   */
  constructor(
    tableName: string,
    dbRows: T[],
    onKeys: string[],
    onDeleteString: string = null,
    deleteParamBindings: string[],
    mergeConfig: MergeConfig
  ) {
    this.tableName = tableName;
    this.dbRows = dbRows;
    this.onKeys = onKeys;
    this.onDeleteString = onDeleteString;
    this.deleteParamBindings = deleteParamBindings;
    this.mergeConfig = mergeConfig;
  }

  /**
   * @returns {success, queryString, parameterBindings}
   * success - Boolean stating whether the query generation was successful or not.
   * queryString - MERGE query string ready to execute.
   * parameterBindings - Array of values to be used to complete parameter binding for the queryString.
   */
  getMergeQuery(startIdx, endIdx, outputRows) {
    if (this.tableName && this.dbRows && this.onKeys && this.mergeConfig) {
      return this.generateMergeQuery(startIdx, endIdx, outputRows);
    }
    throw new Error('Merge Query Generator constructor values have not been initialized properly.');
  }

  /**
   * 1. Validate rows to ensure they are consistent (ie: same number of columns).
   * 2. Fix missing values with null/defaults if specified in the MergeConfig object during initialisation.
   * 3. If inconsistent columns are found, and autoFillMissingValues is false, a validation error will be thrown.
   */
  validateAndFixRows() {
    const missingColumns = this.validateAndFix();
    const { autoFillMissingValues } = this.mergeConfig;

    if (missingColumns.length > 0) {
      if (!autoFillMissingValues) {
        throw new Error(
          `Inconsistent columns specified for ${
            this.tableName
          } upsert operation. The following columns were missing in some row objects: ${missingColumns.join(',')}`
        );
      } else {
        console.log(`Missing values ${missingColumns.join(',')} for table ${this.tableName} have been auto populated with null/defaults for some rows`);
      }
    }
  }

  /**
   * Private method used by validateAndFixRows() method to perform row data validation and fixes.
   * Refer validateAndFixRows() jsdoc comment for more information.
   * @private
   */
  private validateAndFix() {
    let missingColumnsAggregate = [];
    const dbRows = this.dbRows;
    const { autoFillMissingWith } = this.mergeConfig;

    if (dbRows && dbRows.length > 0) {
      // get all unique columns from dbRows
      const columns = [...new Set(Object.keys(dbRows.reduce((acc, rowObj) => Object.assign(acc, rowObj), {})))];

      // find missing columns for each row
      dbRows.forEach((rowObj) => {
        const missingColumns = columns.filter(
          (colName) => !Object.keys(rowObj).includes(colName) || rowObj[colName] === undefined
        );
        missingColumnsAggregate = [...missingColumnsAggregate, ...missingColumns];

        // auto fill missing values with null or defaults if specified
        missingColumns.forEach((colName) => {
          rowObj[colName] = colName in autoFillMissingWith ? autoFillMissingWith[colName] : null;
        });
      });
    }
    return [...new Set(missingColumnsAggregate)];
  }

  /**
   * Generate MERGE query to perform an upsert into an MSSQL table.
   */
  private generateMergeQuery(startIdx, endIdx, outputRows) {
    const { identityKeys } = this.mergeConfig;
    const dbRows = this.getChunk(startIdx, endIdx);

    const result = { success: false, queryString: null, parameterBindings: null };
    if (dbRows && dbRows.length > 0) {
      const dbColumns = Object.keys(dbRows[0]).filter((colName) => !(identityKeys || []).includes(colName));

      const { queryString, parameterBindings } = GetTableValueConstructor(dbRows);
      const onKeysString = mergeGenerateOnKeysString(this.onKeys);
      const updateString = mergeGenerateUpdateString(dbColumns);
      const insertColString = mergeGenerateInsertColString(dbColumns);
      const insertValueString = mergeGenerateInsertValueString(dbColumns);
      const onDeleteClauseString = this.onDeleteString;
      const { notInIdentityValueString, notInIdentityBindings } = mergeGenerateNotInIdentityValues(
        this.mergeConfig.identityKeys,
        outputRows
      );

      result.queryString = `MERGE ${this.tableName} AS T
      ${queryString}
      ON ${onKeysString}
      WHEN MATCHED THEN UPDATE ${updateString}
      WHEN NOT MATCHED THEN INSERT (${insertColString})
      VALUES (${insertValueString})`.concat(
        !onDeleteClauseString
          ? ' OUTPUT $action, S.SourceId, inserted.*, deleted.*;'
          : ` WHEN NOT MATCHED BY SOURCE AND ${onDeleteClauseString} ${notInIdentityValueString} THEN DELETE 
      OUTPUT $action, S.SourceId, inserted.*, deleted.*;`
      );

      // bind delete parameters if delete clause is specified
      if (onDeleteClauseString) {
        result.parameterBindings = [
          ...parameterBindings,
          ...(this.deleteParamBindings || []).concat(notInIdentityBindings)
        ];
      } else {
        result.parameterBindings = parameterBindings;
      }

      if (
        this.tableName &&
        queryString &&
        updateString &&
        insertColString &&
        insertValueString &&
        (onDeleteClauseString === null || onDeleteClauseString)
      ) {
        result.success = true;
      }
    }
    return result;
  }

  private getChunk(start, end) {
    return this.dbRows.slice(start, end);
  }

  public getDbRows() {
    return this.dbRows;
  }

  public getIdentityKeys() {
    if (this.mergeConfig && this.mergeConfig.identityKeys) {
      return this.mergeConfig.identityKeys;
    }
    return [];
  }
}
