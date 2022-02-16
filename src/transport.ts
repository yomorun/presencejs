import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { EventMessage, IPresence } from './type';

export default class Transport extends Subject<EventMessage> {
    // Service url
    public host: string;
    // Wasm file is loaded or not
    public wasmLoaded: boolean;
    // Subject for connection status stream
    public connectionStatus$: Subject<boolean>;

    constructor(host: string) {
        super();
        this.host = host;
        this.wasmLoaded = false;
        this.connectionStatus$ = new Subject<boolean>();
    }

    /**
     * Function to handle response for given event from server
     *
     * @param event name of the event
     * @param cb is the function executed when the events 'connected' and 'closed' occur
     *
     * @private
     */
    on<T>(event: string, cb: (data: T) => void) {
        if (event === 'connected' || event === 'closed') {
            this.connectionStatus$
                .pipe(
                    distinctUntilChanged(),
                    filter(isConnected => {
                        return (
                            (isConnected && event === 'connected') ||
                            (!isConnected && event === 'closed')
                        );
                    })
                )
                .subscribe((isConnected: any) => {
                    cb(isConnected);
                });
        } else {
            this.pipe(
                filter((message: any): boolean => {
                    return (
                        message.event && message.event === event && message.data
                    );
                })
            ).subscribe({
                next: (message: EventMessage): void => cb(message.data),
                error: () => undefined,
                complete: (): void => {},
            });
        }
    }

    /**
     * Same as the `on` method, returns an observable response
     *
     * @param event name of the event
     *
     * @return {Observable<T>}
     */
    on$<T>(event: string): Observable<T> {
        return this.pipe(
            filter((message: any): boolean => {
                return message.event && message.event === event && message.data;
            }),
            map(_ => _.data)
        );
    }

    /**
     * Function for sending data to the server
     *
     * @param _event name of the event
     * @param _data
     */
    send<T>(_event: string, _data: T) {}

    /**
     * Enter a room
     *
     * @param roomName name of the room
     *
     * @return {IPresence}
     */
    toRoom(roomName: string): IPresence {
        this.send('TOROOM', roomName);
        return this;
    }

    /**
     * Function for sending data streams to the server
     *
     * @param roomName name of the room
     * @param event name of the event
     *
     * @return (data: any) => void
     */
    ofRoom(roomName: string, event: string) {
        this.toRoom(roomName);
        return (data: any) => {
            this.send(event, data);
        };
    }

    /**
     * Clean up
     */
    close() {}
}
