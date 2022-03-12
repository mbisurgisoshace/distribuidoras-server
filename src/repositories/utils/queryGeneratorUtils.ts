import { isNumber } from 'lodash';

/**
 * Generates a Table Value Constructor string to be used as the Source table in the MERGE query
 * eg output: USING (VALUES
    (0,?,?,?,?,?,?,?,?,?,?,?),
    (1,?,?,?,?,?,?,?,?,?,?,?),
    (2,?,?,?,?,?,?,?,?,?,?,?),
    (3,?,?,?,?,?,?,?,?,?,?,?),
 ) as S(SourceId, Land_ID,LandInventory_ID,LandType_ID,LandTypeReportedAcres,ProductivityRating,ProductivityRatingType,DollarPerRating,DollarPerAcre,TotalLandInventoryRating,TotalLandInventoryValue,IsSummaryRow)
 * @param dbRows - Array of rows to be inserted/updated via MERGE query
 * @constructor
 */
export const GetTableValueConstructor = (dbRows) => {
  const result = { queryString: null, parameterBindings: null };

  if (dbRows && dbRows.length > 0) {
    const dbColumns = Object.keys(dbRows[0]);

    // create value portion of merge query
    const valueArray = dbRows.map((row) => {
      return dbColumns.map((colName) => {
        const rawValue = row[colName];
        return isNumber(rawValue) ? rawValue + '' : rawValue;
      });
    });

    // create placeholder portion of query by replacing actual values with '?'
    const placeholders = valueArray
      .map((row, idx) => {
        return `(${idx},` + row.map(() => '?').join(',') + ')';
      })
      .join(',');

    const dbColString = dbColumns.map((col) => '[' + col + ']').join(',');
    result.queryString = `USING (VALUES ${placeholders}) as S(SourceId, ${dbColString})`;
    result.parameterBindings = valueArray.flat();
  }
  return result;
};

/**
 * Generates the UPDATE portion of the MERGE query for the columns specified via dbColumns param.
 * eg output: SET Land_ID = S.Land_ID, LandType_ID = S.LandType_ID, LandTypeReportedAcres = S.LandTypeReportedAcres, ProductivityRating = S.ProductivityRating
 * @param dbColumns - The set of column names used for the MERGE query
 */
export const mergeGenerateUpdateString = (dbColumns: string[]) => {
  const updateString = (dbColumns || []).reduce((acc, colName) => {
    acc = acc + ` [${colName}] = [S].[${colName}],`;
    return acc;
  }, 'SET ');

  return updateString ? updateString.substring(0, updateString.length - 1) : null;
};

/**
 * Generates the INSERT portion of the MERGE query for the columns specified via dbColumns param.
 * eg output: Land_ID,LandType_ID,LandTypeReportedAcres,ProductivityRating,ProductivityRatingType,DollarPerRating
 * @param dbColumns - The set of column names used for the MERGE query
 */
export const mergeGenerateInsertColString = (dbColumns: string[]) => {
  if (dbColumns && dbColumns.length > 0) {
    return dbColumns.map((col) => '[' + col + ']').join(',');
  }
  return null;
};

/**
 * Generates the INSERT VALUES portion of the MERGE query for the columns specified via dbColumns param.
 * eg output: S.Land_ID,S.LandType_ID,S.LandTypeReportedAcres,S.ProductivityRating,S.ProductivityRatingType
 * @param dbColumns - The set of column names used for the MERGE query
 */
export const mergeGenerateInsertValueString = (dbColumns: string[]) => {
  if (dbColumns && dbColumns.length > 0) {
    return dbColumns
      .map((colName) => {
        return `[S].[${colName}]`;
      })
      .join(',');
  }
  return null;
};

/**
 * Generates the ON portion of the MERGE query using the columns specified in the onKeys param.
 * eg output: T.Land_ID = S.Land_ID AND T.LandInventory_ID = S.LandInventory_ID
 * @param onKeys
 */
export const mergeGenerateOnKeysString = (onKeys: string[]) => {
  return (onKeys || [])
    .map((key) => {
      return `T.${key} = S.${key}`;
    })
    .join(' AND ');
};

export const mergeGenerateNotInIdentityValues = (identityKeys: string[], outputRows) => {
  if (!outputRows || outputRows.length === 0) {
    return { notInIdentityValueString: '', notInIdentityBindings: [] };
  }

  const paramBindings = [];

  const identityKeyValues = (identityKeys || []).map((key) => {
    return `${key} NOT IN (${outputRows
      .filter((row) => row['$action'] !== 'DELETE')
      .map((row) => {
        const value = Array.isArray(row[key]) ? row[key][0] : row[key];
        paramBindings.push(value);
        return '?';
      })
      .join(', ')})`;
  });

  return { notInIdentityValueString: ` AND ${identityKeyValues.join(' AND ')}`, notInIdentityBindings: paramBindings };
};
