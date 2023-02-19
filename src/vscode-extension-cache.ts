import { Memento } from "vscode";

export type CacheEntry = {
    value: unknown;
    expiration?: number;
}

export class VSCodeExtensionCache {
    private mementoObject: Memento;
    public readonly namespace: string;
    private cache: Map<string, CacheEntry>;

    /**
     * Creates a VSCodeExtensionCache object to store and retrieve items in and from a Memento object and a local cache object.
     * @param mementoObject The Memento object where the cache is stored. 
     * @param namespace The namespace (key) of the cache object. If not specified the namespace 'cache' is used.
     */
    constructor(mementoObject: Memento, namespace?: string) {
        this.mementoObject = mementoObject;
        this.namespace = namespace || 'cache';
        this.cache = this.mementoObject.get(this.namespace, new Map<string, CacheEntry>());
    }

    /**
     * Returns a specified element from the Map object.
     * @param key The key of the element in the Map object.
     * @returns Returns the element associated with the specified key. If no element is associated with the specified key or the specified key is expired, undefined is returned.
     */
    get<T>(key: string): T | undefined {
        const cacheEntry = this.cache.get(key);

        if (cacheEntry === undefined || this.isExpired(cacheEntry)) {
            return undefined;
        }

        return <T>cacheEntry.value;
    }

    /**
     * Adds a new element with a specified key and value to the Map. If an element with the same key already exists, the element will be updated.
     * @param key The key of the element in the Map object.
     * @param value The value of the element in the Map object.
     * @param expiration (Optional) Expiration time in seconds.
     * @returns A Visual Studio Code Thenable Promise.
     */
    async set(key: string, value: unknown, expiration?: number): Promise<void> {
        const cacheEntry: CacheEntry = { value: value };

        if (expiration) {
            cacheEntry.expiration = this.now() + expiration;
        }

        // Save to local cache object
        this.cache.set(key, cacheEntry);

        // Save to extension's globalState
        return await this.mementoObject.update(this.namespace, this.cache);
    }

    private isExpired(cacheEntry: CacheEntry): boolean {
        // If the cacheEntry has no expiration set it is never expired.
        if (cacheEntry.expiration === undefined) {
            return false;
        }

        // Is expiration >= right now?
        return this.now() >= cacheEntry.expiration;
    }

    private now(): number {
        return Math.floor(new Date().getTime() / 1000.0) // The getTime method returns the time in milliseconds.
    }
}