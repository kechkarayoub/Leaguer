
import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_auth_mocks/firebase_auth_mocks.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_sign_in_mocks/google_sign_in_mocks.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:frontend/api/unauthenticated_api_service.dart';
import '../mocks/mocks.mocks.dart';

// Generate mock Dio class
@GenerateMocks([Dio])
void main() {
  // Initialize dotenv before running the tests
  setUpAll(() async {
    await dotenv.load(); // Load .env file
  });
  group('ThirdPartyAuthService', () {
    late ThirdPartyAuthService thirdPartyAuthService;
    late MockFirebaseAuth mockAuth;
    late MockGoogleSignIn mockGoogleSignIn;

    setUp(() {
      mockAuth = MockFirebaseAuth();
      mockGoogleSignIn = MockGoogleSignIn();
      thirdPartyAuthService = ThirdPartyAuthService(auth: mockAuth, googleSignIn: mockGoogleSignIn);
    });

    test("Google Sign-In returns UserCredential", () async {
      final mockGoogleUser = await mockGoogleSignIn.signIn();
      expect(mockGoogleUser, isNotNull, reason: "Google Sign-In failed");

      // Simulate Firebase authentication response
      //final mockUser = MockUser(email: "test@example.com");
      mockAuth.createUserWithEmailAndPassword(email: "test@example.com", password: "password");

      final UserCredential? result = await thirdPartyAuthService.signInWithGoogle();
      expect(result, isNotNull, reason: "UserCredential should not be null");
      expect(result!.user, isNotNull);
      expect(result.user!.email, equals("test@example.com"));
    });

    test("Google Sign-Out works without errors", () async {
      await thirdPartyAuthService.signOut();
      expect(mockAuth.currentUser, isNull);
    });

    
  });

  group('UnauthenticatedApiBackendService: signinUser', () {
    late MockDio mockDio;
    String backendUrl = '';

    setUp(() {
      // Initialize the mock Dio
      mockDio = MockDio();
      backendUrl = dotenv.env['BACKEND_URL'] ?? '';
    });

    test('signInUser returns data when the response is successful', () async {
      // Arrange
      const endpoint = '/accounts/sign-in/';
      
      final mockResponse = Response(
        requestOptions: RequestOptions(path: backendUrl + endpoint),
        statusCode: 200,
        data: {'success': true, 'access_token': "abcd1234", 'refresh_token': "rabcd1234", 'user': {'id': 1, 'username': "username"}},
      );

      // Mock the Dio post method
      when(mockDio.post(
        '$backendUrl$endpoint',
        data: anyNamed('data'),
        options: anyNamed('options'),
      )).thenAnswer((_) async => mockResponse);

      // Act
      final result = await UnauthenticatedApiBackendService.signInUser(
        data: {'email_or_username': "email_or_username", 'password': "password"},
        dio: mockDio,
      );

      // Verify that the POST request was called with the correct URL and data
      verify(mockDio.post(
        '$backendUrl$endpoint',
        data: {'email_or_username': "email_or_username", 'password': "password"},
        options: anyNamed('options'),
      )).called(1);

      // Assert
      expect(result, isA<Map<String, dynamic>>());
      expect(result['success'], equals(true));
      expect(result['access_token'], equals('abcd1234'));
      expect(result['refresh_token'], equals('rabcd1234'));
      expect(result['user'], equals({'id': 1, 'username': "username"}));

    });

    test('SignInUser when missing params', () async {
      // Arrange
      const endpoint = '/accounts/sign-in/';
      final mockResponse = Response(
        requestOptions: RequestOptions(path: backendUrl + endpoint),
        statusCode: 400,
        data: {'message': "Email/Username and password are required", 'success': false},
      );

      // Mock the Dio post method
      when(mockDio.post(
        '$backendUrl$endpoint',
        data: {},
        options: anyNamed('options'),
      )).thenAnswer((_) async => mockResponse);
      when(mockDio.post(
        '$backendUrl$endpoint',
        data: {'email_or_username': "email_or_username"},
        options: anyNamed('options'),
      )).thenAnswer((_) async => mockResponse);
      when(mockDio.post(
        '$backendUrl$endpoint',
        data: {'password': "password"},
        options: anyNamed('options'),
      )).thenAnswer((_) async => mockResponse);


      // Act
      final result = await UnauthenticatedApiBackendService.signInUser(
        data: {},
        dio: mockDio,
      );      
      // Verify that the POST request was called with the correct URL and data
      verify(mockDio.post(
        '$backendUrl$endpoint',
        data: {},
        options: anyNamed('options'),
      )).called(1);

      // Assert
      expect(result, isA<Map<String, dynamic>>());
      expect(result['success'], equals(false));
      expect(result['message'], equals("Email/Username and password are required"));
      // Act
      final result2 = await UnauthenticatedApiBackendService.signInUser(
        data: {'email_or_username': "email_or_username"},
        dio: mockDio,
      );      
      // Verify that the POST request was called with the correct URL and data
      verify(mockDio.post(
        '$backendUrl$endpoint',
        data: {'email_or_username': "email_or_username"},
        options: anyNamed('options'),
      )).called(1);

      // Assert
      expect(result2, isA<Map<String, dynamic>>());
      expect(result2['success'], equals(false));
      expect(result2['message'], equals("Email/Username and password are required"));
      // Act
      final result3 = await UnauthenticatedApiBackendService.signInUser(
        data: {'password': "password"},
        dio: mockDio,
      );      
      // Verify that the POST request was called with the correct URL and data
      verify(mockDio.post(
        '$backendUrl$endpoint',
        data: {'password': "password"},
        options: anyNamed('options'),
      )).called(1);

      // Assert
      expect(result3, isA<Map<String, dynamic>>());
      expect(result3['success'], equals(false));
      expect(result3['message'], equals("Email/Username and password are required"));
    });

    test('SignInUser when deleted user', () async {
      // Arrange
      const endpoint = '/accounts/sign-in/';
      final mockResponse = Response(
        requestOptions: RequestOptions(path: backendUrl + endpoint),
        statusCode: 400,
        data: {'message': "Your account is deleted. Please contact the technical team to resolve your issue.", 'success': false},
      );

      // Mock the Dio post method
      when(mockDio.post(
        '$backendUrl$endpoint',
        data: {'email_or_username': "deleted_user", 'password': "password"},
        options: anyNamed('options'),
      )).thenAnswer((_) async => mockResponse);


      // Act
      final result = await UnauthenticatedApiBackendService.signInUser(
        data: {'email_or_username': "deleted_user", 'password': "password"},
        dio: mockDio,
      );      
      // Verify that the POST request was called with the correct URL and data
      verify(mockDio.post(
        '$backendUrl$endpoint',
        data: {'email_or_username': "deleted_user", 'password': "password"},
        options: anyNamed('options'),
      )).called(1);

      // Assert
      expect(result, isA<Map<String, dynamic>>());
      expect(result['success'], equals(false));
      expect(result['message'], equals("Your account is deleted. Please contact the technical team to resolve your issue."));
      
    });

    test('SignInUser when inactive user', () async {
      // Arrange
      const endpoint = '/accounts/sign-in/';
      final mockResponse = Response(
        requestOptions: RequestOptions(path: backendUrl + endpoint),
        statusCode: 400,
        data: {'message': "Your account is inactive. Please contact the technical team to resolve your issue.", 'success': false},
      );

      // Mock the Dio post method
      when(mockDio.post(
        '$backendUrl$endpoint',
        data: {'email_or_username': "inactive_user", 'password': "password"},
        options: anyNamed('options'),
      )).thenAnswer((_) async => mockResponse);


      // Act
      final result = await UnauthenticatedApiBackendService.signInUser(
        data: {'email_or_username': "inactive_user", 'password': "password"},
        dio: mockDio,
      );      
      // Verify that the POST request was called with the correct URL and data
      verify(mockDio.post(
        '$backendUrl$endpoint',
        data: {'email_or_username': "inactive_user", 'password': "password"},
        options: anyNamed('options'),
      )).called(1);

      // Assert
      expect(result, isA<Map<String, dynamic>>());
      expect(result['success'], equals(false));
      expect(result['message'], equals("Your account is inactive. Please contact the technical team to resolve your issue."));
      
    });

    test('SignInUser when invalidated email', () async {
      // Arrange
      const endpoint = '/accounts/sign-in/';
      final mockResponse = Response(
        requestOptions: RequestOptions(path: backendUrl + endpoint),
        statusCode: 400,
        data: {'message': "Your email is not yet verified. Please verify your email address before sign in.", 'success': false, 'user_id': 1},
      );

      // Mock the Dio post method
      when(mockDio.post(
        '$backendUrl$endpoint',
        data: {'email_or_username': "invalidated_email", 'password': "password"},
        options: anyNamed('options'),
      )).thenAnswer((_) async => mockResponse);


      // Act
      final result = await UnauthenticatedApiBackendService.signInUser(
        data: {'email_or_username': "invalidated_email", 'password': "password"},
        dio: mockDio,
      );      
      // Verify that the POST request was called with the correct URL and data
      verify(mockDio.post(
        '$backendUrl$endpoint',
        data: {'email_or_username': "invalidated_email", 'password': "password"},
        options: anyNamed('options'),
      )).called(1);

      // Assert
      expect(result, isA<Map<String, dynamic>>());
      expect(result['success'], equals(false));
      expect(result['message'], equals("Your email is not yet verified. Please verify your email address before sign in."));
      expect(result['user_id'], equals(1));
      
    });

    test('SignInUser when invalid credentials', () async {
      // Arrange
      const endpoint = '/accounts/sign-in/';
      final mockResponse = Response(
        requestOptions: RequestOptions(path: backendUrl + endpoint),
        statusCode: 400,
        data: {'message': "Invalid credentials", 'success': false},
      );

      // Mock the Dio post method
      when(mockDio.post(
        '$backendUrl$endpoint',
        data: {'email_or_username': "wrongusername", 'password': "wrongpassword"},
        options: anyNamed('options'),
      )).thenAnswer((_) async => mockResponse);


      // Act
      final result = await UnauthenticatedApiBackendService.signInUser(
        data: {'email_or_username': "wrongusername", 'password': "wrongpassword"},
        dio: mockDio,
      );      
      // Verify that the POST request was called with the correct URL and data
      verify(mockDio.post(
        '$backendUrl$endpoint',
        data: {'email_or_username': "wrongusername", 'password': "wrongpassword"},
        options: anyNamed('options'),
      )).called(1);

      // Assert
      expect(result, isA<Map<String, dynamic>>());
      expect(result['success'], equals(false));
      expect(result['message'], equals("Invalid credentials"));
      
    });

    
    test('Sign in should return timeout error on network issue', () async {
      when(mockDio.post(any, data: anyNamed('data'))).thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
        type: DioExceptionType.connectionTimeout,
      ));
      

      final result = await UnauthenticatedApiBackendService.signInUser(data: {'email': 'test@example.com', 'password': '123456'}, dio: mockDio);

      expect(result['success'], false);
      expect(result['message'], 'Connection timeout. Please check your internet connection.');
    });

    
    test('Sign in should return timeout error on server issue', () async {
      when(mockDio.post(any, data: anyNamed('data'))).thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
        type: DioExceptionType.receiveTimeout,
      ));
      

      final result = await UnauthenticatedApiBackendService.signInUser(data: {'email': 'test@example.com', 'password': '123456'}, dio: mockDio);

      expect(result['success'], false);
      expect(result['message'], 'Server took too long to respond (Sign in). Please try again later.');
    });

    
  });

  group('UnauthenticatedApiBackendService: signInUserWithThirdParty', () {
    late MockDio mockDio;
    String backendUrl = '';

    setUp(() {
      // Initialize the mock Dio
      mockDio = MockDio();
      backendUrl = dotenv.env['BACKEND_URL'] ?? '';
    });

    test('Sign in user with third party returns data when the response is successful', () async {
      // Arrange
      const endpoint = '/accounts/sign-in-third-party/';
      
      final mockResponse = Response(
        requestOptions: RequestOptions(path: backendUrl + endpoint),
        statusCode: 200,
        data: {'success': true, 'access_token': "abcd1234", 'refresh_token': "rabcd1234", 'user': {'id': 1, 'username': "username"}},
      );

      // Mock the Dio post method
      when(mockDio.post(
        '$backendUrl$endpoint',
        data: anyNamed('data'),
        options: anyNamed('options'),
      )).thenAnswer((_) async => mockResponse);

      // Act
      final result = await UnauthenticatedApiBackendService.signInUserWithThirdParty(
        data: {'email': "email_or_username", 'id_token': "idtoken", "type_third_party": "google"},
        dio: mockDio,
      );

      // Verify that the POST request was called with the correct URL and data
      verify(mockDio.post(
        '$backendUrl$endpoint',
        data: {'email': "email_or_username", 'id_token': "idtoken", "type_third_party": "google"},
        options: anyNamed('options'),
      )).called(1);

      // Assert
      expect(result, isA<Map<String, dynamic>>());
      expect(result['success'], equals(true));
      expect(result['access_token'], equals('abcd1234'));
      expect(result['refresh_token'], equals('rabcd1234'));
      expect(result['user'], equals({'id': 1, 'username': "username"}));

    });

    test('Sign in user with third party when missing params', () async {
      // Arrange
      const endpoint = '/accounts/sign-in-third-party/';
      final mockResponse = Response(
        requestOptions: RequestOptions(path: backendUrl + endpoint),
        statusCode: 400,
        data: {'message': "Email, Id token and Third party type are required", 'success': false},
      );

      // Mock the Dio post method
      when(mockDio.post(
        '$backendUrl$endpoint',
        data: {},
        options: anyNamed('options'),
      )).thenAnswer((_) async => mockResponse);
      when(mockDio.post(
        '$backendUrl$endpoint',
        data: {'email': "email"},
        options: anyNamed('options'),
      )).thenAnswer((_) async => mockResponse);
      when(mockDio.post(
        '$backendUrl$endpoint',
        data: {"id_token": "id_token"},
        options: anyNamed('options'),
      )).thenAnswer((_) async => mockResponse);


      // Act
      final result = await UnauthenticatedApiBackendService.signInUserWithThirdParty(
        data: {},
        dio: mockDio,
      );      
      // Verify that the POST request was called with the correct URL and data
      verify(mockDio.post(
        '$backendUrl$endpoint',
        data: {},
        options: anyNamed('options'),
      )).called(1);

      // Assert
      expect(result, isA<Map<String, dynamic>>());
      expect(result['success'], equals(false));
      expect(result['message'], equals("Email, Id token and Third party type are required"));
      // Act
      final result2 = await UnauthenticatedApiBackendService.signInUserWithThirdParty(
        data: {'email': "email"},
        dio: mockDio,
      );      
      // Verify that the POST request was called with the correct URL and data
      verify(mockDio.post(
        '$backendUrl$endpoint',
        data: {'email': "email"},
        options: anyNamed('options'),
      )).called(1);

      // Assert
      expect(result2, isA<Map<String, dynamic>>());
      expect(result2['success'], equals(false));
      expect(result2['message'], equals("Email, Id token and Third party type are required"));
      // Act
      final result3 = await UnauthenticatedApiBackendService.signInUserWithThirdParty(
        data: {'id_token': "id_token"},
        dio: mockDio,
      );      
      // Verify that the POST request was called with the correct URL and data
      verify(mockDio.post(
        '$backendUrl$endpoint',
        data: {'id_token': "id_token"},
        options: anyNamed('options'),
      )).called(1);

      // Assert
      expect(result3, isA<Map<String, dynamic>>());
      expect(result3['success'], equals(false));
      expect(result3['message'], equals("Email, Id token and Third party type are required"));
    });

    test('Sign in user with third party when deleted user', () async {
      // Arrange
      const endpoint = '/accounts/sign-in-third-party/';
      final mockResponse = Response(
        requestOptions: RequestOptions(path: backendUrl + endpoint),
        statusCode: 400,
        data: {'message': "Your account is deleted. Please contact the technical team to resolve your issue.", 'success': false},
      );

      // Mock the Dio post method
      when(mockDio.post(
        '$backendUrl$endpoint',
        data: {'email': "email_or_username", 'id_token': "idtoken", "type_third_party": "google"},
        options: anyNamed('options'),
      )).thenAnswer((_) async => mockResponse);


      // Act
      final result = await UnauthenticatedApiBackendService.signInUserWithThirdParty(
        data: {'email': "email_or_username", 'id_token': "idtoken", "type_third_party": "google"},
        dio: mockDio,
      );      
      // Verify that the POST request was called with the correct URL and data
      verify(mockDio.post(
        '$backendUrl$endpoint',
        data: {'email': "email_or_username", 'id_token': "idtoken", "type_third_party": "google"},
        options: anyNamed('options'),
      )).called(1);

      // Assert
      expect(result, isA<Map<String, dynamic>>());
      expect(result['success'], equals(false));
      expect(result['message'], equals("Your account is deleted. Please contact the technical team to resolve your issue."));
      
    });

    test('Sign in user with third party when inactive user', () async {
      // Arrange
      const endpoint = '/accounts/sign-in-third-party/';
      final mockResponse = Response(
        requestOptions: RequestOptions(path: backendUrl + endpoint),
        statusCode: 400,
        data: {'message': "Your account is inactive. Please contact the technical team to resolve your issue.", 'success': false},
      );

      // Mock the Dio post method
      when(mockDio.post(
        '$backendUrl$endpoint',
        data: {'email': "email_or_username", 'id_token': "idtoken", "type_third_party": "google"},
        options: anyNamed('options'),
      )).thenAnswer((_) async => mockResponse);


      // Act
      final result = await UnauthenticatedApiBackendService.signInUserWithThirdParty(
        data: {'email': "email_or_username", 'id_token': "idtoken", "type_third_party": "google"},
        dio: mockDio,
      );      
      // Verify that the POST request was called with the correct URL and data
      verify(mockDio.post(
        '$backendUrl$endpoint',
        data: {'email': "email_or_username", 'id_token': "idtoken", "type_third_party": "google"},
        options: anyNamed('options'),
      )).called(1);

      // Assert
      expect(result, isA<Map<String, dynamic>>());
      expect(result['success'], equals(false));
      expect(result['message'], equals("Your account is inactive. Please contact the technical team to resolve your issue."));
      
    });

    test('Sign in user with third party when invalid credentials', () async {
      // Arrange
      const endpoint = '/accounts/sign-in-third-party/';
      final mockResponse = Response(
        requestOptions: RequestOptions(path: backendUrl + endpoint),
        statusCode: 400,
        data: {'message': "Invalid credentials", 'success': false},
      );

      // Mock the Dio post method
      when(mockDio.post(
        '$backendUrl$endpoint',
        data: {'email': "email_or_username", 'id_token': "idtoken", "type_third_party": "google"},
        options: anyNamed('options'),
      )).thenAnswer((_) async => mockResponse);


      // Act
      final result = await UnauthenticatedApiBackendService.signInUserWithThirdParty(
        data: {'email': "email_or_username", 'id_token': "idtoken", "type_third_party": "google"},
        dio: mockDio,
      );      
      // Verify that the POST request was called with the correct URL and data
      verify(mockDio.post(
        '$backendUrl$endpoint',
        data: {'email': "email_or_username", 'id_token': "idtoken", "type_third_party": "google"},
        options: anyNamed('options'),
      )).called(1);

      // Assert
      expect(result, isA<Map<String, dynamic>>());
      expect(result['success'], equals(false));
      expect(result['message'], equals("Invalid credentials"));
      
    });

    
    test('Sign in user with third party should return timeout error on network issue', () async {
      when(mockDio.post(any, data: anyNamed('data'))).thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
        type: DioExceptionType.connectionTimeout,
      ));
      

      final result = await UnauthenticatedApiBackendService.signInUserWithThirdParty(data: {'email': "email_or_username", 'id_token': "idtoken", "type_third_party": "google"}, dio: mockDio);

      expect(result['success'], false);
      expect(result['message'], 'Connection timeout. Please check your internet connection.');
    });

    
    test('Sign in user with third party should return timeout error on server issue', () async {
      when(mockDio.post(any, data: anyNamed('data'))).thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
        type: DioExceptionType.receiveTimeout,
      ));
      

      final result = await UnauthenticatedApiBackendService.signInUserWithThirdParty(data: {'email': "email_or_username", 'id_token': "idtoken", "type_third_party": "google"}, dio: mockDio);

      expect(result['success'], false);
      expect(result['message'], 'Server took too long to respond (Sign in). Please try again later.');
    });

    
  });

  group('UnauthenticatedApiBackendService: resendVerificationEmail', () {
    late MockDio mockDio;
    String backendUrl = '';

    setUp(() {
      // Initialize the mock Dio
      mockDio = MockDio();
      backendUrl = dotenv.env['BACKEND_URL'] ?? '';
    });

    test('ResendVerificationEmail success', () async {
      // Arrange
      const endpoint = '/accounts/send-verification-email-link/';
      
      final mockResponse = Response(
        requestOptions: RequestOptions(path: backendUrl + endpoint),
        statusCode: 200,
        data: {'success': true, 'message': "A new verification link has been sent to your email address. Please verify your email before logging in."},
      );

      // Mock the Dio post method
      when(mockDio.post(
        '$backendUrl$endpoint',
        data: anyNamed('data'),
        options: anyNamed('options'),
      )).thenAnswer((_) async => mockResponse);

      // Act
      final result = await UnauthenticatedApiBackendService.resendVerificationEmail(
        data: {'user_id': 1},
        dio: mockDio,
      );

      // Verify that the POST request was called with the correct URL and data
      verify(mockDio.post(
        '$backendUrl$endpoint',
        data: {'user_id': 1},
        options: anyNamed('options'),
      )).called(1);

      // Assert
      expect(result, isA<Map<String, dynamic>>());
      expect(result['success'], equals(true));
      expect(result['message'], equals("A new verification link has been sent to your email address. Please verify your email before logging in."));

    });

    test('ResendVerificationEmail when missing params', () async {
      // Arrange
      const endpoint = '/accounts/send-verification-email-link/';
      final mockResponse = Response(
        requestOptions: RequestOptions(path: backendUrl + endpoint),
        statusCode: 400,
        data: {'message': "User id is required", 'success': false},
      );

      // Mock the Dio post method
      when(mockDio.post(
        '$backendUrl$endpoint',
        data: {},
        options: anyNamed('options'),
      )).thenAnswer((_) async => mockResponse);


      // Act
      final result = await UnauthenticatedApiBackendService.resendVerificationEmail(
        data: {},
        dio: mockDio,
      );      
      // Verify that the POST request was called with the correct URL and data
      verify(mockDio.post(
        '$backendUrl$endpoint',
        data: {},
        options: anyNamed('options'),
      )).called(1);

      // Assert
      expect(result, isA<Map<String, dynamic>>());
      expect(result['success'], equals(false));
      expect(result['message'], equals("User id is required"));
      
    });

    test('ResendVerificationEmail when email is validated', () async {
      // Arrange
      const endpoint = '/accounts/send-verification-email-link/';
      final mockResponse = Response(
        requestOptions: RequestOptions(path: backendUrl + endpoint),
        statusCode: 400,
        data: {'message': "Your email is already verified. Try to sign in.", 'success': false},
      );

      // Mock the Dio post method
      when(mockDio.post(
        '$backendUrl$endpoint',
        data: {'user_id': 1},
        options: anyNamed('options'),
      )).thenAnswer((_) async => mockResponse);


      // Act
      final result = await UnauthenticatedApiBackendService.resendVerificationEmail(
        data: {'user_id': 1},
        dio: mockDio,
      );      
      // Verify that the POST request was called with the correct URL and data
      verify(mockDio.post(
        '$backendUrl$endpoint',
        data: {'user_id': 1},
        options: anyNamed('options'),
      )).called(1);

      // Assert
      expect(result, isA<Map<String, dynamic>>());
      expect(result['success'], equals(false));
      expect(result['message'], equals("Your email is already verified. Try to sign in."));
      
    });

    test('ResendVerificationEmail should return timeout error on network issue', () async {
      // Arrange
      const endpoint = '/accounts/send-verification-email-link/';
      when(mockDio.post('$backendUrl$endpoint', data: {'user_id': 1}, options: anyNamed('options'),)).thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
        type: DioExceptionType.connectionTimeout,
      ));
      
      final result = await UnauthenticatedApiBackendService.resendVerificationEmail(data: {'user_id': 1}, dio: mockDio);

      expect(result['success'], false);
      expect(result['message'], 'Connection timeout. Please check your internet connection.');
    });

    
    test('ResendVerificationEmail should return timeout error on server issue', () async {
      // Arrange
      const endpoint = '/accounts/send-verification-email-link/';
      when(mockDio.post('$backendUrl$endpoint', data: {'user_id': 1}, options: anyNamed('options'),)).thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
        type: DioExceptionType.receiveTimeout,
      ));
      

      final result = await UnauthenticatedApiBackendService.resendVerificationEmail(data: {'user_id': 1}, dio: mockDio);

      expect(result['success'], false);
      expect(result['message'], 'Server took too long to respond (Send verivication email). Please try again later.');
    });
  });

}
