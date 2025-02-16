
import 'dart:io';
import 'dart:math';
import 'dart:typed_data';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:frontend/storage/storage.dart';
import 'package:image_picker/image_picker.dart';
import 'package:logger/logger.dart';
import 'package:mime/mime.dart';

final logger = Logger();


// Regular expressions for input validation
final RegExp alphNumUnderscoreRegExp = RegExp(r'^[a-zA-Z][a-zA-Z0-9_]*$');
const String dateFormatLabel = 'YYYY-MM-DD';
const String dateFormat = 'yyyy-MM-dd';
const String defaultLanguage = "fr";
final RegExp emailRegExp = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
final RegExp letterStartRegExp = RegExp(r'^[a-zA-Z]');
final RegExp nameRegExp = RegExp(r"^[a-zA-ZÀ-ÿ\s-]+$");
final RegExp usernameRegExp = RegExp(r'^[a-zA-Z][a-zA-Z0-9_]{2,19}$');


/// Converts a hex color string to a Flutter [Color] object.
/// [hexColor] - The hex color string, which may optionally start with a '#'.
/// Returns a [Color] corresponding to the hex value.
Color hexToColor(String hexColor) {
  // Remove the hash if present
  hexColor = hexColor.replaceFirst('#', '');
  
  // Parse the hex color and convert it to Color
  return Color(int.parse('FF$hexColor', radix: 16));
}


/// Returns the initials of the user, using the first character of first name and last name.
/// [lastName] - The last name of the user.
/// [firstName] - The first name of the user.
/// Returns a string with the initials (first letter of last name and first name).
String getInitials(String lastName, String firstName) {

  // Get the first character of the first name and last name
  String firstNameInitial = firstName.isNotEmpty ? firstName[0] : '';
  String lastNameInitial = lastName.isNotEmpty ? lastName[0] : '';

  // Concatenate and return
  return lastNameInitial + firstNameInitial;
}


/// Generates a random hex color code, ensuring it is dark enough.
/// Returns a hex color string.
String getRandomHexColor() {
  final Random random = Random();
  // Generate random color components
  int red = random.nextInt(256);
  int green = random.nextInt(256);
  int blue = random.nextInt(256);

  // Calculate the brightness of the color
  double brightness = (red * 299 + green * 587 + blue * 114) / 1000;

  // Ensure the color is dark enough by adjusting the brightness
  if (brightness > 128) {
    // Make the color darker if it's too bright
    red = (red * 0.5).toInt();
    green = (green * 0.5).toInt();
    blue = (blue * 0.5).toInt();
  }

  // Convert color components to hexadecimal
  String redHex = red.toRadixString(16).padLeft(2, '0');
  String greenHex = green.toRadixString(16).padLeft(2, '0');
  String blueHex = blue.toRadixString(16).padLeft(2, '0');

  return '#$redHex$greenHex$blueHex';
}


/// Logs out the user by clearing the storage and possibly navigating to a login page.
/// [secureStorageService] - The service used for clearing user data.
/// [storageService] - The service used for clearing user data.
/// [context] - The build context, used for navigation (if needed).
Future<void> logout(StorageService storageService, SecureStorageService secureStorageService, BuildContext context) async {
  // Clear all user data stored in storage
  await secureStorageService.clearTokens();
  await storageService.clear();
  //Navigator.pushReplacementNamed(context, '/sign-in');
}


/// Logs information to the console in development mode.
/// [message] - The message to log.
/// [title] - An optional title for the log.
void logMessage(dynamic message, [String? title, String? typeMessage, String? typeError]) {
  // Only log in development mode
  title = title ?? "";
  typeMessage = typeMessage ?? "d";
  typeError = typeError?? "";

  if(typeError == "wakelock" && (dotenv.env['IS_TEST'] ?? 'false') == "true"){ // Do not show wakelock error messae in test 
    return;
  }

  if(typeMessage == "d"){
    if((dotenv.env['PIPLINE'] ?? 'production') == "development"){
      logger.d(title, error: message);
    }
    else{
    }
  }
  else if(typeMessage == "i"){
    if((dotenv.env['PIPLINE'] ?? 'production') == "development"){
      logger.i(title, error: message);
    }
    else{
    }
  }
  else if(typeMessage == "w"){
    logger.w(title, error: message);
  }
  else if(typeMessage == "e"){
    logger.e(title, error: message);
  }
}


/// Determines the MIME type of a file, either from its path or content.
/// [path] - The path of the file.
/// [imageBytes] - Optional image bytes to determine MIME type.
/// Returns the MIME type as a string.
String determineMimeType(String path, {Uint8List? imageBytes}) {
  final mimeType = lookupMimeType(path);
  if (mimeType != null) {
    return mimeType;
  }
  // Fallback based on content type (if available)
  if (imageBytes != null) {
    final mimeType = lookupMimeType('', headerBytes: imageBytes);
    if (mimeType != null) {
      return mimeType;
    }
  }
  // Default to image/jpeg if no mime type can be determined
  return 'image/jpeg';
}
