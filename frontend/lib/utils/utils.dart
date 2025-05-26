
import 'dart:io';
import 'dart:math';
import 'dart:typed_data'; // Add this import for Uint8List
import 'package:cross_file/cross_file.dart';
import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter/material.dart';
import 'package:frontend/api/unauthenticated_api_service.dart';
import 'package:frontend/storage/storage.dart';
import 'package:image/image.dart' as img;
import 'package:intl_phone_number_input/intl_phone_number_input.dart';
import 'package:logger/logger.dart';
import 'package:mime/mime.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

final logger = Logger();


/// Global key to access the current context if not passed
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

// Regular expressions for input validation
final RegExp alphNumUnderscoreRegExp = RegExp(r'^[a-zA-Z][a-zA-Z0-9_]*$');
const String dateFormatLabel = 'YYYY-MM-DD';
const String dateFormat = 'yyyy-MM-dd';
const String defaultLanguage = "fr";
const String routeDashboard = '/dashboard';
const String routeProfile = '/profile';
const String routeSignIn = '/sign-in';
const String routeSignUp = '/sign-up';
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

String getMimeType(String? filePath) {
  return lookupMimeType(filePath!) ?? 'image/jpeg';
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


/// Creates an [XFile] from a remote URL by downloading the file.
///
/// This function handles:
/// - Network requests with timeout
/// - Proper filename extraction from URL or headers
/// - Memory-efficient file handling
/// - Progress reporting
///
/// Parameters:
///   - [url]: The remote file URL (required)
///   - [name]: Custom filename (optional)
///   - [dioInstance]: Custom Dio client (optional)
///   - [onReceiveProgress]: Download progress callback (optional)
///   - [timeoutSeconds]: Request timeout in seconds (default: 15)
///
/// Returns:
///   - [XFile] if download succeeds
///   - `null` if download fails or response is empty
///
/// Throws:
///   - [ArgumentError] for invalid URL
///   - [DioException] for network errors (handled internally)
Future<XFile?> createXFileFromUrl(
  String url, {
  String? name,
  Dio? dioInstance,
  ProgressCallback? onReceiveProgress,
  int timeoutSeconds = 15,
}) async {
  // Validate URL
  if (url.isEmpty) {
    throw ArgumentError('URL cannot be empty');
  }

  final dio = dioInstance ?? Dio()
    ..options.connectTimeout = Duration(seconds: timeoutSeconds)
    ..options.receiveTimeout = Duration(seconds: timeoutSeconds);

  try {
    // Download file
    final response = await dio.get<List<int>>(
      url,
      options: Options(
        responseType: ResponseType.bytes,
        followRedirects: true,
        maxRedirects: 5,
      ),
      onReceiveProgress: onReceiveProgress,
    );


    // Validate response
    if (response.data == null || response.data!.isEmpty) {
      logMessage('Empty response from $url', 'createXFileFromUrl', 'w');
      return null;
    }

    // Convert List<int> to Uint8List
    final fileData = Uint8List.fromList(response.data!);
    
    final fileName = name ?? _extractFilenameFromUrl(url, response);
    Directory tempDir;
    try {
      tempDir = await getTemporaryDirectory(); // Flutter context
    } catch (_) {
      tempDir = Directory.systemTemp; // Fallback for tests
    }
    final filePath = '${tempDir.path}/$fileName';
    final file = File(filePath);
    await file.writeAsBytes(fileData);
    return XFile(file.path, name: fileName, mimeType: response.headers.value('content-type'));
  } on DioException catch (e) {
    logMessage('Failed to download file from $url: ${e.message}', 'createXFileFromUrl', 'e');
    return null;
  } catch (e) {
    logMessage('Unexpected error downloading $url: $e', 'createXFileFromUrl', 'e');
    return null;
  }
}

String _extractFilenameFromUrl(String url, Response<List<int>> response) {
  // Try from Content-Disposition header first
  final contentDisposition = response.headers.value('content-disposition');
  if (contentDisposition != null) {
    // final filenameMatch = RegExp('filename="?(.+)"?').firstMatch(contentDisposition);
    final filenameMatch = RegExp('filename\\*?=[\\\'"]?(?:UTF-\\d[\\\'"]*)?([^\\\'"\\s;]*)').firstMatch(contentDisposition) ??  
    RegExp('filename=[\\\'"]?([^\\\'"\\s;]*)').firstMatch(contentDisposition);
    if (filenameMatch != null && filenameMatch.group(1)!.isNotEmpty) {
      return filenameMatch.group(1)!;
    }
  }

  // Fallback to URL path segments
  try {
    final pathSegments = Uri.parse(url).pathSegments;
    if (pathSegments.isNotEmpty) {
      return pathSegments.last;
    }
  } catch (_) {}

  // Default name if all else fails
  return 'download_${DateTime.now().millisecondsSinceEpoch}';
}


/// Formats a phone number by removing any redundant leading zero after country code
/// 
/// Example: 
/// - Input: +2120612345678 (Morocco with 0 after country code)
/// - Output: +212612345678
String formatPhoneNumber(PhoneNumber number) {
  if (number.phoneNumber == null || number.phoneNumber!.isEmpty) {
    return '';
  }

  String countryCode = number.dialCode ?? "";
  String phoneNumber = number.phoneNumber ?? "";
  // Remove redundant 0 after country code if present
  if(phoneNumber.contains('${countryCode}0')){
    phoneNumber = phoneNumber.replaceFirst('${countryCode}0', countryCode);
  }
  return phoneNumber;
}

// Parses a phone number string into a PhoneNumber object with region info
/// 
/// Returns null if parsing fails
/// 
/// Example:
/// parsePhoneNumber('+14155552671') → PhoneNumber for US region
Future<PhoneNumber?> parsePhoneNumber(String internationalNumber) async {
  if (internationalNumber.isEmpty) {
    return null;
  }
  try {
    PhoneNumber number = await PhoneNumber.getRegionInfoFromPhoneNumber(
      internationalNumber,
    );
    return number;
  } catch (e) {
    logMessage(e, "Error when parsing PhoneNumber from $internationalNumber", "e", "", true);
    return null;
  }
}

/// Complete list of ISO country codes
const List<String> allCountryCodes = [
  'AF', 'AL', 'DZ', 'AS', 'AD', 'AO', 'AI', 'AQ', 'AG', 'AR', 'AM', 'AW', 'AU',
  'AT', 'AZ', 'BS', 'BH', 'BD', 'BB', 'BY', 'BE', 'BZ', 'BJ', 'BM', 'BT', 'BO',
  'BA', 'BW', 'BR', 'IO', 'VG', 'BN', 'BG', 'BF', 'BI', 'KH', 'CM', 'CA', 'CV',
  'BQ', 'KY', 'CF', 'TD', 'CL', 'CN', 'CX', 'CC', 'CO', 'KM', 'CK', 'CR', 'HR',
  'CU', 'CW', 'CY', 'CZ', 'CD', 'DK', 'DJ', 'DM', 'DO', 'TL', 'EC', 'EG', 'SV',
  'GQ', 'ER', 'EE', 'ET', 'FK', 'FO', 'FJ', 'FI', 'FR', 'GF', 'PF', 'GA', 'GM',
  'GE', 'DE', 'GH', 'GI', 'GR', 'GL', 'GD', 'GP', 'GU', 'GT', 'GG', 'GN', 'GW',
  'GY', 'HT', 'HN', 'HK', 'HU', 'IS', 'IN', 'ID', 'IR', 'IQ', 'IE', 'IM', 'IL',
  'IT', 'CI', 'JM', 'JP', 'JE', 'JO', 'KZ', 'KE', 'KI', 'XK', 'KW', 'KG', 'LA',
  'LV', 'LB', 'LS', 'LR', 'LY', 'LI', 'LT', 'LU', 'MO', 'MK', 'MG', 'MW', 'MY',
  'MV', 'ML', 'MT', 'MH', 'MQ', 'MR', 'MU', 'YT', 'MX', 'FM', 'MD', 'MC', 'MN',
  'ME', 'MS', 'MA', 'MZ', 'MM', 'NA', 'NR', 'NP', 'NL', 'NC', 'NZ', 'NI', 'NE',
  'NG', 'NU', 'KP', 'MP', 'NO', 'OM', 'PK', 'PW', 'PS', 'PA', 'PG', 'PY', 'PE',
  'PH', 'PL', 'PT', 'PR', 'QA', 'CG', 'RE', 'RO', 'RU', 'RW', 'BL', 'SH', 'KN',
  'LC', 'MF', 'PM', 'VC', 'WS', 'SM', 'ST', 'SA', 'SN', 'RS', 'SC', 'SL', 'SG',
  'SX', 'SK', 'SI', 'SB', 'SO', 'ZA', 'KR', 'SS', 'ES', 'LK', 'SD', 'SR', 'SE',
  'CH', 'SY', 'TW', 'TJ', 'TZ', 'TH', 'TG', 'TK', 'TO', 'TT', 'TN', 'TR', 'TM',
  'TC', 'TV', 'UG', 'UA', 'AE', 'GB', 'US', 'UY', 'UZ', 'VU', 'VA', 'VE', 'VN',
  'WF', 'YE', 'ZM', 'ZW'
];

/// Returns a list of allowed country codes with optional exclusions
/// 
/// [excludedCountries] - List of country codes to exclude
/// 
/// Example:
/// getAllowedCountries(excluded: ['IL']) → All countries except Israel
List<String> getAllowedCuntries({List<String> excludedCountriesList=const []}) {
  final List<String> excludedCountries = excludedCountriesList.isEmpty ? ['IL'] : excludedCountriesList; // Example: remove Israel


  // Remove excluded countries
  final allowedCountries = allCountryCodes.where((code) => !excludedCountries.contains(code)).toList();

  return allowedCountries;
}

/// Logs out the user by clearing the storage and possibly navigating to a login page.
/// [secureStorageService] - The service used for clearing user data.
/// [storageService] - The service used for clearing user data.
/// [context] - The build context, used for navigation (if needed).
Future<void> logout(StorageService storageService, SecureStorageService secureStorageService, BuildContext? context, [ThirdPartyAuthService? thirdPartyAuthService]) async {
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
  storageService.set(key: 'user', obj: null, updateNotifier: true);
  
  if (context?.mounted ?? false) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Navigator.of(context!).pushNamedAndRemoveUntil(
        routeSignIn,
        (Route<dynamic> route) => false,
      );
    });
  } else if (navigatorKey.currentContext != null) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Navigator.of(navigatorKey.currentContext!).pushNamedAndRemoveUntil(
        routeSignIn,
        (Route<dynamic> route) => false,
      );
    });
  }
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


  
  // // Helper method to convert stream to bytes
  // Future<Uint8List> readStreamToBytes(Stream<List<int>> stream) async {
  //   final chunks = <List<int>>[];
  //   await for (final chunk in stream) {
  //     chunks.add(chunk);
  //   }
  //   return Uint8List.fromList(chunks.expand((x) => x).toList());
  // }

/// Converts a stream of byte chunks into a single [Uint8List].
///
/// This helper method is useful for converting streaming data (like file uploads
/// or network responses) into a contiguous byte array that can be processed
/// as a whole.
///
/// Parameters:
///   - [stream]: The input stream of byte chunks (List int)
///
/// Returns:
///   A [Future<Uint8List>] that completes with all stream data combined
///
/// Throws:
///   - Propagates any errors from the stream
///   - May throw [StateError] if the stream is malformed
///
/// Example:
/// ```dart
/// final fileStream = File('example.txt').openRead();
/// final bytes = await readStreamToBytes(fileStream);
/// ```
Future<Uint8List> readStreamToBytes(Stream<List<int>>? stream) async {
  // Validate the stream isn't null
  ArgumentError.checkNotNull(stream, 'stream');

  final chunks = <List<int>>[];
  int totalLength = 0;

  try {
    await for (final chunk in stream!) {
      chunks.add(chunk);
      totalLength += chunk.length;
    }

    // Optimize for single-chunk case
    if (chunks.length == 1) {
      return Uint8List.fromList(chunks.single);
    }

    // Combine all chunks efficiently
    final result = Uint8List(totalLength);
    int offset = 0;
    for (final chunk in chunks) {
      result.setRange(offset, offset + chunk.length, chunk);
      offset += chunk.length;
    }

    return result;
  } catch (e) {
    throw Exception('Failed to convert stream to bytes: $e');
  }
}
