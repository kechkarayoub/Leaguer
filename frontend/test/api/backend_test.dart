import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:dio/dio.dart';
import 'package:frontend/api/backend.dart';
import '../mocks.mocks.dart';

void main() {
  // Initialize dotenv before running the tests
  setUpAll(() async {
    await dotenv.load(); // Load .env file
  });
  group('ApiBackendService', () {
    late MockDio mockDio;
    String backendUrl = '';

    setUp(() {
      // Initialize the mock Dio
      mockDio = MockDio();
      backendUrl = dotenv.env['BACKEND_URL'] ?? '';
    });

    test('signInUser returns data when the response is successful', () async {
      // Arrange
      const endpoint = '/accounts/login_with_token/';
      final mockResponse = Response(
        requestOptions: RequestOptions(path: backendUrl + endpoint),
        statusCode: 200,
        data: {'message': 'Success', 'token': 'abcd1234'},
      );

      // Mock the Dio post method
      when(mockDio.post(
        '$backendUrl$endpoint',
        data: anyNamed('data'),
        options: anyNamed('options'),
      )).thenAnswer((_) async => mockResponse);

      // Act
      final result = await ApiBackendService.signInUser(
        data: {'username': 'test', 'password': '1234'},
        dio: mockDio,
      );

      // Assert
      expect(result, isA<Map<String, dynamic>>());
      expect(result['message'], equals('Success'));
      expect(result['token'], equals('abcd1234'));

      // Verify that the POST request was called with the correct URL and data
      verify(mockDio.post(
        '$backendUrl$endpoint',
        data: {'username': 'test', 'password': '1234'},
        options: anyNamed('options'),
      )).called(1);
    });

    test('signInUser throws an exception when the response is unsuccessful', () async {
      // Arrange
      const endpoint = '/accounts/login_with_token/';
      final mockResponse = Response(
        requestOptions: RequestOptions(path: backendUrl + endpoint),
        statusCode: 400,
        data: {'error': 'Invalid credentials'},
      );

      // Mock the Dio post method
      when(mockDio.post(
        '$backendUrl$endpoint',
        data: anyNamed('data'),
        options: anyNamed('options'),
      )).thenAnswer((_) async => mockResponse);

      // Act & Assert
      expect(
        () async => await ApiBackendService.signInUser(
          data: {'username': 'wrong', 'password': 'wrongpass'},
          dio: mockDio,
        ),
        throwsA(isA<Exception>()),
      );

      // Verify that the POST request was called with the correct URL and data
      verify(mockDio.post(
        '$backendUrl$endpoint',
        data: {'username': 'wrong', 'password': 'wrongpass'},
        options: anyNamed('options'),
      )).called(1);
    });

    test('signInUser throws an exception on network errors', () async {
      // Arrange
      const endpoint = '/accounts/login_with_token/';
      when(mockDio.post(
        '$backendUrl$endpoint',
        data: anyNamed('data'),
        options: anyNamed('options'),
      )).thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
        type: DioExceptionType.connectionTimeout, // Updated to DioExceptionType
        error: 'Network error',
      ));

      // Act & Assert
      expect(
        () async => await ApiBackendService.signInUser(
          data: {'username': 'test', 'password': '1234'},
          dio: mockDio,
        ),
        throwsA(isA<Exception>()),
      );
    });
  
  });
}
