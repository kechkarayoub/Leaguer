
import 'dart:io';
import 'dart:math';
import 'dart:typed_data';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter/material.dart';
import 'package:frontend/api/unauthenticated_api_service.dart';
import 'package:frontend/storage/storage.dart';
import 'package:image/image.dart' as img;
import 'package:logger/logger.dart';
import 'package:mime/mime.dart';
import 'package:path/path.dart' as p;

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

/// Compresses and resizes an image file while maintaining the original format.
///
/// [originalImage]: The original image file to process.
/// [width]: The desired width of the resized image (optional).
/// [height]: The desired height of the resized image (optional).
///
/// Returns a new [File] containing the processed image.
///
/// Throws an [Exception] if the image cannot be decoded.
Future<File> compressAndResizeImage(File originalImage, {int? width, int? height, int? jpegQuality, int? pngCompression}) async {
  jpegQuality = jpegQuality ?? 50;
  pngCompression = pngCompression ?? 6;
  // Read the original image bytes
  final originalBytes = await originalImage.readAsBytes();

  // Decode the image
  final image = img.decodeImage(originalBytes);
  if (image == null) throw Exception('Unable to decode image');

  // Get original dimensions
  final originalWidth = image.width;
  final originalHeight = image.height;
  final aspectRatio = originalWidth / originalHeight;

  // Resize the image based on provided dimensions
  img.Image resizedImage = image;
  if (width != null && height != null) {
    // Resize to exact width and height
    resizedImage = img.copyResize(image, width: width, height: height);
  } 
  else if (width != null) {
    // Resize to the specified width while maintaining aspect ratio
    height = (width / aspectRatio).round();
    resizedImage = img.copyResize(image, width: width, height: height);
  } 
  else if (height != null) {
    // Resize to the specified height while maintaining aspect ratio
    width = (height * aspectRatio).round();
    resizedImage = img.copyResize(image, width: width, height: height);
  }

  // Determine the original image format from the file extension
  final originalExtension = p.extension(originalImage.path).toLowerCase();
  // Encode the processed image in the original format
  List<int> encodedBytes;
  switch (originalExtension) {
    case '.jpg':
    case '.jpeg':
      encodedBytes = img.encodeJpg(resizedImage, quality: jpegQuality);
      break;
    case '.png':
      encodedBytes = img.encodePng(resizedImage, level: pngCompression);
      break;
    case '.bmp':
      encodedBytes = img.encodeBmp(resizedImage);
      break;
    case '.gif':
      encodedBytes = img.encodeGif(resizedImage);
      break;
    default:
      // Default to JPEG if the format is unsupported
      encodedBytes = img.encodeJpg(resizedImage, quality: jpegQuality);
  }
  // Save the encoded bytes to a new file
  final newFilePath = '${originalImage.path.replaceAll(originalExtension, "")}_processed$originalExtension';
  final newFile = File(newFilePath)..writeAsBytesSync(encodedBytes);

  return newFile;
}


/// Logs out the user by clearing the storage and possibly navigating to a login page.
/// [secureStorageService] - The service used for clearing user data.
/// [storageService] - The service used for clearing user data.
/// [context] - The build context, used for navigation (if needed).
Future<void> logout(StorageService storageService, SecureStorageService secureStorageService, BuildContext context, [ThirdPartyAuthService? thirdPartyAuthService]) async {
  // Clear all user data stored in storage
  await secureStorageService.clearTokens();
  await storageService.clear();
  try{
    thirdPartyAuthService = thirdPartyAuthService?? ThirdPartyAuthService();
    await thirdPartyAuthService.signOut();
  }
  catch(e){
    // Error when log out or not login with third party auth service.
    logMessage(e, "Error when log out from third party auth service", "e");
  }
  //Navigator.pushReplacementNamed(context, '/sign-in');
}


/// Logs information to the console in development mode.
/// [message] - The message to log.
/// [title] - An optional title for the log.
void logMessage(dynamic message, [String? title, String? typeMessage, String? typeError, bool? forcePrint]) {
  // Only log in development mode
  title = title ?? "";
  typeMessage = typeMessage ?? "d";
  typeError = typeError?? "";
  forcePrint = forcePrint ?? false;

  if(forcePrint == false && (dotenv.env['DISABLE_LOG_MESSAGE'] ?? 'false') == "true"){ // Do not show print messages if not needed 
    return;
  }

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
