
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend_flutter/utils/utils.dart';
import '../mocks/test_helper.dart';


void main() {
  
  setUpAll(() async {
    // Initialize flutter_dotenv for tests
    await dotenv.load(fileName: ".env");
  });
      
  testWidgets('ShowConfirmationDialog - confirm', (WidgetTester tester) async {
    final mockL10n = MockL10n();
    bool result = false;
    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (context) {
            return ElevatedButton(
              onPressed: () async {
                result = await showConfirmationDialog(
                  context,
                  mockL10n,
                  'TitleKey',
                  'ContentKey',
                );

                // You can add checks here or set a variable to check the result
              },
              child: const Text('Open Dialog'),
            );
          },
        ),
      ),
    );

    // Tap button to open dialog
    await tester.tap(find.text('Open Dialog'));
    await tester.pumpAndSettle();

    // Verify dialog shows
    expect(find.text(mockL10n.translate('TitleKey', 'en')), findsOneWidget);
    expect(find.text(mockL10n.translate('ContentKey', 'en')), findsOneWidget);
    expect(find.text(mockL10n.translate('Cancel', 'en')), findsOneWidget);
    expect(find.text(mockL10n.translate('Confirm', 'en')), findsOneWidget);

    // Tap confirm
    await tester.tap(find.text(mockL10n.translate('Confirm', 'en')));
    await tester.pumpAndSettle();

    
    expect(result, isTrue);
    

  });

  testWidgets('ShowConfirmationDialog - cancel', (WidgetTester tester) async {
      final mockL10n = MockL10n();
      bool result = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              return ElevatedButton(
                onPressed: () async {
                  result = await showConfirmationDialog(
                    context,
                    mockL10n,
                    'TitleKey',
                    'ContentKey',
                    cancelText: "Custom cancel text",
                    confirmText: "Custom confirm text",
                  );

                  // You can add checks here or set a variable to check the result
                },
                child: const Text('Open Dialog'),
              );
            },
          ),
        ),
      );

      // Tap button to open dialog
      await tester.tap(find.text('Open Dialog'));
      await tester.pumpAndSettle();

      // Verify dialog shows
      expect(find.text(mockL10n.translate('TitleKey', 'en')), findsOneWidget);
      expect(find.text(mockL10n.translate('ContentKey', 'en')), findsOneWidget);
      expect(find.text(mockL10n.translate('Custom cancel text', 'en')), findsOneWidget);
      expect(find.text(mockL10n.translate('Custom confirm text', 'en')), findsOneWidget);

      // Tap confirm
      await tester.tap(find.text(mockL10n.translate('Custom cancel text', 'en')));
      await tester.pumpAndSettle();

      
      expect(result, isFalse);
      
      
    });

}