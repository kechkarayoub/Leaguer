import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/api/authenticated_api_service.dart';
import 'package:frontend/storage/storage.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';

import '../mocks.mocks.dart';

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

  setUp(() async{
    mockDio = MockDio();
    mockSecureStorageService = MockSecureStorageService();
    mockStorageService = MockStorageService();
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
            'access_token': 'new_access_token',
            'refresh_token': 'new_refresh_token',
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
}
