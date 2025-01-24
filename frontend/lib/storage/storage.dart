import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:frontend/utils/utils.dart';
import 'package:shared_preferences/shared_preferences.dart';



class StorageService {
  final ValueNotifier<dynamic> _storageNotifier = ValueNotifier<dynamic>({}); // The notifier that will updated to refresh app

  StorageService(){
    _initStorageNotifier();
  }

  void _updateNotifier() async {
    var state = {
      "current_language": await get("current_language"),
      "user_session": await get("user_session"),
    };
    _storageNotifier.value = state; // refresh notifier with current storage
  }

  Future<void> _initStorageNotifier() async {
    _updateNotifier();
  }

  Future<void> clear({bool updateNotifier=true}) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    if (updateNotifier) {
      _updateNotifier();
    }
  }

  dynamic get(String key) async {
    final prefs = await SharedPreferences.getInstance();
    String objString = prefs.getString(key) ?? "";
    if(objString.isEmpty){
      if(key == "current_language"){
        return defaultLanguage;
      }
      return null;
    }
    return jsonDecode(objString);
  }
  void remove({required String key, bool updateNotifier=false}) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(key);
    if(updateNotifier){
      _updateNotifier();
    }
  }

  void set({required String key, required dynamic obj, bool updateNotifier=false}) async {
    final prefs = await SharedPreferences.getInstance();
    String objString = "";
    if(obj != null){
      objString = jsonEncode(obj);
    }
    await prefs.setString(key, objString);
    if(updateNotifier){
      _updateNotifier();
    }
  }
  
  ValueNotifier<dynamic> get storageNotifier => _storageNotifier;
  
}
