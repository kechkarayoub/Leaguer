import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend_flutter/components/message_banner.dart';

void main() {
  testWidgets('MessageBanner displays message and close button', (WidgetTester tester) async {
    bool closed = false;
    await tester.pumpWidget(
      MaterialApp(
        home: Stack(
          children: [
            MessageBanner(
              message: 'Test message',
              onClose: () { closed = true; },
              top: 10,
              left: 0,
              right: 0,
              bgColor: Colors.green,
              icon: const Icon(Icons.info, color: Colors.white),
            ),
          ],
        ),
      ),
    );

    // Check that the message is displayed
    expect(find.text('Test message'), findsOneWidget);
    // Check that the icon is displayed
    expect(find.byIcon(Icons.info), findsOneWidget);
    // Check that the close button is displayed
    expect(find.byIcon(Icons.close), findsOneWidget);

    // Tap the close button
    await tester.tap(find.byIcon(Icons.close));
    expect(closed, isTrue);
  });

  testWidgets('MessageBanner does not show close button if onClose is null', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Stack(
          children: [
            MessageBanner(
              message: 'No close',
              onClose: null,
            ),
          ],
        ),
      ),
    );
    expect(find.byIcon(Icons.close), findsNothing);
    expect(find.text('No close'), findsOneWidget);
  });
}
