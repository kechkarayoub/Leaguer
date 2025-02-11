import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:frontend/utils/utils.dart';
import 'package:frontend/storage/storage.dart';


/// Global key to access the current context if not passed
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

/// A service that handles authenticated requests to the backend API.
/// Automatically attaches an access token to requests and refreshes tokens when expired.
class AuthenticatedApiBackendService {
  /// Backend API base URL, loaded from environment variables
  static String backendUrl = dotenv.env['BACKEND_URL'] ?? 'Backend URL not found';
    
  
  /// Constructor: Initializes Dio and sets up request interceptors.
  final Dio _dio;
  final SecureStorageService _secureStorageService;
  final StorageService _storageService;
  final BuildContext? _providedCcontext;
  bool _isLoggingOut = false;

  /// Mockable session expiry callback for testing.
  final VoidCallback? onSessionExpired;

  AuthenticatedApiBackendService({
      Dio? dio, SecureStorageService? secureStorageService, StorageService? storageService, BuildContext? providedContext,
      this.onSessionExpired, // Inject callback for testing
    })
      : _dio = dio ?? Dio(),
        _secureStorageService = secureStorageService ?? SecureStorageService(),
        _storageService = storageService ?? StorageService(),
        _providedCcontext = providedContext {
    _dio.options.baseUrl = backendUrl;
    _dio.options.headers['Content-Type'] = 'application/json';
    _dio.options.connectTimeout = const Duration(seconds: 10);
    _dio.options.receiveTimeout = const Duration(seconds: 10);

    // Attach interceptor
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        await attachAccessToken(options);
        return handler.next(options);
      },
      onError: (DioException error, handler) async {
        // Check if it's an unauthorized error (401)
        if (error.response?.statusCode == 401) {
          bool refreshed = await refreshToken();
          if (refreshed) {
            // Retry the failed request with the new token
            final retryRequest = await _dio.fetch(error.requestOptions);
            return handler.resolve(retryRequest);
          }
          else{
            _handleSessionExpired();
          }
        }
        return handler.next(error);
      },
    ));
  }

  /// Getter to always fetch the latest available context
  BuildContext? get _context => navigatorKey.currentContext??_providedCcontext;

  /// Attaches the access token to each request if available.
  Future<void> attachAccessToken(RequestOptions options) async {
    String? accessToken = await _secureStorageService.getAccessToken();
    if (accessToken != null) {
      options.headers['Authorization'] = 'Bearer $accessToken';
    }
  }

  // Refresh Token Function
  Future<bool> refreshToken() async {
    try {
      String? refreshToken = await _secureStorageService.getRefreshToken();
      if (refreshToken == null){
        _handleSessionExpired();
      }
      final response = await _dio.post('$backendUrl/api/token/refresh/', data: {
        'refresh_token': refreshToken,
      });

      if (response.statusCode == 200) {
        String newAccessToken = response.data['access_token'];
        String newRefreshToken = response.data['refresh_token'];

        // Save the new tokens
        await _secureStorageService.saveTokens(newAccessToken, newRefreshToken);

        return true;
      }
    } catch (e) {
      logMessage('Token refresh failed: $e', "Token refresh", "e");
    }
    return false;
  }
   void _handleSessionExpired() async {
    if (onSessionExpired != null) {
      onSessionExpired!(); // Call testable callback instead of UI code
      return;
    }
    if (_context != null && !_isLoggingOut) {
      _isLoggingOut = true;
      logout(_storageService, _secureStorageService, _context!).then((_) {
        _isLoggingOut = false;
      });
      logMessage('Session expired. Please log in again.', "Auth", "e");
    }
  }

  /// Expose `_dio` for testing
  Dio get dio => _dio;
  
}
