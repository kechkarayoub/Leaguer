import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:frontend/api/unauthenticated_api_service.dart';
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
  if(kIsWeb){
    await Firebase.initializeApp(
      options: FirebaseOptions(
        apiKey: dotenv.env['FIREBASE_WEB_API_KEY']??"",
        authDomain: dotenv.env['FIREBASE_WEB_AUTH_DOMAIN'],
        projectId: dotenv.env['FIREBASE_WEB_PROJECT_ID']??"",
        storageBucket: dotenv.env['FIREBASE_WEB_STORAGE_BUCKET'],
        messagingSenderId: dotenv.env['FIREBASE_WEB_MESSAGING_SENDER_ID']??"",
        appId: dotenv.env['FIREBASE_WEB_APP_ID']??"",
        measurementId: dotenv.env['FIREBASE_WEB_MEASUREMENT_ID'],
      ),
    );
  }
  else{
    await Firebase.initializeApp();
  }

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
  final ThirdPartyAuthService? thirdPartyAuthService;
  const MyApp({
      super.key, required this.l10n, required this.storageService, required this.secureStorageService, this.wakelockService, this.thirdPartyAuthService
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
            : SignInPage(l10n: l10n, storageService: storageService, secureStorageService: secureStorageService, thirdPartyAuthService: thirdPartyAuthService),
          // Route configurations
          routes: {
            DashboardPage.routeName: (context) => DashboardPage(
              l10n: l10n, userSession: userSession, storageService: storageService, secureStorageService: secureStorageService
            ),
            SignInPage.routeName: (context) => SignInPage(
              l10n: l10n, storageService: storageService, secureStorageService: secureStorageService, thirdPartyAuthService: thirdPartyAuthService,
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
