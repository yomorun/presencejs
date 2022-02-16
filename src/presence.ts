import { Observable } from 'rxjs';
import WS from './websocket';
import WT from './webtransport';
import { getProtocol } from './helper';
import { IPresence, IPresenceOption } from './type';

export default class Presence {
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

    constructor(host: string, option: IPresenceOption) {
        const scheme = getProtocol(host);

        let presence: IPresence;

        if (scheme === 'https') {
            // @ts-ignore
            if (typeof WebTransport !== 'undefined') {
                presence = new WT(host, option);
            } else {
                presence = new WS(host.replace(/^https/, 'wss'), option);
            }
        } else if (scheme === 'ws' || scheme === 'wss') {
            presence = new WS(host, option);
        } else {
            throw new Error(
                `${host} -> The URL's scheme must be either 'ws' 、'wss' or 'https'`
            );
        }

        this.host = presence.host;
        this.on = presence.on.bind(presence);
        this.on$ = presence.on$.bind(presence);
        this.send = presence.send.bind(presence);
        this.toRoom = presence.toRoom.bind(presence);
        this.ofRoom = presence.ofRoom.bind(presence);
        this.close = presence.close.bind(presence);
    }
}
