import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/components/initials_avatar.dart';

void main() {
  group('Testing InitialsAvatar', () {
    testWidgets('Renders with correct initials and background color', (WidgetTester tester) async {
      // Arrange: Define the test initials and color
      const testInitials = 'AB';
      const testColor = '#FF5733';

      // Act: Build the widget
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: InitialsAvatar(
              initials: testInitials,
              initialsBgColors: testColor,
            ),
          ),
        ),
      );

      // Assert: Check the widget tree
      final textFinder = find.text(testInitials.toUpperCase());
      expect(textFinder, findsOneWidget);

      final container = tester.widget<Container>(find.byType(Container));
      final boxDecoration = container.decoration as BoxDecoration;
      expect(boxDecoration.color, equals(Color(0xFFFF5733))); // Verify background color
    });

    testWidgets('Has correct text style', (WidgetTester tester) async {
      // Arrange: Define test initials
      const testInitials = 'XY';
      const testColor = '#123456';

      // Act: Build the widget
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: InitialsAvatar(
              initials: testInitials,
              initialsBgColors: testColor,
            ),
          ),
        ),
      );

      // Assert: Verify text style
      final textWidget = tester.widget<Text>(find.text(testInitials.toUpperCase()));
      expect(textWidget.style, isNotNull);
      expect(textWidget.style!.color, Colors.white);
      expect(textWidget.style!.fontSize, 40);
      expect(textWidget.style!.fontWeight, FontWeight.bold);
    });

    testWidgets('Renders a circular container', (WidgetTester tester) async {
      // Arrange
      const testInitials = 'CD';
      const testColor = '#FFFFFF';

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: InitialsAvatar(
              initials: testInitials,
              initialsBgColors: testColor,
            ),
          ),
        ),
      );

      // Assert: Check shape is circular
      final container = tester.widget<Container>(find.byType(Container));
      final boxDecoration = container.decoration as BoxDecoration;
      expect(boxDecoration.shape, BoxShape.circle);
    });
  });
}
