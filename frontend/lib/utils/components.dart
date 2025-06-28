
import 'package:flutter/material.dart';
import 'package:frontend/l10n/l10n.dart';
import 'package:frontend/l10n/language_picker.dart';
import 'package:frontend/pages/profile/profile.dart';
import 'package:frontend/storage/storage.dart';
import 'package:frontend/utils/utils.dart';
import 'package:go_router/go_router.dart';


/// Renders a Drawer menu with the ability to log out and select a language.
/// 
/// The Drawer includes a header showing a translated "Menu" text, 
/// and a "Logout" option that clears the user session from storage.
///
/// [l10n] - Localization service for translating text.
/// [secureStorageService] - Service used to manage storage operations.
/// [storageService] - Service used to manage storage operations.
/// [context] - The build context for navigation.
Drawer renderDrawerMenu(L10n l10n, StorageService storageService, SecureStorageService secureStorageService, BuildContext context){
  final String currentLanguage = Localizations.localeOf(context).languageCode;
  return Drawer(
    child: ListView(
      padding: EdgeInsets.zero,
      children: <Widget>[
        _buildDrawerHeader(l10n, currentLanguage),
        _buildProfileTile(l10n, currentLanguage, context),
        _buildLogoutTile(l10n, currentLanguage, storageService, secureStorageService, context),
      ],
    ),
  );
}


/// Helper method to build the profile ListTile in the Drawer.
ListTile _buildProfileTile(L10n l10n, String currentLanguage, BuildContext context) {
  return ListTile(
    leading: Icon(Icons.person),
    title: Text(l10n.translate("Profile", currentLanguage)),
    onTap: () {
      Navigator.pop(context); // Close the drawer
      context.go(ProfilePage.routeName);
    },
  );
}


/// Helper method to build the Drawer header widget.
Widget _buildDrawerHeader(L10n l10n, String currentLanguage) {
  return DrawerHeader(
    decoration: BoxDecoration(
      color: Colors.blue,
    ),
    child: Text(
      l10n.translate("Menu", currentLanguage), // Translating the "Menu" label
      style: TextStyle(
        color: Colors.white,
        fontSize: 24,
      ),
    ),
  );
}

/// Helper method to build the logout ListTile in the Drawer.
ListTile _buildLogoutTile(L10n l10n, String currentLanguage, StorageService storageService, SecureStorageService secureStorageService, BuildContext context) {
  return ListTile(
    leading: Icon(Icons.logout),
    title: Text(l10n.translate("Logout", currentLanguage)), // Translating the "Logout" label
    onTap: () async{
      await logout(storageService, secureStorageService, context); // Handle logout action
    },
  );
}


/// Renders an IconButton for showing the language picker dialog.
///
/// [l10n] - Localization service for translating text.
/// [storageService] - Service used to manage storage operations.
/// [context] - The build context for showing the dialog.
IconButton renderLanguagesIcon(L10n l10n, StorageService storageService, BuildContext context){
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

