
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/components/connection_status_bar.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';
import '../mocks.mocks.dart';
import '../test_helper.dart';
import '../wakelock.mocks.dart';

// Generate mock Dio class
@GenerateMocks([Dio])

void main() async{
  late MockDio mockDio;
  late MockL10n mockL10n;
  late MockWakelockService mockWakelockService;

  setUp(() async{
    await dotenv.load(fileName: ".env");
    mockDio = MockDio();
    mockL10n = MockL10n();
    mockWakelockService = MockWakelockService();
  });

  testWidgets('Test ConnectionStatusWidget - Connection Lost', (tester) async {
    // Mock the Dio response to simulate no internet
    await tester.runAsync(() async {
      when(mockDio.get(any, options: anyNamed('options')))
        .thenThrow(DioException(
          requestOptions: RequestOptions(path: ''),
          type: DioExceptionType.unknown,
        )
      );

      await tester.pumpWidget(
        MaterialApp(
          home: ConnectionStatusWidget(
            l10n: mockL10n,
            dio: mockDio,
            wakelockService: mockWakelockService,
            child: Container(),
          ),
        ),
      );
      // Verify that the connection lost banner is not exists
      expect(find.text("Oops! You're Offline. Attempting to reconnect...."), findsNothing);
      expect(find.text("Connection Restored!"), findsNothing);

      await tester.pumpAndSettle();

      // Verify that the connection lost banner is displayed
      expect(find.text("Oops! You're Offline. Attempting to reconnect...."), findsOneWidget);
      expect(find.text("Connection Restored!"), findsNothing);
     });
  });

  testWidgets('Test ConnectionStatusWidget - Connection Already exists', (tester) async {
    // Mock the Dio response to simulate no internet
    await tester.runAsync(() async {
      when(mockDio.get(any, options: anyNamed('options')))
        .thenAnswer((_) async => Response(statusCode: 200, requestOptions: RequestOptions(path: ''))
      );

      await tester.pumpWidget(
        MaterialApp(
          home: ConnectionStatusWidget(
            l10n: mockL10n,
            dio: mockDio,
            wakelockService: mockWakelockService,
            child: Container(),
          ),
        ),
      );
      // Verify that the connection lost banner is not exists
      expect(find.text("Oops! You're Offline. Attempting to reconnect...."), findsNothing);
      expect(find.text("Connection Restored!"), findsNothing);

      await tester.pump(const Duration(seconds: 3));

      // Verify that the connection lost banner is displayed
      expect(find.text("Oops! You're Offline. Attempting to reconnect...."), findsNothing);
      expect(find.text("Connection Restored!"), findsNothing);
     });
  });

  testWidgets('Test ConnectionStatusWidget - Connection losted and restored', (tester) async {
    // Mock the Dio response to simulate no internet
    await tester.runAsync(() async {
      when(mockDio.get(any, options: anyNamed('options')))
        .thenThrow(DioException(
          requestOptions: RequestOptions(path: ''),
          type: DioExceptionType.unknown,
        )
      );

      await tester.pumpWidget(
        MaterialApp(
          home: ConnectionStatusWidget(
            l10n: mockL10n,
            dio: mockDio,
            wakelockService: mockWakelockService,
            child: Container(),
          ),
        ),
      );
      // Verify that the connection lost banner is not exists
      expect(find.text("Oops! You're Offline. Attempting to reconnect...."), findsNothing);
      expect(find.text("Connection Restored!"), findsNothing);

      await tester.pump(const Duration(seconds: 3));

      // Verify that the connection lost banner is displayed
      expect(find.text("Oops! You're Offline. Attempting to reconnect...."), findsOneWidget);
      expect(find.text("Connection Restored!"), findsNothing);


      when(mockDio.get(any, options: anyNamed('options')))
        .thenAnswer((_) async => Response(statusCode: 200, requestOptions: RequestOptions(path: ''))
      );
      await Future.delayed(Duration(seconds: 7));
      await tester.pump(); 
      // Verify that the connection lost banner is not exists
      expect(find.text("Oops! You're Offline. Attempting to reconnect...."), findsNothing);
      expect(find.text("Connection Restored!"), findsOneWidget);

      await Future.delayed(Duration(seconds: 3));
      await tester.pump(); 

      // // Verify that the connection lost banner is displayed
      expect(find.text("Oops! You're Offline. Attempting to reconnect...."), findsNothing);
      expect(find.text("Connection Restored!"), findsNothing);
     });

  });

}