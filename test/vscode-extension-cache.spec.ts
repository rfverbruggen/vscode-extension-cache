import { VSCodeExtensionCache, CacheEntry } from "../src/vscode-extension-cache";
import * as vscode from 'vscode';
import assert from 'assert';
import { createMementoMock } from "./mocks/vscode";

describe('VSCode Extension Cache Test Suite', () => {

    describe('Constructor', () => {
        it('Stores the default namespace when not defined.', () => {
            // Arrange and Act.
            const mementoObject: vscode.Memento = createMementoMock();

            const cache = new VSCodeExtensionCache(mementoObject);

            // Assert.
            assert.strictEqual(cache.namespace, 'cache');
        });

        it('Stores a given namespace.', () => {
            // Arrange and Act.
            const mementoObject: vscode.Memento = createMementoMock();

            const cache = new VSCodeExtensionCache(mementoObject, 'test_cache');

            // Assert.
            assert.strictEqual(cache.namespace, 'test_cache');
        });
    });

    describe('Get', () => {
        it('Returns undefined when a non-existing key is requested.', () => {
            // Arrange.
            const mementoObject: vscode.Memento = createMementoMock();

            const cache = new VSCodeExtensionCache(mementoObject);

            // Act.
            const value = cache.get<string>('non-existing-key');

            // Assert.
            assert.strictEqual(value, undefined);
        });

        it('Returns the cached value when an existing key is requested.', () => {
            // Arrange.
            const expectedKey = 'existing-key';
            const expectedValue = 'existing-value';

            const cacheEntry = {
                value: expectedValue
            }
            const extensionCache = new Map<string, CacheEntry>();
            extensionCache.set(expectedKey, cacheEntry)

            const mementoEntry = new Map<string, unknown>();
            mementoEntry.set('cache', extensionCache);

            const mementoObject: vscode.Memento = createMementoMock(mementoEntry);

            const cache = new VSCodeExtensionCache(mementoObject);

            // Act.
            const value = cache.get<string>(expectedKey);

            // Assert.
            assert.strictEqual(value, expectedValue);
        });

        it('Returns the cached value when a non-expired key is requested.', () => {
            // Arrange.
            const expectedKey = 'existing-key';
            const expectedValue = 'existing-value';

            const cacheEntry: CacheEntry = {
                value: expectedValue,
                expiration: 253402300799 // 12/31/9999 23:59
            }
            const extensionCache = new Map<string, CacheEntry>();
            extensionCache.set(expectedKey, cacheEntry)

            const mementoEntry = new Map<string, unknown>();
            mementoEntry.set('cache', extensionCache);

            const mementoObject: vscode.Memento = createMementoMock(mementoEntry);

            const cache = new VSCodeExtensionCache(mementoObject);

            // Act.
            const value = cache.get<string>(expectedKey);

            // Assert.
            assert.strictEqual(value, expectedValue);
        });

        it('Returns undefined when an expired key is requested.', () => {
            // Arrange.
            const expectedKey = 'existing-key';
            const expectedValue = 'existing-value';

            const cacheEntry: CacheEntry = {
                value: expectedValue,
                expiration: 0 // 01/01/1970 12:00:00 AM
            }
            const extensionCache = new Map<string, CacheEntry>();
            extensionCache.set(expectedKey, cacheEntry)

            const mementoEntry = new Map<string, unknown>();
            mementoEntry.set('cache', extensionCache);

            const mementoObject: vscode.Memento = createMementoMock(mementoEntry);

            const cache = new VSCodeExtensionCache(mementoObject);

            // Act.
            const value = cache.get<string>(expectedKey);

            // Assert.
            assert.strictEqual(value, undefined);
        });
    });

    describe('Set', () => {
        it('Stores a non-expiring value in the local and global cache.', () => {
            // Arrange.
            const key = 'existing-key';
            const value = 'existing-value';

            const extensionCache = new Map<string, CacheEntry>();

            const mementoEntry = new Map<string, unknown>();
            mementoEntry.set('cache', extensionCache);

            const mementoObject: vscode.Memento = createMementoMock(mementoEntry);

            const cache = new VSCodeExtensionCache(mementoObject);

            // Act.
            cache.set(key, value);

            // Assert.
            // Assert that the value is stored in the local cache.
            assert.strictEqual(cache.get<string>(key), value);

            // Assert that the value is stored in the global cache.
            assert.strictEqual(extensionCache.has(key), true);
            assert.strictEqual(extensionCache.get(key)?.value, value);
            assert.strictEqual(extensionCache.get(key)?.expiration, undefined);
        });

        it('Stores an expiring value in the local and global cache.', () => {
            // Arrange.
            const key = 'existing-key';
            const value = 'existing-value';
            const expiration = 60 * 60 * 24; // seconds * minutes * hours (expire in 24 hours)

            const extensionCache = new Map<string, CacheEntry>();

            const mementoEntry = new Map<string, unknown>();
            mementoEntry.set('cache', extensionCache);

            const mementoObject: vscode.Memento = createMementoMock(mementoEntry);

            const cache = new VSCodeExtensionCache(mementoObject);

            // Act.
            cache.set(key, value, expiration);

            // Assert.
            // Assert that the value is stored in the local cache.
            assert.strictEqual(cache.get<string>(key), value);

            // Assert that the value is stored in the global cache.
            assert.strictEqual(extensionCache.has(key), true);
            assert.strictEqual(extensionCache.get(key)?.value, value);
            // Expiration is based on Now() thus only check if it is in the future.
            assert.strictEqual(extensionCache.get(key)?.expiration || 0 > Math.floor(new Date().getTime() / 1000.0), true);
        });
    });
});