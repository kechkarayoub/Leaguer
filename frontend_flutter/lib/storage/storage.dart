import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:frontend_flutter/utils/utils.dart';
import 'package:shared_preferences/shared_preferences.dart';



/// A service for managing local storage using SharedPreferences.
/// It supports saving, retrieving, and notifying the app of changes.
class StorageService {
  /// Notifier to track storage changes and refresh the app state.
  final ValueNotifier<dynamic> _storageNotifier = ValueNotifier<dynamic>({});

  static final StorageService _instance = StorageService._internal();

  /// Factory constructor for singleton.
  factory StorageService() => _instance;

  /// Private constructor for singleton pattern.
  StorageService._internal() {
    _initStorages();
  }

  /// Updates the notifier with the current stored values.
  Future<void> _updateNotifier({String notifierToUpdate = "storage"}) async {
    try {
      // Introduce a delay to debounce multiple updates within a short time
      await Future.delayed(Duration(milliseconds: 500));
      var state = {
        "current_language": await get("current_language"),
        "user": await get("user"),
      };
      if (notifierToUpdate == "all" || notifierToUpdate == "storage") {
        _storageNotifier.value = state; // Notify listeners of the new state.
      } 
    } 
    catch (e) {
      debugPrint("Error updating storage notifier: $e");
    }
  }

  /// Initializes the storages notifier.
  Future<void> _initStorages() async {
    await _updateNotifier(notifierToUpdate: "all");
  }

  /// Clears all stored data and updates the notifier if required.
  Future<void> clear({bool updateNotifier=true, String notifierToUpdate = "storage"}) async {
    try{
      final prefs = await SharedPreferences.getInstance();
      await prefs.clear();
      if (updateNotifier) {
        await _updateNotifier(notifierToUpdate: notifierToUpdate);
      }
    } 
    catch (e) {
      debugPrint("Error clearing storage: $e");
    }
  }

  /// Retrieves a stored value by its key.
  /// If the key is "current_language" and not found, returns the default language.
  Future<dynamic> get(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      String objString = prefs.getString(key) ?? "";
      if(objString.isEmpty){
        if(key == "current_language"){
          return defaultLanguage;
        }
        return null;
      } 
      try{
        return jsonDecode(objString);
      }
      catch (e) {
        return objString;
      } 
    } 
    catch (e) {
      debugPrint("Error retrieving key [$key]: $e");
      return null;
    }
  }
  /// Removes a stored value by its key and updates the notifier if required.
  Future<void> remove({required String key, bool updateNotifier=false, String notifierToUpdate = "storage"}) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(key);
      if(updateNotifier){
        await _updateNotifier(notifierToUpdate: notifierToUpdate);
      }
    } 
    catch (e) {
      debugPrint("Error removing key [$key]: $e");
    }
  }

  /// Stores a value under a given key and updates the notifier if required.
  Future<void> set({required String key, required dynamic obj, bool updateNotifier=false, String notifierToUpdate = "storage"}) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      String objString = "";
      if (obj is String) {
        objString = obj;
      } 
      else if(obj != null){
        objString = jsonEncode(obj);
      }
      await prefs.setString(key, objString);
      if(updateNotifier){
        await _updateNotifier(notifierToUpdate: notifierToUpdate);
      }
    } 
    catch (e) {
      debugPrint("Error saving key [$key]: $e");
    }
  }
  
  /// Provides access to the storages notifier to track storage changes.
  ValueNotifier<dynamic> get storageNotifier => _storageNotifier;
  
}



/// A service for managing local secure storage using FlutterSecureStorage.
/// It supports saving, retrieving, and notifying the app of changes.
class SecureStorageService {
    // 🔹 Private constructor
  SecureStorageService._privateConstructor({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  // 🔹 Singleton instance
  static final SecureStorageService _instance = SecureStorageService._privateConstructor();

  // 🔹 Factory constructor
  factory SecureStorageService({FlutterSecureStorage? storage}) {
    if (storage != null) {
      return SecureStorageService._privateConstructor(storage: storage);
    }
    return _instance;
  }

  // 🔹 Secure Storage Instance
  final FlutterSecureStorage _storage;

  // Save tokens securely
  Future<void> saveTokens(String accessToken, String refreshToken) async {
    await _storage.write(key: 'access_token', value: accessToken);
    await _storage.write(key: 'refresh_token', value: refreshToken);
  }

  // Retrieve access token
  Future<String?> getAccessToken() async {
    return await _storage.read(key: 'access_token');
  }

  // Retrieve refresh token
  Future<String?> getRefreshToken() async {
    return await _storage.read(key: 'refresh_token');
  }

  // Delete tokens (e.g., during logout)
  Future<void> clearTokens() async {
    await _storage.delete(key: 'access_token');
    await _storage.delete(key: 'refresh_token');
  }

  // Generic read method
  Future<String?> get({required String key}) async {
    return await _storage.read(key: key);
  }

  // Generic write method
  Future<void> set({required String key, required String value}) async {
    await _storage.write(key: key, value: value);
  }

  // Generic write method
  Future<void> remove({required String key}) async {
    await _storage.delete(key: key);
  }

  // Generic write method
  Future<void> clear() async {
    await _storage.deleteAll();
  }
}

