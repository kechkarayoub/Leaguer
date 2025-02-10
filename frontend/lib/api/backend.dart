import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:dio/dio.dart';
import 'package:frontend/utils/utils.dart';

class ApiBackendService {
    /// This service handles communication with the backend API.
  static String backendUrl = dotenv.env['BACKEND_URL'] ?? 'Backend URL not found';
    
  
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
    }  on DioException catch (e) {  print('DioException caught: ${e.type}');

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
      logMessage('Unexpected error during resending verification email link: $e', 'ApiBackendService.resendVerificationEmail', "e");
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
      logMessage('Unexpected error during sign-in: $e', 'ApiBackendService.signInUser', "e");
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
    try{
      final response = await dio.post(
        url,
        data: formData,
        options: Options(
          headers: {
            "Content-Type": "multipart/form-data",
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
