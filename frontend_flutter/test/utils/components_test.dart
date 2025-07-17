
import 'package:firebase_auth_mocks/firebase_auth_mocks.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:google_sign_in_mocks/google_sign_in_mocks.dart';
import 'package:mockito/mockito.dart';
import 'package:frontend_flutter/api/unauthenticated_api_service.dart';
import 'package:frontend_flutter/l10n/l10n.dart';
import 'package:frontend_flutter/l10n/language_picker.dart';
import 'package:frontend_flutter/utils/components.dart';
import 'package:frontend_flutter/utils/utils.dart';
import '../mocks/mocks.mocks.dart';


class FakeL10n extends Mock implements L10n {
  @override
  String translate(String key, [String? locale]) {
    if (key == "Menu") return "Menú";
    if (key == "Profile") return "Perfil";
    if (key == "Logout") return "Cerrar sesión";
    if (key == "Select Language") return "Seleccionar idioma";
    if (key == "language_en") return "Inglés";
    if (key == "language_fr") return "Francés";
    if (key == "language_ar") return "Árabe";
    return key;
  }

  @override
  List<Locale> get supportedLocales => [const Locale('en'), const Locale('fr'), const Locale('ar')];
}

void main() {
  late FakeL10n fakeL10n;
  late MockStorageService mockStorageService;
  late MockSecureStorageService mockSecureStorageService;
  late ThirdPartyAuthService thirdPartyAuthService;
  late MockFirebaseAuth mockAuth;
  late MockGoogleSignIn mockGoogleSignIn;

setUpAll(() async{
    // Initialize flutter_dotenv for tests
    await dotenv.load(fileName: ".env");
  });
  setUp(() {
    fakeL10n = FakeL10n();
    mockStorageService = MockStorageService();
    mockSecureStorageService = MockSecureStorageService();
    mockAuth = MockFirebaseAuth();
    mockGoogleSignIn = MockGoogleSignIn();
    thirdPartyAuthService = ThirdPartyAuthService(auth: mockAuth, googleSignIn: mockGoogleSignIn);
  });

  testWidgets('Drawer menu displays translated header, profile, and logout', (WidgetTester tester) async {
    final router = GoRouter(
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => Scaffold(
            appBar: AppBar(),
            drawer: renderDrawerMenu(fakeL10n, mockStorageService, mockSecureStorageService, context),
          ),
        ),
      ],
    );
    await tester.pumpWidget(MaterialApp.router(routerConfig: router));
    await tester.tap(find.byIcon(Icons.menu));
    await tester.pumpAndSettle();
    expect(find.text('Menú'), findsOneWidget);
    expect(find.text('Perfil'), findsOneWidget);
    expect(find.text('Cerrar sesión'), findsOneWidget);
    expect(find.byIcon(Icons.logout), findsOneWidget);
    expect(find.byIcon(Icons.person), findsOneWidget);
  });

  testWidgets('Tapping Profile navigates to /profile', (WidgetTester tester) async {
    bool navigated = false;
    final router = GoRouter(
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => Scaffold(
            appBar: AppBar(),
            drawer: renderDrawerMenu(fakeL10n, mockStorageService, mockSecureStorageService, context),
          ),
        ),
        GoRoute(
          path: '/profile',
          builder: (context, state) {
            navigated = true;
            return const SizedBox();
          },
        ),
      ],
    );
    await tester.pumpWidget(MaterialApp.router(routerConfig: router));
    await tester.tap(find.byIcon(Icons.menu));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Perfil'));
    await tester.pumpAndSettle();
    expect(navigated, isTrue);
  });

  testWidgets('Tapping Logout calls logout and clears storage', (WidgetTester tester) async {
    BuildContext? capturedContext;
    // You may want to mock logout logic in your app for a real test
    final router = GoRouter(
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) {
            capturedContext = context; // Capture the context for logout
            return Scaffold(
              appBar: AppBar(),
              drawer: renderDrawerMenu(fakeL10n, mockStorageService, mockSecureStorageService, context),
            );
          },
        ),
      ],
    );
    await tester.pumpWidget(MaterialApp.router(routerConfig: router));
    await tester.tap(find.byIcon(Icons.menu));
    await tester.pumpAndSettle(const Duration(seconds: 1));
    await tester.tap(find.text('Cerrar sesión'));
    await tester.pumpAndSettle(const Duration(seconds: 1));
    // Here you would verify your logout logic, e.g.:
    verify(mockStorageService.clear()).called(1);
    // For now, just ensure the tap does not throw
    verify(logout(mockStorageService, mockSecureStorageService, capturedContext, thirdPartyAuthService)).called(1);
  });

  testWidgets('Language icon button shows LanguagePickerDialog', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          appBar: AppBar(),
          body: Builder(
            builder: (context) => renderLanguagesIcon(fakeL10n, mockStorageService, context),
          ),
        ),
      ),
    );
    await tester.tap(find.byIcon(Icons.language));
    await tester.pumpAndSettle(const Duration(seconds: 1));
    expect(find.byType(LanguagePickerDialog), findsOneWidget);
    expect(find.text('Seleccionar idioma'), findsOneWidget);
    expect(find.text('Inglés'), findsOneWidget);
    expect(find.text('Francés'), findsOneWidget);
    expect(find.text('Árabe'), findsOneWidget);
  });
}
