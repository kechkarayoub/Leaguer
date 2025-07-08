import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/storage/storage.dart';
import 'package:frontend/utils/utils.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Generate Mock
@GenerateMocks([FlutterSecureStorage])
import 'storage_test.mocks.dart';

void main() {
  group('StorageService', () {
    late StorageService storageService;

    setUp(() async {
      SharedPreferences.setMockInitialValues({}); // Reset mock storage before each test
      storageService = StorageService();
      await storageService.clear(); // Ensure storage is clean before testing
    });

    test('Initial storage state not empty', () async {
      final currentLanguage = await storageService.get('current_language');
      final userSession = await storageService.get('user');
      expect(currentLanguage, defaultLanguage);
      expect(userSession, null);
    });

    test('Saving and retrieving a value works correctly', () async {
      await storageService.set(key: 'user', obj: {"id": 123, "name": "Ayoub"});
      final result = await storageService.get('user');
      
      expect(result, {"id": 123, "name": "Ayoub"});
    });

    test('Retrieving a non-existent key returns null', () async {
      final result = await storageService.get('unknown_key');
      expect(result, null);
    });

    test('Retrieving "current_language" defaults to the app\'s default language', () async {
      final result = await storageService.get('current_language');
      expect(result, defaultLanguage);
    });

    test('Removing a key deletes the stored value', () async {
      await storageService.set(key: 'user', obj: {"id": 123});
      await storageService.remove(key: 'user');
      final result = await storageService.get('user');
      
      expect(result, null);
    });

    test('Clearing storage removes all values (without notifier update)', () async {
      await storageService.set(key: 'user', obj: {"id": 123});
      await storageService.clear();
      
      final currentLanguage = await storageService.get('current_language');
      final userSession = await storageService.get('user');
      expect(currentLanguage, defaultLanguage);
      expect(userSession, null);
    });

    test('StorageNotifier updates when a value is changed', () async {
      await storageService.set(key: 'user', obj: {"id": 199}, updateNotifier: true);
      expect(storageService.storageNotifier.value['user'], {"id": 199});
      await storageService.set(key: 'user', obj: {"id": 188}, updateNotifier: true, notifierToUpdate: "all");
      expect(storageService.storageNotifier.value['user'], {"id": 188});
      await storageService.set(key: 'user', obj: {"id": 177}, updateNotifier: true, notifierToUpdate: "storage");
      expect(storageService.storageNotifier.value['user'], {"id": 177});
    });
  });

  group('SecureStorageService', () {
    late SecureStorageService secureStorageService;
    late MockFlutterSecureStorage mockStorage;

    setUp(() async {
    mockStorage = MockFlutterSecureStorage();
    secureStorageService = SecureStorageService(storage: mockStorage);
    });

    test('Should save and get tokens securely', () async {
      // Ensure initial values are null
      when(mockStorage.read(key: 'access_token')).thenAnswer((_) async => null);
      when(mockStorage.read(key: 'refresh_token')).thenAnswer((_) async => null);

      expect(await secureStorageService.getAccessToken(), isNull);
      expect(await secureStorageService.getRefreshToken(), isNull);

      // Mock write operations
      when(mockStorage.write(key: 'access_token', value: 'access123'))
          .thenAnswer((_) async => {});
      when(mockStorage.write(key: 'refresh_token', value: 'refresh456'))
          .thenAnswer((_) async => {});

      await secureStorageService.saveTokens('access123', 'refresh456');

      verify(mockStorage.write(key: 'access_token', value: 'access123')).called(1);
      verify(mockStorage.write(key: 'refresh_token', value: 'refresh456')).called(1);

      // Mock read operations after saving
      when(mockStorage.read(key: 'access_token'))
          .thenAnswer((_) async => 'access123');
      when(mockStorage.read(key: 'refresh_token'))
          .thenAnswer((_) async => 'refresh456');

      expect(await secureStorageService.getAccessToken(), equals('access123'));
      expect(await secureStorageService.getRefreshToken(), equals('refresh456'));
    });

    test('Should clear tokens from secure storage', () async {
      when(mockStorage.delete(key: anyNamed('key'))).thenAnswer((_) async {null;});

      await secureStorageService.clearTokens();

      verify(mockStorage.delete(key: 'access_token')).called(1);
      verify(mockStorage.delete(key: 'refresh_token')).called(1);
    });

    test('Should store and retrieve generic values using set/get methods', () async {
      const testKey = 'test_key';
      const testValue = 'test_value';

      // // Mock write operation
      // when(mockStorage.write(key: testKey, value: testValue))
      //     .thenAnswer((_) async => {});

      await secureStorageService.set(key: testKey, value: testValue);

      verify(mockStorage.write(key: testKey, value: testValue)).called(1);

      // Mock read operation
      when(mockStorage.read(key: testKey))
          .thenAnswer((_) async => testValue);

      final result = await secureStorageService.get(key: testKey);

      verify(mockStorage.read(key: testKey)).called(1);
      expect(result, equals(testValue));
    });

    test('Should return null when getting non-existent key', () async {
      const nonExistentKey = 'non_existent_key';

      when(mockStorage.read(key: nonExistentKey))
          .thenAnswer((_) async => null);

      final result = await secureStorageService.get(key: nonExistentKey);

      verify(mockStorage.read(key: nonExistentKey)).called(1);
      expect(result, isNull);
    });

    test('Should remove generic values using remove method', () async {
      const testKey = 'test_key_to_remove';

      when(mockStorage.delete(key: testKey))
          .thenAnswer((_) async {});

      await secureStorageService.remove(key: testKey);

      verify(mockStorage.delete(key: testKey)).called(1);
    });

    test('Should clear generic values using deleteAll', () async {

      when(mockStorage.deleteAll())
          .thenAnswer((_) async {});

      await secureStorageService.clear();

      verify(mockStorage.deleteAll()).called(1);
    });

    test('Should handle multiple generic operations correctly', () async {
      const key1 = 'key1';
      const key2 = 'key2';
      const value1 = 'value1';
      const value2 = 'value2';

      // Mock write operations
      when(mockStorage.write(key: key1, value: value1))
          .thenAnswer((_) async => {});
      when(mockStorage.write(key: key2, value: value2))
          .thenAnswer((_) async => {});

      // Mock read operations
      when(mockStorage.read(key: key1))
          .thenAnswer((_) async => value1);
      when(mockStorage.read(key: key2))
          .thenAnswer((_) async => value2);

      // Set multiple values
      await secureStorageService.set(key: key1, value: value1);
      await secureStorageService.set(key: key2, value: value2);

      // Verify writes
      verify(mockStorage.write(key: key1, value: value1)).called(1);
      verify(mockStorage.write(key: key2, value: value2)).called(1);

      // Get multiple values
      final result1 = await secureStorageService.get(key: key1);
      final result2 = await secureStorageService.get(key: key2);

      // Verify reads
      verify(mockStorage.read(key: key1)).called(1);
      verify(mockStorage.read(key: key2)).called(1);

      expect(result1, equals(value1));
      expect(result2, equals(value2));

      // Mock delete operations
      when(mockStorage.delete(key: key1)).thenAnswer((_) async {});
      when(mockStorage.delete(key: key2)).thenAnswer((_) async {});

      // Remove one value
      await secureStorageService.remove(key: key1);
      verify(mockStorage.delete(key: key1)).called(1);

      // Verify key2 still exists by reading it
      final result2AfterDelete = await secureStorageService.get(key: key2);
      expect(result2AfterDelete, equals(value2));
    });

  });

}
