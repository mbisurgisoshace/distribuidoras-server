export interface IWrite<T> {
  insert(item: T): Promise<boolean>;
  update(conditions: Record<string, any>, item: T): Promise<boolean>;
  delete(conditions: Record<string, any>): Promise<boolean>;
}
