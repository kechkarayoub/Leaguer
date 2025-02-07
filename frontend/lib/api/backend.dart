import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:dio/dio.dart';
import 'package:frontend/utils/utils.dart';

class ApiBackendService {
    /// This service handles communication with the backend API.
  static String backendUrl = dotenv.env['BACKEND_URL'] ?? 'Backend URL not found';
    
  static Future<Map<String, dynamic>> signInUser({
    required dynamic data,
    Dio? dio,  // Client HTTP optionnel
  }) async {
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
    dio ??= Dio(); // Utiliser le client par défaut si aucun n'est fourni
    final url = '$backendUrl/accounts/log-in/';
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
      } else {
        // Throw an exception if the response is not successful
        throw Exception('Failed to sign in: ${response.data}');
      }
    } catch (e) {
      // Handle error and rethrow or log
      throw Exception('Error during sign-in: ${e.toString()}');
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
