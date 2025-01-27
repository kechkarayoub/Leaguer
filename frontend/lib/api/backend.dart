import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:dio/dio.dart';

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
    final url = '$backendUrl/accounts/login_with_token/';
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
}
