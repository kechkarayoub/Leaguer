
import 'firebase_options.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:frontend/l10n/l10n.dart';
import 'package:frontend/pages/dashboard/dashboard.dart';
import 'package:frontend/pages/sign_in_up/sign_in_page.dart';
import 'package:frontend/pages/sign_in_up/sign_up_page.dart';
import 'package:frontend/storage/storage.dart';
import 'package:frontend/utils/utils.dart';

void main() async {
  await dotenv.load(fileName: ".env");
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform,);
  WidgetsFlutterBinding.ensureInitialized();
  final l10n = L10n();
  await l10n.loadTranslations();
  StorageService storageService = StorageService();
  // var currentLanguage = await storageService.get("current_language");
  runApp(MyApp(l10n: l10n, /*currentLanguage: currentLanguage,*/ storageService: storageService,));
}

class MyApp extends StatelessWidget {
  final L10n l10n;
  // final String currentLanguage;
  final StorageService storageService;
  const MyApp({super.key, required this.l10n/*, required this.currentLanguage*/, required this.storageService});

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
              body: child,
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
          home: userSession != null ? DashboardPage(l10n: l10n, userSession: userSession, storageService: storageService) : SignInPage(l10n: l10n, storageService: storageService),
          routes: {
            DashboardPage.routeName: (context) => DashboardPage(l10n: l10n, userSession: userSession, storageService: storageService),
            SignInPage.routeName: (context) => SignInPage(l10n: l10n, storageService: storageService),
            SignUpPage.routeName: (context) => SignUpPage(l10n: l10n, storageService: storageService),
          },
        );
      },
    );
  }
}
