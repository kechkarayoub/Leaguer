import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:frontend/services/device_id_service.dart';
import 'package:frontend/utils/platform_detector.dart';
import 'package:frontend/utils/utils.dart';
import 'package:google_sign_in/google_sign_in.dart';


/// Service class to handle third-party authentication (Google, Apple,...).
class ThirdPartyAuthService {

  final FirebaseAuth _auth;
  /// Google Sign-In instance with client ID (only required for web).
  final GoogleSignIn _googleSignIn;

  ThirdPartyAuthService({
    FirebaseAuth? auth,
    GoogleSignIn? googleSignIn,
  })  : _auth = auth ?? FirebaseAuth.instance,
        _googleSignIn = googleSignIn ?? GoogleSignIn(
          clientId: !kIsWeb && Platform.isIOS ? dotenv.env['GOOGLE_SIGN_IN_IOS_CLIENT_ID']
            : !kIsWeb && Platform.isAndroid ? dotenv.env['GOOGLE_SIGN_IN_ANDROID_CLIENT_ID']
            : dotenv.env['GOOGLE_SIGN_IN_WEB_CLIENT_ID'],
        );

  /// Signs in the user using Google authentication.
  ///
  /// Returns a [UserCredential] if successful, otherwise returns `null`.
  Future<UserCredential?> signInWithGoogle() async {
    
    final platform = getPlatformType();
    try{
      if (platform == PlatformType.web) {
        // 🌐 Web-specific Google Sign-In
        GoogleAuthProvider googleProvider = GoogleAuthProvider();
        return await _auth.signInWithPopup(googleProvider);
      } 
      else {
        // 📱 Native Google Sign-In (Android & iOS)
        final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
        if (googleUser == null){
          // Google sign-in canceled by user.
          return null;
        }

        // Retrieve authentication details
        final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
        
        // Create a credential for Firebase authentication
        final OAuthCredential credential = GoogleAuthProvider.credential(
          accessToken: googleAuth.accessToken,
          idToken: googleAuth.idToken,
        );
        
        // Sign in to Firebase with the generated credentials
        return await _auth.signInWithCredential(credential);
      }
    }
    catch(e){
      logMessage(e, "Google Sign-In Error", "e");
      return null;
    }
  }

  /// Signs out the user from Google authentication.
  ///
  /// Works for both Web and Native platforms.
  Future<void> signOut() async {
    final platform = getPlatformType();
    try{
      await _auth.signOut();
      if (platform != PlatformType.web) await _googleSignIn.signOut();
    }
    catch(e){
      logMessage(e, "Google Sign-Out Error", "e");
    }
  }
}


class UnauthenticatedApiBackendService {
    /// This service handles communication with the backend API.
  static String backendUrl = dotenv.env['BACKEND_URL'] ?? 'Backend URL not found';
    
  /// Helper method to add device ID to HTTP requests
  static Future<void> addDeviceIdToRequest(Dio dio) async {
    final deviceId = await DeviceIdService.instance.getDeviceId();
    dio.options.headers['X-Device-ID'] = deviceId;
  }
  
  /// Get geolocation info from user IP.
  ///
  /// Parameters:
  /// - `data`: Map containing request parameters including 'requested_info'.
  /// - `dio`: Optional custom Dio HTTP client instance.
  ///
  /// Returns:
  /// - A `Map<String, dynamic>` containing the geolocation info or String for country code.
  /// - Returns default country code if only countryCode is requested and request fails.
  ///
  /// Throws:
  /// - Exception if there is an error during the HTTP request.
  static Future<dynamic> getGeolocationInfo({
    required Map<String, dynamic> data,
    Dio? dio,  // Client HTTP optionnel
  }) async {
    dio ??= Dio(); // Utiliser le client par défaut si aucun n'est fourni
    String defaultCountryCode = dotenv.env['DEFAULT_COUNTRY_CODE'] ?? 'MA';
    
    bool isDevelopment = (dotenv.env['PIPLINE'] ?? 'production') == "development";
    bool isProductionUrl = (dotenv.env['BACKEND_URL'] ?? 'localhost').contains(".com");
    
    String url = '$backendUrl/geolocation';
    Map<String, dynamic> queryParams = {...data};
    if (isDevelopment && isProductionUrl) {
      final params = data.entries.map((e) => '${e.key}=${e.value}').join('&');
      url = 'https://api.allorigins.win/get?url=${Uri.encodeComponent('$backendUrl/geolocation?$params')}';
      queryParams = {};
    }
    try{
      final response = await dio.get(
        url,
        queryParameters: queryParams,
        options: Options(
          headers: {
            'X-Requested-With': 'XMLHttpRequest', // Required by CORS Anywhere
          },
        ),
      );
      if (response.statusCode == 200) {
        // Parse the JSON response and return it
        
        dynamic content;
        if (response.data is Map && response.data.containsKey('content')) {
          // Handle allorigins.win response
          content = response.data['content'];
          if (content is String) {
            content = jsonDecode(content);
          }
        } else {
          // Handle direct response
          content = response.data;
        }
        return data['requested_info'] == "countryCode"  ? content['countryCode'] ?? defaultCountryCode : content;
      } else {
        logMessage(response.statusCode, "Failed to get IP information", "e");
      }
    }  on DioException catch (e) {  
        logMessage(e, "Exception when get IP information", "e");
    } catch (e) {
        logMessage(e, "Unkown error when get IP information", "e");
    }
    return data['requested_info'] == "countryCode" ? defaultCountryCode : null;
  }

    
  
  /// Resend a verification email link to the user email.
  ///
  /// Parameters:
  /// - `data`: The user credentials or authentication data to be sent.
  /// - `dio`: Optional custom Dio HTTP client instance.
  ///
  /// Returns:
  /// - A `Map<String, dynamic>` containing the JSON response data if successful.
  ///
  /// Throws:
  /// - Exception if the resend the verification email link fails or there is an error during the HTTP request.
  static Future<Map<String, dynamic>> resendVerificationEmail({
    required dynamic data,
    Dio? dio,  // Client HTTP optionnel
  }) async {
    dio ??= Dio(); // Utiliser le client par défaut si aucun n'est fourni
    final url = '$backendUrl/accounts/send-verification-email-link/';
    try{
      final response = await dio.post(
        url,
        data: data,
        options: Options(
          headers: {'Content-Type': 'application/json'},
        ),
      );

      if (response.statusCode == 200) {
        // Parse the JSON response and return it
        return response.data;
      } 
      else if (response.statusCode == 400 || response.statusCode == 401) {
        // Parse the JSON response and return it
        return response.data ?? {'message': "An unknown error occurred while resending the verification email link. Please contact the technical team to resolve your issue."};
      } 
      else {
        // Throw an exception if the response is not successful
        throw Exception('Failed to resend verification email link: ${response.data}');
      }
    }  on DioException catch (e) {  

      // Handle error and rethrow or log
      if (e.type == DioExceptionType.connectionTimeout) {
        return {'success': false, 'message': "Connection timeout. Please check your internet connection."};
      }
      if (e.type == DioExceptionType.receiveTimeout) {
        return {'success': false, 'message': "Server took too long to respond (Send verivication email). Please try again later."};
      }
      if (e.response?.statusCode == 400 || e.response?.statusCode == 401) {
        // Parse the JSON response and return it
        return e.response?.data ?? {'message': "An unknown error occurred while resending the verification email link. Please contact the technical team to resolve your issue."};
      } 
      logMessage(e, "Resending the verification email link error", "e");
      throw Exception('Failed to resend verification email link: ${e.toString()}');
    } catch (e) {
      logMessage('Unexpected error during resending verification email link: $e', 'UnauthenticatedApiBackendService.resendVerificationEmail', "e");
      return {'success': false, 'message': 'An unexpected error occurred. Please try again later.'};
    }
  }

   
  
  /// Signs in a user by sending the provided data to the backend.
  ///
  /// Parameters:
  /// - `data`: The user credentials or authentication data to be sent.
  /// - `dio`: Optional custom Dio HTTP client instance.
  ///
  /// Returns:
  /// - A `Map<String, dynamic>` containing the JSON response data if successful.
  ///
  /// Throws:
  /// - Exception if the sign-in fails or there is an error during the HTTP request.
  static Future<Map<String, dynamic>> signInUser({
    required dynamic data,
    Dio? dio,  // Client HTTP optionnel
  }) async {
    dio ??= Dio(BaseOptions(
      connectTimeout: const Duration(seconds: 10), // Timeout de connexion
      receiveTimeout: const Duration(seconds: 10), // Timeout de réception
      headers: {'Content-Type': 'application/json'},
    )); // Utiliser le client par défaut si aucun n'est fourni
    final url = '$backendUrl/accounts/sign-in/';
    
    // Add device ID to request
    await addDeviceIdToRequest(dio);
    
    try{
      final response = await dio.post(
        url,
        data: data,
      );

      if (response.statusCode == 200) {
        // Parse the JSON response and return it
        return response.data;
      } 
      else if (response.statusCode == 400 || response.statusCode == 401) {
        // Parse the JSON response and return it
        return response.data ?? {'message': "An unknown error occurred during sign-in. Please contact the technical team to resolve your issue."};
      } 
      else {
        // Throw an exception if the response is not successful
        throw Exception('Failed to sign in: ${response.data}');
      }
    } on DioException catch (e) {
      // Handle error and rethrow or log
      if (e.type == DioExceptionType.connectionTimeout) {
        return {'success': false, 'message': "Connection timeout. Please check your internet connection."};
      }
      if (e.type == DioExceptionType.receiveTimeout) {
        return {'success': false, 'message': "Server took too long to respond (Sign in). Please try again later."};
      }
      if (e.response?.statusCode == 400 || e.response?.statusCode == 401) {
        // Parse the JSON response and return it
        return e.response?.data ?? {'message': "An unknown error occurred during sign-in. Please contact the technical team to resolve your issue."};
      } 
      logMessage(e, "Sign-in error", "e");
      throw Exception('Failed to sign in: ${e.toString()}');
    } catch (e) {
      logMessage('Unexpected error during sign-in: $e', 'UnauthenticatedApiBackendService.signInUser', "e");
      return {'success': false, 'message': 'An unexpected error occurred. Please try again later.'};
    }
  }

   
  
  /// Signs in a user by sending the provided from third party data to the backend.
  ///
  /// Parameters:
  /// - `data`: The user credentials or authentication data to be sent.
  /// - `dio`: Optional custom Dio HTTP client instance.
  ///
  /// Returns:
  /// - A `Map<String, dynamic>` containing the JSON response data if successful.
  ///
  /// Throws:
  /// - Exception if the sign-in fails or there is an error during the HTTP request.
  static Future<Map<String, dynamic>> signInUserWithThirdParty({
    required dynamic data,
    Dio? dio,  // Client HTTP optionnel
  }) async {
    dio ??= Dio(BaseOptions(
      connectTimeout: const Duration(seconds: 10), // Timeout de connexion
      receiveTimeout: const Duration(seconds: 10), // Timeout de réception
      headers: {'Content-Type': 'application/json'},
    )); // Utiliser le client par défaut si aucun n'est fourni
    final url = '$backendUrl/accounts/sign-in-third-party/';
    
    // Add device ID to request
    await addDeviceIdToRequest(dio);
    
    try{
      final response = await dio.post(
        url,
        data: data,
      );

      if (response.statusCode == 200) {
        // Parse the JSON response and return it
        return response.data;
      } 
      else if (response.statusCode == 400 || response.statusCode == 401) {
        // Parse the JSON response and return it
        return response.data ?? {'message': "An unknown error occurred during sign-in. Please contact the technical team to resolve your issue."};
      } 
      else {
        // Throw an exception if the response is not successful
        throw Exception('Failed to sign in with third party: ${response.data}');
      }
    } on DioException catch (e) {
      // Handle error and rethrow or log
      if (e.type == DioExceptionType.connectionTimeout) {
        return {'success': false, 'message': "Connection timeout. Please check your internet connection."};
      }
      if (e.type == DioExceptionType.receiveTimeout) {
        return {'success': false, 'message': "Server took too long to respond (Sign in). Please try again later."};
      }
      if (e.response?.statusCode == 400 || e.response?.statusCode == 401) {
        // Parse the JSON response and return it
        return e.response?.data ?? {'message': "An unknown error occurred during sign-in. Please contact the technical team to resolve your issue."};
      } 
      logMessage(e, "Sign-in third party error", "e");
      throw Exception('Failed to sign in with third party: ${e.toString()}');
    } catch (e) {
      logMessage('Unexpected error during sign-in with third party: $e', 'UnauthenticatedApiBackendService.signInUserWithThirdParty', "e");
      return {'success': false, 'message': 'An unexpected error occurred. Please try again later.'};
    }
  }


  /// Signs up a user by sending the provided data to the backend.
  ///
  /// Parameters:
  /// - `formData`: The user info data to be sent.
  /// - `dio`: Optional custom Dio HTTP client instance.
  ///
  /// Returns:
  /// - A `Map<String, dynamic>` containing the JSON response data if successful.
  ///
  /// Throws:
  /// - Exception if the request fails or returns an unexpected response.
  static Future<Map<String, dynamic>> signUpUser({
    required dynamic formData,
    Dio? dio,  // Client HTTP optionnel
  }) async {
    dio ??= Dio(); // Utiliser le client par défaut si aucun n'est fourni
    final url = '$backendUrl/accounts/sign-up/';
    
    // Add device ID to request
    final deviceId = await DeviceIdService.instance.getDeviceId();
    
    try{
      final response = await dio.post(
        url,
        data: formData,
        options: Options(
          headers: {
            "Content-Type": "multipart/form-data",
            "X-Device-ID": deviceId,
          },
        ),
      );
      if (response.statusCode == 201) {
        // Parse the JSON response and return it
        return response.data;
      } 
      else if (response.statusCode == 409) {
        // Parse the JSON response and return it
        return response.data ?? {'message': "Unknown conflict error during sign-up. Please contact the technical team to resolve your issue."};
      } 
      else {
        // Throw an exception if the response is not successful
        throw Exception('Failed to sign up: ${response.data}');
      }
    } on DioException catch (e) {
      // Handle error and rethrow or log
      if (e.response?.statusCode == 409) {
        // Parse the JSON response and return it
        return e.response?.data ?? {'message': "Unknown conflict error during sign-up. Please contact the technical team to resolve your issue."};
      } 
      logMessage(e, "Sign-up error", "e");
      throw Exception('Failed to sign up: ${e.toString()}');
    }
  }

}
