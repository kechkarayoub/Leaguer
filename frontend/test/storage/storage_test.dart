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
      await storageService.set(key: 'user', obj: {"id": 166}, updateNotifier: true, notifierToUpdate: "user_info");
      expect(storageService.storageNotifier.value['user'], {"id": 166});
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

  });

}
