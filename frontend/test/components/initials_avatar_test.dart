import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/components/initials_avatar.dart';

void main() {
  group('InitialsAvatar', () {
    testWidgets('Renders with default properties', (WidgetTester tester) async {
      // Arrange
      const initials = 'AB';
      const userInitialsBgColor = '#FF5733';

      // Act
      await tester.pumpWidget(const MaterialApp(
        home: Scaffold(
          body: InitialsAvatar(
            initials: initials,
            userInitialsBgColor: userInitialsBgColor,
          ),
        ),
      ));

      // Assert
      final container = tester.widget<Container>(find.byType(Container));
      final text = tester.widget<Text>(find.text(initials.toUpperCase()));

      // Check the container's decoration
      expect(container.decoration, isA<BoxDecoration>());
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.color, equals(Color(0xFFFF5733))); // Converted color
      expect(decoration.shape, equals(BoxShape.circle));

      // Check the text's properties
      expect(text.style?.color, equals(Colors.white));
      expect(text.style?.fontSize, equals(40));
      expect(text.style?.fontWeight, equals(FontWeight.bold));
    });

    testWidgets('Applies custom width, height, and shape', (WidgetTester tester) async {
      // Arrange
      const initials = 'XY';
      const userInitialsBgColor = '#3498DB';
      const customWidth = 150.0;
      const customHeight = 120.0;

      // Act
      await tester.pumpWidget(const MaterialApp(
        home: Scaffold(
          body: InitialsAvatar(
            initials: initials,
            userInitialsBgColor: userInitialsBgColor,
            width: customWidth,
            height: customHeight,
            shape: BoxShape.rectangle,
          ),
        ),
      ));

      // Assert
      final containerFinder = find.byType(Container);
      expect(containerFinder, findsOneWidget);
      final container = tester.widget<Container>(find.byType(Container));
      // Check the dimensions using LayoutBuilder
      final renderBox = tester.renderObject<RenderBox>(containerFinder);
      expect(renderBox.size.width, equals(customWidth));
      expect(renderBox.size.height, equals(customHeight));

      final decoration = container.decoration as BoxDecoration;
      expect(decoration.shape, equals(BoxShape.rectangle));
    });

    testWidgets('Uses custom text style', (WidgetTester tester) async {
      // Arrange
      const initials = 'CD';
      const userInitialsBgColor = '#2ECC71';
      const customTextStyle = TextStyle(
        color: Colors.black,
        fontSize: 30,
        fontWeight: FontWeight.w300,
      );

      // Act
      await tester.pumpWidget(const MaterialApp(
        home: Scaffold(
          body: InitialsAvatar(
            initials: initials,
            userInitialsBgColor: userInitialsBgColor,
            textStyle: customTextStyle,
          ),
        ),
      ));

      // Assert
      final text = tester.widget<Text>(find.text(initials.toUpperCase()));
      expect(text.style?.color, equals(Colors.black));
      expect(text.style?.fontSize, equals(30));
      expect(text.style?.fontWeight, equals(FontWeight.w300));
    });
  });
}
