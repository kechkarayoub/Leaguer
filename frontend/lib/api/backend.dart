import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:dio/dio.dart';

class ApiBackendService {
  static String backendUrl = dotenv.env['BACKEND_URL'] ?? 'Backend URL not found';

  // Sign in a user with the provided data
  static Future<Map<String, dynamic>> signInUser({
    required dynamic data,
    Dio? dio,  // Client HTTP optionnel
  }) async {
    dio ??= Dio(); // Utiliser le client par défaut si aucun n'est fourni
    final url = '$backendUrl/user/login_with_token/';
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
      throw Exception('Error during sign-in: $e');
    }
  }
}
