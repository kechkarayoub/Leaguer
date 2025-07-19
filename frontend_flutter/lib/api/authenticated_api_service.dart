import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:frontend_flutter/api/unauthenticated_api_service.dart';
import 'package:frontend_flutter/services/device_id_service.dart';
import 'package:frontend_flutter/utils/utils.dart';
import 'package:frontend_flutter/storage/storage.dart';


/// Global key to access the current context if not passed
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

/// A service that handles authenticated requests to the backend API.
/// 
/// This service automatically:
/// - Attaches access tokens to outgoing requests
/// - Refreshes tokens when they expire
/// - Handles session expiration by logging out the user
/// 
/// Dependencies:
/// - [Dio] for HTTP requests
/// - [SecureStorageService] for token storage
/// - [StorageService] for local storage
/// - [ThirdPartyAuthService] for third-party authentication
class AuthenticatedApiBackendService {
  /// Backend API base URL, loaded from environment variables
  static String backendUrl = dotenv.env['BACKEND_ENDPOINT'] ?? 'Backend URL not found';
    
  
  /// Constructor: Initializes Dio and sets up request interceptors.
  final Dio _dio;
  final SecureStorageService _secureStorageService;
  final StorageService _storageService;
  final BuildContext? _providedCcontext;
  bool _isLoggingOut = false;
  bool _isTokenRefreshing = false;

  /// Mockable session expiry callback for testing.
  final VoidCallback? onSessionExpired;
  final ThirdPartyAuthService? thirdPartyAuthService;

  AuthenticatedApiBackendService({
      Dio? dio, SecureStorageService? secureStorageService, StorageService? storageService, BuildContext? providedContext,
      this.onSessionExpired, ThirdPartyAuthService? thirdPartyAuthService, // Inject callback for testing
    })
      : _dio = dio ?? Dio(),
        _secureStorageService = secureStorageService ?? SecureStorageService(),
        _storageService = storageService ?? StorageService(),
        thirdPartyAuthService = thirdPartyAuthService?? ThirdPartyAuthService(),
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
        // Check if it's an unauthorized error (401) when refreshing token
        if (error.response?.statusCode == 401 && _isTokenRefreshing) {
          _isTokenRefreshing = false;
          handleSessionExpired();
        }
        // Check if it's an unauthorized error (401)
        else if (error.response?.statusCode == 401) {
          bool refreshed = await refreshToken();
          if (refreshed) {
            // Create a NEW request options object
            final newOptions = Options(
              method: error.requestOptions.method,
              headers: error.requestOptions.headers,
              extra: error.requestOptions.extra,
              responseType: error.requestOptions.responseType,
            );

            //await attachAccessToken(newOptions);
            // For FormData requests, we need to recreate the data
            dynamic newData = error.requestOptions.data;
            if (error.requestOptions.data is FormData) {
              final originalFormData = error.requestOptions.data as FormData;
              newData = FormData();
              
              // Copy fields
              newData.fields.addAll(originalFormData.fields);
              
              // Copy files (async)
              for (final file in originalFormData.files) {
                  final multipart = file.value.clone();
                  // Collect bytes from the stream
                  final bytes = await readStreamToBytes(multipart.finalize());
                  newData.files.add(MapEntry(
                    file.key,
                    MultipartFile.fromBytes(
                      bytes,
                      filename: multipart.filename,
                      contentType: multipart.contentType,
                    ),
                  ));
              }
            }

            // Retry with new request options
            try {
              final retryRequest = await _dio.request(
                error.requestOptions.path,
                data: newData,
                queryParameters: error.requestOptions.queryParameters,
                options: newOptions,
              );
              return handler.resolve(retryRequest);
            } catch (e) {
              return handler.reject(DioException(requestOptions: error.requestOptions, error: e));
            }
          }
          else{
            handleSessionExpired();
          }
        }
        return handler.next(error);
      },
    ));
  }

  /// Getter to always fetch the latest available context
  BuildContext? get _context => navigatorKey.currentContext??_providedCcontext;

  /// Attaches the access token and device ID to each request if available.
  Future<void> attachAccessToken(RequestOptions options) async {
    String? accessToken = await _secureStorageService.getAccessToken();
    if (accessToken != null) {
      options.headers['Authorization'] = 'Bearer $accessToken';
    }
    
    // Add device ID to all requests
    final deviceId = await DeviceIdService.instance.getDeviceId();
    options.headers['X-Device-ID'] = deviceId;
  }

  /// Attempts to refresh the access token using the stored refresh token.
  /// 
  /// This function is automatically called when a 401 Unauthorized response
  /// is received from the API. It:
  /// 1. Retrieves the refresh token from secure storage
  /// 2. Sends it to the token refresh endpoint
  /// 3. If successful, saves the new tokens and returns true
  /// 4. If failed, triggers session expiration handling and returns false
  /// 
  /// Returns:
  /// - [bool]: true if token refresh succeeded, false otherwise
  /// 
  /// Throws:
  /// - No explicit throws, but logs errors and handles session expiration
  Future<bool> refreshToken() async {
    try {
      _isTokenRefreshing = true;
      String? refreshToken = await _secureStorageService.getRefreshToken();
      if (refreshToken == null){
        handleSessionExpired();
      }
      final response = await _dio.post('$backendUrl/accounts/api/token/refresh/', data: {
        'refresh': refreshToken,
      });

      if (response.statusCode == 200) {
        String newAccessToken = response.data['access'];
        String newRefreshToken = response.data['refresh'];

        // Save the new tokens
        await _secureStorageService.saveTokens(newAccessToken, newRefreshToken);
        _isTokenRefreshing = false;

        return true;
      }
    } catch (e) {
      logMessage('Token refresh failed: $e', "Token refresh", "e");
    }
    return false;
  }
  
  /// Handles user session expiration by either triggering a provided callback
  /// or performing the logout process.
  ///
  /// - If `onSessionExpired` is set, it is called directly.
  /// - If not, the function ensures the logout process runs only once,
  ///   using `_isLoggingOut` to prevent multiple logouts.
  /// - Logs the session expiration for debugging.
  @visibleForTesting
  void handleSessionExpired({StorageService? storageService, SecureStorageService? secureStorageService, BuildContext? context, ThirdPartyAuthService? thirdPartyAuthService}) async {
    
    if (onSessionExpired != null) {
      onSessionExpired!(); // Call testable callback instead of UI code
      return;
    }
    if (!_isLoggingOut) {
      _isLoggingOut = true;
      try{
        await logout(storageService??_storageService, secureStorageService??_secureStorageService, context??_context??_providedCcontext, thirdPartyAuthService??thirdPartyAuthService);
        logMessage('Session expired. Please log in again.', "Auth", "e");
      }
      finally {
        _isLoggingOut = false;
      }
    }
  }

  
   
  
  /// Update user profile by sending the provided data to the backend.
  ///
  /// Parameters:
  /// - `formData`: The user profile data to be sent. Should be a `FormData` or JSON object.
  /// - `dio`: Optional custom Dio HTTP client instance.
  ///
  /// Returns:
  /// - A `Map<String, dynamic>` containing the JSON response data if successful.
  ///
  /// Handles:
  /// - Status codes: 200, 400, 401, 409
  /// - Dio network errors
  /// - Timeouts and unexpected errors
  /// Throws:
  /// - Exception if the update profile fails or there is an error during the HTTP request.
  Future<Map<String, dynamic>> updateProfile({
    required dynamic formData,
    Dio? dio,  // Client HTTP optionnel
  }) async {
    dio ??= _dio; // Utiliser le client par défaut si aucun n'est fourni
    final url = '$backendUrl/accounts/update-profile/';
    try{
      final response = await dio.put(
        url,
        data: formData,
      );

      if (response.statusCode == 200) {
        // Parse the JSON response and return it
        return response.data;
      } 
      else if (response.statusCode == 400) {
        // Parse the JSON response and return it
        return response.data ?? {'message': "An unknown error occurred during the profile update. Please contact the technical team to resolve the issue."};
      } 
      else if (response.statusCode == 401) {
        // Parse the JSON response and return it
        return {'success': false, 'message': 'An unknown error occurred during the profile update. Please contact the technical team to resolve the issue.'};
      } 
      else if (response.statusCode == 409) {
        // Parse the JSON response and return it
        return response.data ?? {'success': false, 'message': "An unknown conflict error occurred during the profile update. Please contact the technical team to resolve this issue."};
      } 
      else {
        // Throw an exception if the response is not successful
        throw Exception('Failed to update profile: ${response.data}');
      }
    } on DioException catch (e) {
      // Handle error and rethrow or log
      if (e.type == DioExceptionType.connectionTimeout) {
        return {'success': false, 'message': "Connection timeout. Please check your internet connection."};
      }
      if (e.type == DioExceptionType.receiveTimeout) {
        return {'success': false, 'message': "Server took too long to respond (Update profile). Please try again later."};
      }
      if (e.response?.statusCode == 400) {
        // Parse the JSON response and return it
        return e.response?.data ?? {'message': "An unknown error occurred during the profile update. Please contact the technical team to resolve the issue."};
      } 
      if (e.response?.statusCode == 401) {
        // Parse the JSON response and return it
        return {'success': false, 'message': 'An unknown error occurred during the profile update. Please contact the technical team to resolve the issue.'};
      } 
      else if (e.response?.statusCode == 409) {
        // Parse the JSON response and return it
        return e.response?.data ?? {'success': false, 'message': 'An unknown conflict error occurred during the profile update. Please contact the technical team to resolve this issue.'};
      } 
      logMessage(e, "Update profile error", "e");
      throw Exception('Failed to update profile: ${e.toString()}');
    } catch (e) {
      logMessage('Unexpected error during update profile: $e', 'AuthenticatedApiBackendService.updateProfile', "e");
      return {'success': false, 'message': 'An unexpected error occurred. Please try again later.'};
    }
  }

   

  /// Expose `_dio` for testing
  Dio get dio => _dio;
  
}
