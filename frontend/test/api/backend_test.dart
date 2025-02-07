import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:dio/dio.dart';
import 'package:frontend/api/backend.dart';
import '../mocks.mocks.dart';

// Generate mock Dio class
@GenerateMocks([Dio])
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
      const endpoint = '/accounts/log-in/';
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
      const endpoint = '/accounts/log-in/';
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
      const endpoint = '/accounts/log-in/';
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

    test('SignUpUser returns successful response', () async {
      final mockResponse = Response(
        data: {'message': 'User created successfully', 'username': "username"},
        statusCode: 201,
        requestOptions: RequestOptions(path: ''),
      );

      when(mockDio.post(any, data: anyNamed('data'), options: anyNamed('options')))
          .thenAnswer((_) async => mockResponse);

      final response = await ApiBackendService.signUpUser(
        formData: {}, // Replace with actual test data
        dio: mockDio,
      );

      expect(response, {'message': 'User created successfully', 'username': "username"});
    });

    test('signUpUser handles unkown conflict (409 error)', () async {
      final mockResponse = Response(
        statusCode: 409,
        requestOptions: RequestOptions(path: ''),
      );

      when(mockDio.post(any, data: anyNamed('data'), options: anyNamed('options')))
          .thenAnswer((_) async => mockResponse);

      final response = await ApiBackendService.signUpUser(formData: {}, dio: mockDio);

      expect(response, {
        'message': 'Unknown conflict error during sign-up. Please contact the technical team to resolve your issue.'
      });

    });

    test('signUpUser handles conflict (409 error)', () async {
      // Arrange: Prepare mock Dio response
      when(mockDio.post(any, data: anyNamed('data'), options: anyNamed('options')))
          .thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: ''),
          statusCode: 409,
          data: {
            "message": "Cannot create your account.",
            "errors": {"email": "Email already exists"}
          },
        ),
      );

      // Act: Call signUpUser
      final response = await ApiBackendService.signUpUser(
        formData: {},
        dio: mockDio,
      );

      // Assert: The function should return the response data
      expect(response, {
        "message": "Cannot create your account.",
        "errors": {"email": "Email already exists"}
      });
    });

    test('signUpUser throws an exception on network failure', () async {
      when(mockDio.post(any, data: anyNamed('data'), options: anyNamed('options')))
          .thenThrow(DioException(requestOptions: RequestOptions(path: ''), message: 'Network error'));

      expect(
        () => ApiBackendService.signUpUser(formData: {}, dio: mockDio),
        throwsA(isA<Exception>()),
      );
    });
  
  });
}
