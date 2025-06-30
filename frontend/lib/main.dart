// Main entry point and app configuration for the Flutter application.
// Handles routing, localization, storage, and platform-specific setup.

import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'web_plugins_stub.dart' if (dart.library.html) 'package:flutter_web_plugins/flutter_web_plugins.dart' as url_strategy_web_plugins;
import 'package:frontend/api/unauthenticated_api_service.dart';
import 'package:frontend/components/app_splash_screen.dart';
import 'package:frontend/components/connection_status_bar.dart';
import 'package:frontend/components/custom_not_found_widget.dart';
import 'package:frontend/components/wakelock_service.dart';
import 'package:frontend/l10n/l10n.dart';
import 'package:frontend/pages/dashboard/dashboard.dart';
import 'package:frontend/pages/profile/profile.dart';
import 'package:frontend/pages/sign_in_up/sign_in_page.dart';
import 'package:frontend/pages/sign_in_up/sign_up_page.dart';
import 'package:frontend/storage/storage.dart';
import 'package:frontend/utils/platform_detector.dart';
import 'package:frontend/utils/utils.dart';
import 'package:go_router/go_router.dart';

/// Enables platform override for desktop (Windows/Linux) to use Fuchsia as the target platform.
void enablePlatformOverrideForDesktop(platform) {
  if (platform == PlatformType.desktop) {
    debugDefaultTargetPlatformOverride = TargetPlatform.fuchsia;
  }
}

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

/// Main entry point of the application.
void main() async {
  final platform = getPlatformType();
  // Only run setUrlStrategy on web to avoid test/VM errors
  url_strategy_web_plugins.setUrlStrategy(url_strategy_web_plugins.PathUrlStrategy()); // Use path-based URLs for web
  await dotenv.load(fileName: ".env"); // Load environment variables

  bool iskTestMode = (dotenv.env['IS_TEST'] ?? 'false') == "true";
  if (!iskTestMode) {
    // Enable platform override for desktop if not in test mode
    enablePlatformOverrideForDesktop(platform);
  }

  // Ensure Flutter binding is initialized
  WidgetsFlutterBinding.ensureInitialized();
  if(platform == PlatformType.web){
    // Initialize Firebase for web with environment variables
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
    // Initialize Firebase for mobile/desktop
    await Firebase.initializeApp();
  }

  // Load translations for localization
  final l10n = L10n();
  await l10n.loadTranslations();

  // Initialize storage services
  final SecureStorageService secureStorageService = SecureStorageService();
  StorageService storageService = StorageService();

  // Run the application
  runApp(
    MyApp(
      l10n: l10n, 
      storageService: storageService, 
      secureStorageService: secureStorageService,
    ),
  );
}

/// Creates a GoRouter for authenticated users with all main app routes.
GoRouter createAuthenticatedRouter(L10n l10n, dynamic storage, StorageService storageService, SecureStorageService secureStorageService, ThirdPartyAuthService? thirdPartyAuthService) {
  dynamic userSession = storage['user'];
  return GoRouter(
    navigatorKey: navigatorKey,
    routes: [
      // Dashboard/Home
      GoRoute(
        path: routeHome,
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          final arguments = extra?['arguments'] as Map<String, dynamic>?;
          return DashboardPage(
            l10n: l10n,
            userSession: userSession,
            storageService: storageService,
            secureStorageService: secureStorageService,
            arguments: arguments,
          );
        } 
      ),
      // Dashboard alias
      GoRoute(
        path: routeDashboard,
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          final arguments = extra?['arguments'] as Map<String, dynamic>?;
          return DashboardPage(
            l10n: l10n,
            userSession: userSession,
            storageService: storageService,
            secureStorageService: secureStorageService,
            arguments: arguments,
          );
        }
      ),
      // Profile
      GoRoute(
        path: routeProfile,
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          final arguments = extra?['arguments'] as Map<String, dynamic>?;
          return ProfilePage(
            l10n: l10n,
            userSession: userSession,
            storageService: storageService,
            secureStorageService: secureStorageService,
            providedContext: context,
            arguments: arguments,
          );
        }
      ),
      // Sign In
      GoRoute(
        path: routeSignIn,
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          final arguments = extra?['arguments'] as Map<String, dynamic>?;
          return SignInPage(
            l10n: l10n,
            storageService: storageService,
            secureStorageService: secureStorageService,
            thirdPartyAuthService: thirdPartyAuthService,
            arguments: arguments,
          );
        }
      ),
      // Sign Up
      GoRoute(
        path: routeSignUp,
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          final arguments = extra?['arguments'] as Map<String, dynamic>?;
          return SignUpPage(
            l10n: l10n,
            storageService: storageService,
            secureStorageService: secureStorageService,
            arguments: arguments,
          );
        }
      ),
    ],
    // Redirect all other routes to sign in
    redirect: (context, state) {
      // If not on routeSignIn or routeSignUp, always redirect to /sign-in
      if (state.uri.path == routeSignIn || state.uri.path == routeSignUp) {
        return routeHome;
      }
      return null;
    },
    // Custom error page for not found routes
    errorBuilder: (context, state) {
      final extra = state.extra as Map<String, dynamic>?;
      final arguments = extra?['arguments'] as Map<String, dynamic>?;
      return Scaffold(
        body: CustomNotFoundWidget(
          l10n: l10n,
          isLoggedIn: userSession != null,
          onHome: () => context.go(routeHome),
          onLogout: userSession != null
              ? () async {
                  await logout(storageService, secureStorageService, context);
                }
              : null,
          arguments: arguments,
        ),
      );
    }
  );
}

/// Creates a GoRouter for unauthenticated users (sign in/up only).
GoRouter createUnautenticatedRouter(L10n l10n, dynamic storage, StorageService storageService, SecureStorageService secureStorageService, ThirdPartyAuthService? thirdPartyAuthService) {
  return GoRouter(
    navigatorKey: navigatorKey,
    routes: [
      // Home redirects to sign in
      GoRoute(
        path: routeHome,
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          final arguments = extra?['arguments'] as Map<String, dynamic>?;
          return SignInPage(
            l10n: l10n,
            storageService: storageService,
            secureStorageService: secureStorageService,
            thirdPartyAuthService: thirdPartyAuthService,
            arguments:arguments
          );
        } 
      ),
      // Sign In
      GoRoute(
        path: routeSignIn,
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          final arguments = extra?['arguments'] as Map<String, dynamic>?;
          return SignInPage(
            l10n: l10n,
            storageService: storageService,
            secureStorageService: secureStorageService,
            thirdPartyAuthService: thirdPartyAuthService,
            arguments: arguments,
          );
        }
      ),
      // Sign Up
      GoRoute(
        path: routeSignUp,
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          final arguments = extra?['arguments'] as Map<String, dynamic>?;
          return SignUpPage(
            l10n: l10n,
            storageService: storageService,
            secureStorageService: secureStorageService,
            arguments: arguments,
          );
        }
      ),
    ],
    // Redirect all other routes to sign in
    redirect: (context, state) {
      // If not on routeSignIn or routeSignUp, always redirect to /sign-in
      if (state.uri.path != routeSignIn && state.uri.path != routeSignUp) {
        return routeSignIn;
      }
      return null;
    },
  );
}

/// Creates a GoRouter for the loading/splash state.
GoRouter createLoadingRouter(String appName) {
  return GoRouter(
    routes: [
      GoRoute(
        path: '/:rest*',
        builder: (context, state){
          final extra = state.extra as Map<String, dynamic>?;
          final arguments = extra?['arguments'] as Map<String, dynamic>?;
          return Scaffold(
            body: AppSplashScreen(appName: appName, arguments: arguments,),
          );
        }
      ),
    ],
    errorBuilder: (context, state){
      final extra = state.extra as Map<String, dynamic>?;
      final arguments = extra?['arguments'] as Map<String, dynamic>?;
      return Scaffold(
        body: AppSplashScreen(appName: appName, arguments: arguments,),
      );
    }
  );
}


/// The root widget of the application.
class MyApp extends StatefulWidget {
  final L10n l10n;
  final SecureStorageService secureStorageService;
  final StorageService storageService;
  final WakelockService? wakelockService;
  final ThirdPartyAuthService? thirdPartyAuthService;
  const MyApp({
    super.key,
    required this.l10n,
    required this.storageService,
    required this.secureStorageService,
    this.wakelockService,
    this.thirdPartyAuthService,
  });

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  GoRouter? _router;
  GoRouter? _loadingRouter;
  GoRouter? _authenticatedRouter;
  GoRouter? _unauthenticatedRouter;
  dynamic _lastUserSession;

  @override
  void initState() {
    super.initState();
    widget.storageService.storageNotifier.addListener(_onStorageChanged);
    _updateRouter();
  }

  void _onStorageChanged() {
    final storage = widget.storageService.storageNotifier.value;
    final userSession = storage?['user'];
    _lastUserSession = userSession;
    _updateRouter();
    setState(() {});
  }

  void _updateRouter() {
    final storage = widget.storageService.storageNotifier.value;
    final userSession = storage?['user'];
    _loadingRouter ??= createLoadingRouter(dotenv.env['APP_NAME'] ?? 'App');
    if (storage == null || storage.isEmpty) {
      _router = _loadingRouter;
    } 
    else if (userSession == null) {
      _unauthenticatedRouter ??= createUnautenticatedRouter(
        widget.l10n,
        storage,
        widget.storageService,
        widget.secureStorageService,
        widget.thirdPartyAuthService,
      );
      _router = _unauthenticatedRouter;
    } else {
      _authenticatedRouter ??= createAuthenticatedRouter(
        widget.l10n,
        storage,
        widget.storageService,
        widget.secureStorageService,
        widget.thirdPartyAuthService,
      );
      _router = _authenticatedRouter;
    }
  }

  @override
  void dispose() {
    widget.storageService.storageNotifier.removeListener(_onStorageChanged);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    String appName = dotenv.env['APP_NAME'] ?? 'App';
    final storage = widget.storageService.storageNotifier.value;
    final currentLanguage = storage?['current_language'] ?? defaultLanguage;
    return MaterialApp.router(
      restorationScopeId: _lastUserSession != null ? 'authenticated_app' : null,
      builder: (context, child) {
        return Scaffold(
          appBar: AppBar(
            title: Text(appName),
          ),
          body: ConnectionStatusWidget(
            l10n: widget.l10n,
            wakelockService: widget.wakelockService,
            child: child!,
          ),
        );
      },
      debugShowCheckedModeBanner: dotenv.env['PIPLINE'] == "development",
      locale: Locale(currentLanguage),
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: widget.l10n.supportedLocales,
      title: appName,
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      routerConfig: _router!,
    );
  }
}

