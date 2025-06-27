import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/components/app_splash_screen.dart';

void main() {
  group('AppSplashScreen', () {
    testWidgets('Shows logo, app name, and loader by default', (WidgetTester tester) async {
      await tester.pumpWidget(const MaterialApp(
        home: AppSplashScreen(appName: 'TestApp'),
      ));

      // Logo
      expect(find.byType(Image), findsOneWidget);
      // App name
      expect(find.text('TestApp'), findsOneWidget);
      // Loader
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('Hides app name if empty', (WidgetTester tester) async {
      await tester.pumpWidget(const MaterialApp(
        home: AppSplashScreen(appName: ''),
      ));
      expect(find.text(''), findsNothing);
    });

    testWidgets('Hides loader if showLoader is false', (WidgetTester tester) async {
      await tester.pumpWidget(const MaterialApp(
        home: AppSplashScreen(appName: 'TestApp', showLoader: false),
      ));
      expect(find.byType(CircularProgressIndicator), findsNothing);
    });
  });
}
