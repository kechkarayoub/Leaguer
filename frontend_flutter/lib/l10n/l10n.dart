import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:frontend_flutter/utils/utils.dart';

/// Localization class to manage translations in the app.
class L10n {

  /// Map containing translations: { 'key': { 'en': 'Hello', 'fr': 'Bonjour', 'ar': 'marhaban' } }
  late Map<String, Map<String, String>> _translations;

  /// Singleton pattern to ensure only one instance of L10n exists.
  static final L10n _instance = L10n._internal();
  factory L10n() => _instance;

  L10n._internal();

  /// List of supported locales
  List<Locale> get supportedLocales => [
    Locale('en'),
    Locale('ar'),
    Locale('fr'),
  ];

  /// Loads translations from a JSON file.
  Future<void> loadTranslations() async {
    try {
      String data = await rootBundle.loadString('lib/l10n/translations.json');
      Map<String, dynamic> decodedData = json.decode(data);
      _translations = decodedData.map((key, value) {
        return MapEntry(key, Map<String, String>.from(value));
      });
    } catch (e) {
      logMessage("Failed to load translations: $e", "", "e");
      _translations = {}; // Avoid errors if loading fails
    }
  }

  /// Translate a key to the appropriate language
  /// If the translation is not found, it logs a message and returns the key itself.
  String translate(String key, String locale) {
    if (_translations.containsKey(key)) {
      final Map<String, String> translationsForKey = _translations[key]!;
      if (translationsForKey.containsKey(locale)) {
        return translationsForKey[locale]!;
      }
      else{
        logMessage("Needed translation for the key: $key", "", "w");
      }
    }
    // If translation not found, return the key itself
    return key;
  }

  /// Retrieves the current locale from the app's context.
  static Locale getCurrentLocale(BuildContext context) {
    return Localizations.localeOf(context);
  }

  /// Retrieves the translation based on the current context.
  String translateFromContext(BuildContext context, String key) {
    String locale = getCurrentLocale(context).languageCode;
    return translate(key, locale);
  }
}
