import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:frontend/components/connection_status_bar.dart';
import 'package:frontend/components/wakelock_service.dart';
import 'package:frontend/l10n/l10n.dart';
import 'package:frontend/pages/dashboard/dashboard.dart';
import 'package:frontend/pages/sign_in_up/sign_in_page.dart';
import 'package:frontend/pages/sign_in_up/sign_up_page.dart';
import 'package:frontend/storage/storage.dart';
import 'package:frontend/utils/utils.dart';

/// Enables platform override for desktop (Windows/Linux) to use Fuchsia as the target platform.
void enablePlatformOverrideForDesktop() {
  if (!kIsWeb && (Platform.isWindows || Platform.isLinux)) {
    debugDefaultTargetPlatformOverride = TargetPlatform.fuchsia;
  }
}

/// Main entry point of the application.
void main() async {

  // Load environment variables from .env file
  await dotenv.load(fileName: ".env");

  bool iskTestMode = (dotenv.env['IS_TEST'] ?? 'false') == "true";
  if (!iskTestMode) { // If is test mode; do not execute enablePlatformOverrideForDesktop.
    // Enable platform override for desktop
    enablePlatformOverrideForDesktop();
  }

  // Ensure Flutter binding is initialized
  WidgetsFlutterBinding.ensureInitialized();

  // Load translations for localization
  final l10n = L10n();
  await l10n.loadTranslations();

  // Initialize storage services
  final SecureStorageService secureStorageService = SecureStorageService();
  StorageService storageService = StorageService();
  // var currentLanguage = await storageService.get("current_language");

  // Run the application
  runApp(
    MyApp(
      l10n: l10n, 
      storageService: storageService, 
      secureStorageService: secureStorageService,
    ),
  );
}

/// The root widget of the application.
class MyApp extends StatelessWidget {
  final L10n l10n;
  // final String currentLanguage;
  final SecureStorageService secureStorageService;
  final StorageService storageService;
  final WakelockService? wakelockService;
  const MyApp({
      super.key, required this.l10n, required this.storageService, required this.secureStorageService, this.wakelockService
    });

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<dynamic>(
      valueListenable: storageService.storageNotifier,
      builder: (context, storage, _) {
        //logMessage(storage);
        // Retrieve user session and current language from storage
        dynamic userSession = storage['user'];
        String currentLanguage = storage['current_language'] ?? defaultLanguage;
        String appName = dotenv.env['APP_NAME'] ?? 'App';
        return MaterialApp(
          builder: (context, child) {
            return Scaffold(
              appBar: AppBar(
                title: Text(appName),
              ),
              body: ConnectionStatusWidget(l10n: l10n, wakelockService: wakelockService, child: child!,),
            );
          },
          // Show debug banner only in development mode
          debugShowCheckedModeBanner: dotenv.env['PIPLINE'] == "development",
          // Set the app's locale
          locale: Locale(currentLanguage), // Default language
          // Localization delegates
          localizationsDelegates: [
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          // Supported locales
          supportedLocales: l10n.supportedLocales,
          title: appName,
          theme: ThemeData(
            primarySwatch: Colors.blue,
          ),
          // Home page based on user session
          home: userSession != null 
            ? DashboardPage(
              l10n: l10n, userSession: userSession, storageService: storageService, secureStorageService: secureStorageService
            ) 
            : SignInPage(l10n: l10n, storageService: storageService, secureStorageService: secureStorageService),
          // Route configurations
          routes: {
            DashboardPage.routeName: (context) => DashboardPage(
              l10n: l10n, userSession: userSession, storageService: storageService, secureStorageService: secureStorageService
            ),
            SignInPage.routeName: (context) => SignInPage(
              l10n: l10n, storageService: storageService, secureStorageService: secureStorageService
            ),
            SignUpPage.routeName: (context) => SignUpPage(
              l10n: l10n, storageService: storageService, secureStorageService: secureStorageService
            ),
          },
        );
      },
    );
  }
}
