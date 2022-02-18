export type EventMessage = {
    event: string;
    data: any;
};

export interface PresenceOption {
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
