import { Reactive } from 'vue';

declare class Store {
  private subscribers: Map<string, ((data: any, quiet?: boolean) => void)[]>;
  private model: Reactive<object>;

  constructor();

  subscribe(event: string, subscriber: (data: any) => void): void;
  unsubscribe(event: string, subscriber: (data: any) => void): void;
  publish(event: string, payload: any): void;
}

declare const store: Store;
export { Store, store };
