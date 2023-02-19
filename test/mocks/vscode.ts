import { Memento } from "vscode";

/**
 * Creates a new 'vscode.Memento' mock object wrapping a 'Map' object.
 */
export function createMementoMock(cache = new Map<string, unknown>()): Memento {
    const mementoObject: Memento = {
        keys: function (): readonly string[] {
            const returnValue: string[] = [];

            for(const key in cache.keys)
            {
                returnValue.push(key);
            }

            return returnValue
        },
        get: function <T>(key: string, defaultValue?: T): T | undefined {            
            return <T>cache.get(key) || defaultValue;
        },
        update: async function (key: string, value: unknown): Promise<void> {
            cache.set(key, value);
        }
    }

    return mementoObject;
}