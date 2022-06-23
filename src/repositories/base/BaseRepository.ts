//@ts-ignore
import { Knex } from 'knex';

import knex from '../../db/connection';
import { IBaseRepository } from './IBaseRepository';

import { MergeQuery } from '../utils/MergeQuery';
import { MergeDatabaseResponse } from './interfaces';

export interface IConditionsObject {
  whereInConditions?: Array<{ id: string; values: Array<string> }>;
}

export abstract class BaseRepository<T> implements IBaseRepository<T> {
  public readonly tableName;
  private readonly knexContext: Knex.Transaction | Knex;

  constructor(tableName: string, context?: Knex.Transaction | Knex) {
    this.tableName = tableName;
    this.knexContext = context ? context : knex;
  }

  async insert(item: T, returnColumns?: string[], options?: Record<string, any>): Promise<any> {
    try {
      if (returnColumns) {
        return await this.knexContext(this.tableName).insert(item, returnColumns, options ? options : {});
      } else {
        return await this.knexContext(this.tableName).insert(item, '*');
      }
    } catch (err) {
      console.log('insert error: ', err);
      throw new Error('Error during insert operation.');
    }
  }

  /**
   * Upsert data into a MSSQL table
   * @param mergeQuery - A class that encapsulates configs and data required to generate a MERGE query
   * @returns Promise<T> - A promise that resolves to the shape of the MergeDatabaseResponse interface
   */
  async upsert<T>(mergeQuery: MergeQuery<T>): Promise<MergeDatabaseResponse<T>> {
    mergeQuery.validateAndFixRows();

    if ((mergeQuery.getDbRows() || []).length === 0) {
      console.log('Empty input array provided for upsert operation. Will not proceed.');
      return BaseRepository.transformMergeDbResults([]);
    }

    const dbRows = mergeQuery.getDbRows();
    const rowsPerBatch = Math.floor(
      (2000 - mergeQuery.getIdentityKeys().length * dbRows.length) / Object.keys(dbRows[0]).length,
    );
    const iterationsRequired = Math.ceil(dbRows.length / rowsPerBatch);

    let upsertedRows = [];
    console.log(`Performing merge for ${dbRows.length} input rows in ${iterationsRequired} iterations...`);

    for (let idx = 0; idx < iterationsRequired; idx++) {
      const startIndex = idx * rowsPerBatch;
      const endIndex = Math.min(startIndex + rowsPerBatch, dbRows.length);

      const { queryString, parameterBindings, success } = mergeQuery.getMergeQuery(startIndex, endIndex, upsertedRows);

      if (success) {
        const outputRows = (await this.knexContext.raw(queryString, parameterBindings)).map((outputRow) => {
          if (outputRow['SourceId'] !== null) {
            outputRow['SourceId'] = parseInt(outputRow['SourceId']) + idx * rowsPerBatch;
          }
          return outputRow;
        });
        upsertedRows = upsertedRows.concat(outputRows);
      } else {
        console.log('Malformed MERGE query: ', mergeQuery);
        throw new Error('Malformed MERGE query.');
      }
    }

    return BaseRepository.transformMergeDbResults(upsertedRows);
  }

  /**
   * Transforms MERGE query result into the MergeDatabaseResponse shape. Involves filtering out DELETED rows and then
   * sorting the array by SourceId to ensure that the data is returned in the original order that it was received.
   * @param upsertedRows - DB response with additional attributes that tells us which rows were INSERTED/UPDATED/DELETED
   * @private
   */
  private static transformMergeDbResults<T>(upsertedRows): MergeDatabaseResponse<T> {
    const upsertedRowsSorted = (upsertedRows || [])
      .filter((row) => row['$action'] === 'INSERT' || row['$action'] === 'UPDATE')
      .sort((obj1, obj2) => (obj1.SourceId > obj2.SourceId ? 1 : -1))
      .map((row) => {
        Object.keys(row).forEach((colName) => {
          if (Array.isArray(row[colName])) {
            row[colName] = row[colName][0];
          }
        });
        return row;
      }) as T[];

    return {
      upsertedRows: upsertedRowsSorted,
    };
  }

  async update(
    conditions: Record<string, any>,
    item: T,
    returnColumns?: string[],
    options?: Record<string, any>,
  ): Promise<any> {
    try {
      if (returnColumns && options) {
        await this.knexContext(this.tableName).update(item, returnColumns, options).where(conditions);
      } else {
        await this.knexContext(this.tableName).update(item).where(conditions);
      }
    } catch (err) {
      console.log('update error: ', err);
      throw new Error();
    }
  }

  async delete(conditions: Record<string, any>): Promise<boolean> {
    try {
      return !!(await this.knexContext(this.tableName).delete().where(conditions));
    } catch (err) {
      console.log('delete error: ', err);
      throw new Error();
    }
  }

  async find(
    conditions: Record<string, any> = null,
    tableName: string = null,
    conditionsObject: IConditionsObject = null,
  ): Promise<T[]> {
    try {
      const query = this.knexContext(tableName ? tableName : this.tableName).select('*');

      if (conditions) {
        query.where(conditions);
      }

      if (conditionsObject && conditionsObject.whereInConditions) {
        conditionsObject.whereInConditions.forEach((condition) => {
          query.whereIn(condition.id, condition.values);
        });
      }

      const result = await query;

      return result && result.length > 0 ? result : [];
    } catch (err) {
      console.log('findOne error: ', err);
      throw new Error();
    }
  }

  async findOne(conditions: Record<string, any> = null, tableName: string = null): Promise<T> {
    try {
      const query = this.knexContext(tableName ? tableName : this.tableName).select('*');

      if (conditions) {
        query.where(conditions);
      }

      const result = await query;

      return result && result.length > 0 ? result[0] : null;
    } catch (err) {
      console.log('findOne error: ', err);
      throw new Error();
    }
  }

  async insertMany(items: Array<T>, tableName: string = null) {
    try {
      const result = [];
      await this.knexContext.transaction(async (trx: Knex.Transaction) => {
        for (let iCounter = 0; iCounter < items.length; iCounter++) {
          const item = items[iCounter];
          const newItem = (await trx(tableName || this.tableName).insert(item, '*'))[0];
          result.push(newItem);
        }
      });
      return result;
    } catch (err) {
      console.log('insertMany error: ', err);
      throw new Error();
    }
  }

  getKnexTransactionContext() {
    return this.knexContext as Knex.Transaction;
  }
}
