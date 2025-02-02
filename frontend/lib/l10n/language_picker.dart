import 'l10n.dart';
import 'package:flutter/material.dart';
import 'package:frontend/storage/storage.dart';

/// A dialog that allows users to select a language from the supported locales.
class LanguagePickerDialog extends StatelessWidget {

  final L10n l10n;
  final StorageService storageService;
  final VoidCallback? onLanguageSelected; // Callback for testing


  /// Creates a language picker dialog.
  /// 
  /// - [l10n]: The localization instance.
  /// - [storageService]: Service to persist language selection.
  /// - [onLanguageSelected]: Optional callback for testing language selection.
  const LanguagePickerDialog({super.key, required this.l10n, required this.storageService, this.onLanguageSelected,});

  @override
  Widget build(BuildContext context) {
    // Get the current language code from the context.
    final String currentLanguage = Localizations.localeOf(context).languageCode;
    return SimpleDialog(
      title: Text(l10n.translate("Select Language", currentLanguage)),
      children: [
        // List available languages dynamically.
        ...l10n.supportedLocales.map(
          (locale) => SimpleDialogOption(
            onPressed: () {
              try {
                // Save selected language in local storage.
                storageService.set(
                  key: "current_language",
                  obj: locale.toString(),
                  updateNotifier: true,
                );

                // Notify listeners (if needed, useful for testing).
                onLanguageSelected?.call();
                
                // Close the dialog.
                Navigator.pop(context);
              } catch (e) {
                debugPrint("Failed to save language: $e");
              }
            },
            child: Text(
              l10n.translate("language_${locale.languageCode}", currentLanguage),
            ),
          ),
        ),
      ],
    );
  }
}
