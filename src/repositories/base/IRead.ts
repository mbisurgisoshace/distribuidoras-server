export interface IRead<T> {
  find(conditions?: Record<string, any>, table?: string): Promise<T[]>;
  findOne(conditions?: Record<string, any>, table?: string): Promise<T>;
}
