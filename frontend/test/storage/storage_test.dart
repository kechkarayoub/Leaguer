import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/storage/storage.dart';
import 'package:frontend/utils/utils.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
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
    await storageService.set(key: 'user', obj: {"id": 123}, updateNotifier: true);
    
    expect(storageService.storageNotifier.value['user'], {"id": 123});
  });
}
