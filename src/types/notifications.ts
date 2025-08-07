export interface Notification {
    id: string;
    type?: string | null;
    created_at?: string | null;
    title?: string | null;
    body?: string | null;
    listen_url?: string | null;
    payload?: any;
    call_id?: string | null;
    client_id?: string | null;
}