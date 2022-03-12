import { mergeGenerateNotInIdentityValues } from './queryGeneratorUtils';

describe('merge utils', () => {
  test('mergeGenerateNotInIdentityValues', () => {
    const identityKeys = ['Land_ID', 'Sale_ID'];
    const outputRows = [
      { Land_ID: 12345, Sale_ID: 23 },
      { Land_ID: 12342, Sale_ID: 234 },
    ];

    const queryString = mergeGenerateNotInIdentityValues(identityKeys, outputRows);
    console.log(queryString);
  });
});
