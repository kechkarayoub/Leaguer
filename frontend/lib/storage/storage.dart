import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:frontend/utils/utils.dart';
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
    _initStorageNotifier();
  }

  /// Updates the notifier with the current stored values.
  Future<void> _updateNotifier() async {
    try {
      // Introduce a delay to debounce multiple updates within a short time
      await Future.delayed(Duration(milliseconds: 500));
      var state = {
        "current_language": await get("current_language"),
        "user": await get("user"),
      };
      _storageNotifier.value = state; // Notify listeners of the new state.
    } 
    catch (e) {
      debugPrint("Error updating storage notifier: $e");
    }
  }

  /// Initializes the storage notifier with existing stored values.
  Future<void> _initStorageNotifier() async {
    await _updateNotifier();
  }

  /// Clears all stored data and updates the notifier if required.
  Future<void> clear({bool updateNotifier=true}) async {
    try{
      final prefs = await SharedPreferences.getInstance();
      await prefs.clear();
      if (updateNotifier) {
        await _updateNotifier();
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
  Future<void> remove({required String key, bool updateNotifier=false}) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(key);
      if(updateNotifier){
        await _updateNotifier();
      }
    } 
    catch (e) {
      debugPrint("Error removing key [$key]: $e");
    }
  }

  /// Stores a value under a given key and updates the notifier if required.
  Future<void> set({required String key, required dynamic obj, bool updateNotifier=false}) async {
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
        await _updateNotifier();
      }
    } 
    catch (e) {
      debugPrint("Error saving key [$key]: $e");
    }
  }
  
  /// Provides access to the storage notifier to track storage changes.
  ValueNotifier<dynamic> get storageNotifier => _storageNotifier;
  
}
