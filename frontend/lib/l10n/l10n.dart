import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class L10n {

  late Map<String, Map<String, String>> _translations;

  L10n();

  // List of supported locales
  List<Locale> get supportedLocales => [
    Locale('en'),
    Locale('ar'),
    Locale('fr'),
  ];

  // Load translations from a JSON file
  Future<void> loadTranslations() async {
    String data = await rootBundle.loadString('lib/l10n/translations.json');
    Map<String, dynamic> decodedData = json.decode(data);
    _translations = decodedData.map((key, value) {
      return MapEntry(key, Map<String, String>.from(value));
    });
  }

  // Translate a key to the appropriate language
  String translate(String key, String locale) {
    if (_translations.containsKey(key)) {
      final Map<String, String> translationsForKey = _translations[key]!;
      if (translationsForKey.containsKey(locale)) {
        return translationsForKey[locale]!;
      }
      else{
        print("Needed translation for the key: $key");
      }
    }
    // If translation not found, return the key itself
    return key;
  }
}
