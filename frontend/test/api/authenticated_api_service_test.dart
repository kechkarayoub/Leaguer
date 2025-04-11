import 'package:dio/dio.dart';
import 'package:firebase_auth_mocks/firebase_auth_mocks.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/api/authenticated_api_service.dart';
import 'package:frontend/api/unauthenticated_api_service.dart';
import 'package:frontend/storage/storage.dart';
import 'package:google_sign_in_mocks/google_sign_in_mocks.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';

import '../mocks/mocks.mocks.dart';

// Generate mock Dio class
@GenerateMocks([Dio])

class MockStorageService extends Mock implements StorageService {}

void main() async {
  await dotenv.load(fileName: ".env");
  group('AuthenticatedApiBackendService Tests', () {
    late AuthenticatedApiBackendService apiService; 
    late MockSecureStorageService mockSecureStorageService;
    late MockStorageService mockStorageService;
    late MockDio mockDio;
    bool sessionExpiredCalled = false;
    late ThirdPartyAuthService thirdPartyAuthService;
    late MockFirebaseAuth mockAuth;
    late MockGoogleSignIn mockGoogleSignIn;

    setUp(() async{
      mockDio = MockDio();
      mockSecureStorageService = MockSecureStorageService();
      mockStorageService = MockStorageService();
      mockAuth = MockFirebaseAuth();
      mockGoogleSignIn = MockGoogleSignIn();
      thirdPartyAuthService = ThirdPartyAuthService(auth: mockAuth, googleSignIn: mockGoogleSignIn);
      // ✅ Stub `options` to prevent "MissingStubError: options"
      when(mockDio.options).thenReturn(BaseOptions());

      // ✅ Stub `interceptors` to prevent "MissingStubError: interceptors"
      when(mockDio.interceptors).thenReturn(Interceptors());
        // ✅ Stub `getAccessToken()` properly
      when(mockSecureStorageService.getAccessToken())
          .thenAnswer((_) async => 'mock_token');

      apiService = AuthenticatedApiBackendService(
        dio: mockDio,
        secureStorageService: mockSecureStorageService,
        storageService: mockStorageService,
        onSessionExpired: () {
          sessionExpiredCalled = true;
        },
        thirdPartyAuthService: thirdPartyAuthService,
      );
    });

    test("Attaches Access Token to Requests", () async {
      //when(mockSecureStorageService.getAccessToken()).thenAnswer((_) async => 'mock_token');

      final options = RequestOptions(path: '/test');
      await apiService.attachAccessToken(options);

      expect(options.headers['Authorization'], 'Bearer mock_token');
    });
    test("Handles 401 Unauthorized by Refreshing Token", () async {
      when(mockSecureStorageService.getRefreshToken()).thenAnswer((_) async => 'mock_refresh_token');
      when(mockDio.post(any, data: anyNamed('data'))).thenAnswer(
        (_) async => Response(
          requestOptions: RequestOptions(path: '/accounts/api/token/refresh/'),
          statusCode: 200,
          data: {
            'access': 'new_access_token',
            'refresh': 'new_refresh_token',
          },
        ),
      );

      bool refreshed = await apiService.refreshToken();
      expect(refreshed, true);
      verify(mockSecureStorageService.saveTokens('new_access_token', 'new_refresh_token')).called(1);
    });

    test("Handles Session Expiry When Refresh Fails", () async {
      when(mockSecureStorageService.getRefreshToken()).thenAnswer((_) async => null);
      bool refreshed = await apiService.refreshToken();

      expect(refreshed, false);
      expect(sessionExpiredCalled, true); // Ensure callback was triggered
    });
  });
  group('Refresh token', () {
    late AuthenticatedApiBackendService apiService; 
    late MockSecureStorageService mockSecureStorageService;
    late MockStorageService mockStorageService;
    late MockDio mockDio;
    bool sessionExpiredCalled = false;
    late ThirdPartyAuthService thirdPartyAuthService;
    late MockFirebaseAuth mockAuth;
    late MockGoogleSignIn mockGoogleSignIn;
    String testBackendUrl = dotenv.env['BACKEND_URL']??"";
    setUp(() async{
      mockDio = MockDio();
      mockSecureStorageService = MockSecureStorageService();
      mockStorageService = MockStorageService();
      mockAuth = MockFirebaseAuth();
      mockGoogleSignIn = MockGoogleSignIn();
      thirdPartyAuthService = ThirdPartyAuthService(auth: mockAuth, googleSignIn: mockGoogleSignIn);
      // ✅ Stub `options` to prevent "MissingStubError: options"
      when(mockDio.options).thenReturn(BaseOptions());

      // ✅ Stub `interceptors` to prevent "MissingStubError: interceptors"
      when(mockDio.interceptors).thenReturn(Interceptors());
        // ✅ Stub `getAccessToken()` properly
      when(mockSecureStorageService.getAccessToken())
          .thenAnswer((_) async => 'mock_token');

      apiService = AuthenticatedApiBackendService(
        dio: mockDio,
        secureStorageService: mockSecureStorageService,
        storageService: mockStorageService,
        onSessionExpired: () {
          sessionExpiredCalled = true;
        },
        thirdPartyAuthService: thirdPartyAuthService,
      );
    });

    test('Successfully refreshes tokens', () async {
      // Arrange
      const refreshToken = 'test-refresh-token';
      const newAccessToken = 'new-access-token';
      const newRefreshToken = 'new-refresh-token';
      
      when(mockSecureStorageService.getRefreshToken())
          .thenAnswer((_) async => refreshToken);
          
      when(mockDio.post(
        '$testBackendUrl/accounts/api/token/refresh/',
        data: {'refresh': refreshToken},
      )).thenAnswer((_) async => Response(
        data: {
          'access': newAccessToken,
          'refresh': newRefreshToken,
        },
        statusCode: 200,
        requestOptions: RequestOptions(path: ''),
      ));
      
      when(mockSecureStorageService.saveTokens(newAccessToken, newRefreshToken))
          .thenAnswer((_) async {});
      
      // Act
      final result = await apiService.refreshToken();
      
      // Assert
      expect(result, true);
      verify(mockSecureStorageService.getRefreshToken()).called(1);
      verify(mockDio.post(
        '$testBackendUrl/accounts/api/token/refresh/',
        data: {'refresh': refreshToken},
      )).called(1);
      verify(mockSecureStorageService.saveTokens(newAccessToken, newRefreshToken)).called(1);
    });

    test('Returns false when refresh token is null', () async {
      // Arrange
      when(mockSecureStorageService.getRefreshToken())
          .thenAnswer((_) async => null);
      when(mockDio.post(
        '$testBackendUrl/accounts/api/token/refresh/',
        data: {'refresh': null},
      )).thenAnswer((_) async => Response(
        statusCode: 400,
        requestOptions: RequestOptions(path: ''),
      ));
      // Act
      final result = await apiService.refreshToken();
      
      // Assert
      expect(result, false);
      expect(sessionExpiredCalled, true);
      verify(mockDio.post(
        '$testBackendUrl/accounts/api/token/refresh/',
        data: {'refresh': null},
      )).called(1);
      verifyNever(mockDio.post(any, data: anyNamed('data')));
    });

    test('Returns false when API call fails', () async {
      // Arrange
      const refreshToken = 'test-refresh-token';
      
      when(mockSecureStorageService.getRefreshToken())
          .thenAnswer((_) async => refreshToken);
          
      when(mockDio.post(
        '$testBackendUrl/accounts/api/token/refresh/',
        data: {'refresh': refreshToken},
      )).thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
        response: Response(
          statusCode: 400,
          requestOptions: RequestOptions(path: ''),
        ),
      ));
      
      // Act
      final result = await apiService.refreshToken();
      
      // Assert
      expect(result, false);
      verify(mockSecureStorageService.getRefreshToken()).called(1);
      verify(mockDio.post(
        '$testBackendUrl/accounts/api/token/refresh/',
        data: {'refresh': refreshToken},
      )).called(1);
    });

    test('Returns false when response is not 200', () async {
      // Arrange
      const refreshToken = 'test-refresh-token';
      
      when(mockSecureStorageService.getRefreshToken())
          .thenAnswer((_) async => refreshToken);
          
      when(mockDio.post(
        '$testBackendUrl/accounts/api/token/refresh/',
        data: {'refresh': refreshToken},
      )).thenAnswer((_) async => Response(
        data: {'error': 'invalid_token'},
        statusCode: 401,
        requestOptions: RequestOptions(path: ''),
      ));
      
      // Act
      final result = await apiService.refreshToken();
      
      // Assert
      expect(result, false);
      verify(mockSecureStorageService.getRefreshToken()).called(1);
      verify(mockDio.post(
        '$testBackendUrl/accounts/api/token/refresh/',
        data: {'refresh': refreshToken},
      )).called(1);
    });
  
  });

  group('UpdateProfile', () {
    late AuthenticatedApiBackendService apiService;
    late MockDio mockDio;
    late MockSecureStorageService mockSecureStorage;
    late MockStorageService mockStorage;
    late ThirdPartyAuthService thirdPartyAuthService;
    late MockFirebaseAuth mockAuth;
    late MockGoogleSignIn mockGoogleSignIn;
    bool sessionExpiredCalled = false;
    String testBackendUrl = dotenv.env['BACKEND_URL']??"";

    setUp(() {
      mockDio = MockDio();
      mockSecureStorage = MockSecureStorageService();
      mockStorage = MockStorageService();
      mockAuth = MockFirebaseAuth();
      mockGoogleSignIn = MockGoogleSignIn();
      thirdPartyAuthService = ThirdPartyAuthService(auth: mockAuth, googleSignIn: mockGoogleSignIn);
      
      when(mockDio.options).thenReturn(BaseOptions(
        baseUrl: testBackendUrl,
        headers: {'Content-Type': 'application/json'},
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
      ));
      
      // Mock the interceptors property
      when(mockDio.interceptors).thenReturn(Interceptors());
      
      // Mock token attachment
      when(mockSecureStorage.getAccessToken())
          .thenAnswer((_) async => 'test-access-token');
      apiService = AuthenticatedApiBackendService(
        dio: mockDio,
        secureStorageService: mockSecureStorage,
        storageService: mockStorage,
        onSessionExpired: () {
          sessionExpiredCalled = true;
        },
        thirdPartyAuthService: thirdPartyAuthService,
      );
      
      
      // Mock default token attachment
      when(mockSecureStorage.getAccessToken())
          .thenAnswer((_) async => 'test-access-token');
    });
    test('Successful profile update returns response data', () async {
      // Arrange
      final testData = {'name': 'New Name'};
      final responseData = {'success': true, 'user': {'name': 'New Name'}};
      
      when(mockDio.put(
        '$testBackendUrl/accounts/update-profile/',
        data: testData,
      )).thenAnswer((_) async => Response(
        data: responseData,
        statusCode: 200,
        requestOptions: RequestOptions(path: ''),
      ));

      // Act
      final result = await apiService.updateProfile(formData: testData);

      // Assert
      expect(result, responseData);
      verify(mockDio.put(
        '$testBackendUrl/accounts/update-profile/',
        data: testData,
      )).called(1);
    });

    test('Handles 400 Bad Request response', () async {
      // Arrange
      final testData = {'name': ''}; // Invalid empty name
      final errorResponse = {'error': 'Name cannot be empty'};
      
      when(mockDio.put(
        '$testBackendUrl/accounts/update-profile/',
        data: testData,
      )).thenAnswer((_) async => Response(
        data: errorResponse,
        statusCode: 400,
        requestOptions: RequestOptions(path: ''),
      ));

      // Act
      final result = await apiService.updateProfile(formData: testData);

      // Assert
      expect(result, errorResponse);
    });

    test('Handles 401 Unauthorized with token refresh', () async {
      // Arrange
      final formData = FormData();
      formData.fields.add(MapEntry('name', 'New Name'));
      when(apiService.refreshToken()).thenAnswer((_) async => true);
      // First call - 401 response
      when(mockDio.put(
        '$testBackendUrl/accounts/update-profile/',
        data: formData,
      )).thenAnswer((_) async => Response(
        statusCode: 401,
        requestOptions: RequestOptions(path: ''),
      ));
      
      // Mock successful token refresh
      when(mockSecureStorage.getRefreshToken())
          .thenAnswer((_) async => 'refresh-token');
      when(mockDio.post(
        '$testBackendUrl/accounts/api/token/refresh/',
        data: {'refresh': 'refresh-token'},
      )).thenAnswer((_) async => Response(
        data: {'access': 'new-access', 'refresh': 'new-refresh'},
        statusCode: 200,
        requestOptions: RequestOptions(path: ''),
      ));
      
      // Second call after refresh - success
      when(mockDio.put(
        '$testBackendUrl/accounts/update-profile/',
        data: formData,
      )).thenAnswer((_) async => Response(
        data: {'success': true},
        statusCode: 200,
        requestOptions: RequestOptions(path: ''),
      ));

      // Act
      final result = await apiService.updateProfile(formData: formData);

      // Assert
      expect(result, {'success': true});
      verify(mockDio.put(
        '$testBackendUrl/accounts/update-profile/',
        data: formData,
      )).called(1); // Not called twice (initial + after refresh) because second claa should be called with new dada
    });

    test('Handles 409 Conflict response', () async {
      // Arrange
      final testData = {'email': 'existing@example.com'};
      final conflictResponse = {'error': 'Email already exists'};
      
      when(mockDio.put(
        '$testBackendUrl/accounts/update-profile/',
        data: testData,
      )).thenAnswer((_) async => Response(
        data: conflictResponse,
        statusCode: 409,
        requestOptions: RequestOptions(path: ''),
      ));

      // Act
      final result = await apiService.updateProfile(formData: testData);

      // Assert
      expect(result, conflictResponse);
    });

    test('Handles Dio connection timeout', () async {
      // Arrange
      final testData = {'name': 'New Name'};
      
      when(mockDio.put(
        '$testBackendUrl/accounts/update-profile/',
        data: testData,
      )).thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
        type: DioExceptionType.connectionTimeout,
      ));

      // Act
      final result = await apiService.updateProfile(formData: testData);

      // Assert
      expect(result, {
        'success': false,
        'message': 'Connection timeout. Please check your internet connection.'
      });
    });

    test('Handles Dio receive timeout', () async {
      // Arrange
      final testData = {'name': 'New Name'};
      
      when(mockDio.put(
        '$testBackendUrl/accounts/update-profile/',
        data: testData,
      )).thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
        type: DioExceptionType.receiveTimeout,
      ));

      // Act
      final result = await apiService.updateProfile(formData: testData);

      // Assert
      expect(result, {
        'success': false,
        'message': 'Server took too long to respond (Update profile). Please try again later.'
      });
    });

    test('Handles FormData requests', () async {
      // Arrange
      final formData = FormData();
      formData.fields.add(MapEntry('name', 'New Name'));
      final responseData = {'success': true};
      
      when(mockDio.put(
        '$testBackendUrl/accounts/update-profile/',
        data: formData,
      )).thenAnswer((_) async => Response(
        data: responseData,
        statusCode: 200,
        requestOptions: RequestOptions(path: ''),
      ));

      // Act
      final result = await apiService.updateProfile(formData: formData);

      // Assert
      expect(result, responseData);
    });

  });

}
