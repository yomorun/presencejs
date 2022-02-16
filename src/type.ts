import { Observable } from 'rxjs';

export type EventMessage = {
    event: string;
    data: any;
};

export interface IPresence {
    // Service url
    host: string;
    // Function to handle response for given event from server
    on: <T>(event: string, cb: (data: T) => void) => void;
    // Same as the `on` method, returns an observable response
    on$: <T>(event: string) => Observable<T>;
    // Function for sending data to the server
    send: <T>(event: string, data: T) => void;
    // Enter a room
    toRoom: (roomName: string) => IPresence;
    // Function for sending data streams to the server
    ofRoom: (roomName: string, event: string) => void;
    // Close subscriptions, clean up
    close: () => void;
}

export interface IPresenceOption {
    // Authentication
    auth?: {
        // Certification Type
        type: 'publickey' | 'token';
        // The public key in your Allegro Mesh project.
        publicKey?: string;
        // api for getting access token
        endpoint?: string;
    };
    // The reconnection interval value.
    reconnectInterval?: number;
    // The reconnection attempts value.
    reconnectAttempts?: number;
}
