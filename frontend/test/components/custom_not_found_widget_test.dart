import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/components/custom_not_found_widget.dart';
import 'package:frontend/l10n/l10n.dart';

class _FakeL10n implements L10n {
  @override
  String translate(String key, [String? _]) => key;

  @override
  List<Locale> get supportedLocales => [const Locale('en')];

  @override
  Future<void> loadTranslations() async {}

  @override
  String translateFromContext(BuildContext context, String key) => key;
}

void main() {
  group('CustomNotFoundWidget', () {
    testWidgets('Displays error icon, message, and Home button', (WidgetTester tester) async {
      bool homePressed = false;
      await tester.pumpWidget(
        MaterialApp(
          home: CustomNotFoundWidget(
            l10n: _FakeL10n(),
            isLoggedIn: false,
            onHome: () => homePressed = true,
          ),
        ),
      );
      expect(find.byIcon(Icons.error_outline), findsOneWidget);
      expect(find.text('Page Not Found'), findsOneWidget);
      expect(find.byIcon(Icons.home), findsOneWidget);
      expect(find.text('Home'), findsOneWidget);
      expect(find.byIcon(Icons.logout), findsNothing);
      expect(find.text('Logout'), findsNothing);
      await tester.tap(find.text('Home'));
      expect(homePressed, isTrue);
    });

    testWidgets('Shows Logout button if isLoggedIn and onLogout provided', (WidgetTester tester) async {
      bool logoutPressed = false;
      await tester.pumpWidget(
        MaterialApp(
          home: CustomNotFoundWidget(
            l10n: _FakeL10n(),
            isLoggedIn: true,
            onHome: () {},
            onLogout: () => logoutPressed = true,
          ),
        ),
      );
      expect(find.byIcon(Icons.logout), findsOneWidget);
      expect(find.text('Logout'), findsOneWidget);
      await tester.tap(find.text('Logout'));
      expect(logoutPressed, isTrue);
    });

    testWidgets('Does not show Logout button if isLoggedIn is false', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: CustomNotFoundWidget(
            l10n: _FakeL10n(),
            isLoggedIn: false,
            onHome: () {},
          ),
        ),
      );
      expect(find.byIcon(Icons.logout), findsNothing);
      expect(find.text('Logout'), findsNothing);
    });
  });
}
