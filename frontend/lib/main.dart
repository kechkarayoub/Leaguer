
import 'firebase_options.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:frontend/components/connection_status_bar.dart';
import 'package:frontend/l10n/l10n.dart';
import 'package:frontend/pages/dashboard/dashboard.dart';
import 'package:frontend/pages/sign_in_up/sign_in_page.dart';
import 'package:frontend/pages/sign_in_up/sign_up_page.dart';
import 'package:frontend/storage/storage.dart';
import 'package:frontend/utils/utils.dart';

import 'package:flutter/foundation.dart';

import 'dart:io';

void _enablePlatformOverrideForDesktop() {
  if (!kIsWeb && (Platform.isWindows || Platform.isLinux)) {
    debugDefaultTargetPlatformOverride = TargetPlatform.fuchsia;
  }
}
void main() async {
  _enablePlatformOverrideForDesktop();
  await dotenv.load(fileName: ".env");
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform,);
  WidgetsFlutterBinding.ensureInitialized();
  final l10n = L10n();
  await l10n.loadTranslations();
  final SecureStorageService secureStorageService = SecureStorageService();
  StorageService storageService = StorageService();
  // var currentLanguage = await storageService.get("current_language");
  runApp(
    MyApp(
      l10n: l10n, 
      storageService: storageService, 
      secureStorageService: secureStorageService,
    ),
  );
}

class MyApp extends StatelessWidget {
  final L10n l10n;
  // final String currentLanguage;
  final SecureStorageService secureStorageService;
  final StorageService storageService;
  const MyApp({
      super.key, required this.l10n, required this.storageService, required this.secureStorageService,
    });

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<dynamic>(
      valueListenable: storageService.storageNotifier,
      builder: (context, storage, _) {
        //logMessage(storage);
        dynamic userSession = storage['user'];
        String currentLanguage = storage['current_language'] ?? defaultLanguage;
        String appName = dotenv.env['APP_NAME'] ?? 'App';
        return MaterialApp(
          builder: (context, child) {
            return Scaffold(
              appBar: AppBar(
                title: Text(appName),
              ),
              body: ConnectionStatusWidget(l10n: l10n, child: child!),
            );
          },
          debugShowCheckedModeBanner: dotenv.env['PIPLINE'] == "development", // Supprimer la bannière DEBUG
          locale: Locale(currentLanguage), // Default language
          localizationsDelegates: [
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: l10n.supportedLocales,
          title: appName,
          theme: ThemeData(
            primarySwatch: Colors.blue,
          ),
          home: userSession != null ? DashboardPage(l10n: l10n, userSession: userSession, storageService: storageService, secureStorageService: secureStorageService) : SignInPage(l10n: l10n, storageService: storageService, secureStorageService: secureStorageService),
          routes: {
            DashboardPage.routeName: (context) => DashboardPage(l10n: l10n, userSession: userSession, storageService: storageService, secureStorageService: secureStorageService),
            SignInPage.routeName: (context) => SignInPage(l10n: l10n, storageService: storageService, secureStorageService: secureStorageService),
            SignUpPage.routeName: (context) => SignUpPage(l10n: l10n, storageService: storageService, secureStorageService: secureStorageService),
          },
        );
      },
    );
  }
}
