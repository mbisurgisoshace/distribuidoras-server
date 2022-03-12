import { IWrite } from './IWrite';
import { IRead } from './IRead';

export interface IBaseRepository<T> extends IWrite<T>, IRead<T> {}
