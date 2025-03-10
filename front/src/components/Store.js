import { reactive } from 'vue';
import _ from 'lodash';

export class Store {
	constructor() {
		this.subscribers = new Map();
		this.model = reactive({});
	}

	subscribe(event, subscriber) {
		if (!this.subscribers.has(event)) {
		  this.subscribers.set(event, []);
		}
		this.subscribers.get(event).push(subscriber);
		subscriber(_.get(this.model, event));
	}

	unsubscribe(event, subscriber) {
    if (this.subscribers.has(event)) {
      const updatedSubscribers = this.subscribers.get(event).filter(sub => sub !== subscriber);
      if (updatedSubscribers.length > 0) {
        this.subscribers.set(event, updatedSubscribers);
      } else {
        this.subscribers.delete(event);
      }
    }
  }

  publish(event, payload) {
  	let quiet;
  	if (event.indexOf('.quiet') >= 0) {
  		event = event.replace('.quiet', '');
  		quiet = true;
  	}

  	let deep;
  	if (event.indexOf('.deep') >= 0) {
  		event = event.replace('.deep', '');
  		deep = true;
  	}

  	const handle = deep ? event.split('.')[0] : event;

  	_.set(this.model, event, payload);
  	if (this.subscribers.has(handle)) {
      this.subscribers.get(handle).forEach(subscriber => {
        subscriber(deep ? this.model[handle] : payload, quiet);
      });
    }
  }
}

export const store = new Store();