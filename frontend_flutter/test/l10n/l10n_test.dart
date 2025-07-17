import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend_flutter/l10n/l10n.dart';

void main() {
  late L10n l10n;

  setUp(() async {
    l10n = L10n();
    await l10n.loadTranslations();
  });

  test('Supported locales should contain English, Arabic, and French', () {
    expect(l10n.supportedLocales, contains(Locale('en')));
    expect(l10n.supportedLocales, contains(Locale('ar')));
    expect(l10n.supportedLocales, contains(Locale('fr')));
    expect(l10n.supportedLocales.length, 3);
  });

  test('Translation should return correct value', () {
    expect(l10n.translate("Email or Username", "ar"), equals("البريد الإلكتروني أو اسم المستخدم"));
    expect(l10n.translate("Email or Username", "en"), equals("Email or Username"));
    expect(l10n.translate("Email or Username", "fr"), equals("Email ou Non d'utilisateur"));
  });

  test('Translation should return key if not found', () {
    expect(l10n.translate("unknown_key", "en"), equals("unknown_key"));
  });

  testWidgets('Should return correct locale from BuildContext', (WidgetTester tester) async {
    final testKey = GlobalKey();

    await tester.pumpWidget(
      MaterialApp(
        key: testKey,
        locale: Locale('ar'),
        localizationsDelegates: [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        supportedLocales: l10n.supportedLocales,
        home: Scaffold(body: Builder(
          builder: (BuildContext context) {
            expect(L10n.getCurrentLocale(context), equals(Locale('ar')));
            return Container();
          },
        )),
      ),
    );
  });
}

