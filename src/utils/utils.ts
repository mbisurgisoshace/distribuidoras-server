import * as _ from 'lodash';
import {isArray} from "util";

export const camelize = (str) => {
    return str.replace(/([a-z])([A-Z])/g, '$1_$2').replace(/\s+/g, '_').replace(/\/+/g, '_').toLowerCase();
};

export const camelizeKeys = (object) => {
  if (isArray(object)) {
      let result = [];

      object.forEach(o => {
          let newObject = {};

          _.map(o, (value, key) => {
              newObject[camelize(key)] = value;
          });

          result.push(newObject);
      });
      return result;
  } else {
      let result = {};

      _.map(object, (value, key) => {
         result[camelize(key)] = value;
      });
      return result;
  }
};

export const formatKeys = (object, removedKey = '') => {
    if (isArray(object)) {
        let result = [];

        object.forEach(o => {
            let newObject = {};

            _.map(o, (value, key) => {
                if (key !== removedKey) {
                    const newKey = key.replace(/_/g, '');
                    newObject[newKey] = value;
                }
            });

            result.push(newObject)
        });
        return result;
    } else {
        let result = {};

        _.map(object, (value, key) => {
            if (key !== removedKey) {
                const newKey = key.replace(/_/g, '');
                result[newKey] = value;
            }
        });
        return result;
    }
};
