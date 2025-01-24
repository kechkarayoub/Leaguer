
import 'package:flutter/material.dart';
import 'package:frontend/l10n/l10n.dart';
import 'package:frontend/l10n/language_picker.dart';
import 'package:frontend/storage/storage.dart';
import 'package:frontend/utils/utils.dart';


Drawer renderDrawerMenu(L10n l10n, StorageService storageService, BuildContext context){
  /// Renders a Drawer menu.
  /// The Drawer menu includes a header displaying the translated "Menu" text
  /// and a logout option that clears the user session from storage.
  ///
  /// [l10n] - The localization service for translating text.
  /// [storageService] - The service used to manage storage operations.
  /// [context] - The build context used for navigation.
  return Drawer(
    child: ListView(
      padding: EdgeInsets.zero,
      children: <Widget>[
        DrawerHeader(
          decoration: BoxDecoration(
            color: Colors.blue,
          ),
          child: Text(
            l10n.translate("Menu", Localizations.localeOf(context).languageCode),
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
            ),
          ),
        ),
        ListTile(
          leading: Icon(Icons.exit_to_app),
          title: Text(l10n.translate("Logout", Localizations.localeOf(context).languageCode)),
          onTap: () {
            logout(storageService, context);
          },
        ),
      ],
    ),
  );
}

IconButton renderLanguagesIcon(L10n l10n, StorageService storageService, BuildContext context){
  /// Renders an IconButton that shows a language picker dialog.
  ///
  /// When pressed, the IconButton shows a dialog for selecting the app language.
  ///
  /// [l10n] - The localization service for translating text.
  /// [storageService] - The service used to manage storage operations.
  /// [context] - The build context used for showing the dialog.
  return IconButton(
    icon: Icon(Icons.language),
    onPressed: () {
      showDialog(
        context: context,
        builder: (BuildContext context) {
          return LanguagePickerDialog(l10n: l10n, storageService: storageService);
        },
      );
    },
  );
}
