
import 'dart:io';
import 'dart:math';
import 'dart:typed_data';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:frontend/storage/storage.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mime/mime.dart';


final RegExp alphNumUnderscoreRegExp = RegExp(r'^[a-zA-Z][a-zA-Z0-9_]*$');
const String dateFormatLabel = 'YYYY-MM-DD';
const String dateFormat = 'yyyy-MM-dd';
const String defaultLanguage = "fr";
final RegExp emailRegExp = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
final RegExp letterStartRegExp = RegExp(r'^[a-zA-Z]');
final RegExp nameRegExp = RegExp(r"^[a-zA-ZÀ-ÿ\s-]+$");
final RegExp usernameRegExp = RegExp(r'^[a-zA-Z][a-zA-Z0-9_]{2,19}$');


Color hexToColor(String hexColor) {
  // Remove the hash if present
  hexColor = hexColor.replaceFirst('#', '');
  
  // Parse the hex color and convert it to Color
  return Color(int.parse('FF$hexColor', radix: 16));
}

String getInitials(String lastName, String firstName) {

  // Get the first character of the first name and last name
  String firstNameInitial = firstName.isNotEmpty ? firstName[0] : '';
  String lastNameInitial = lastName.isNotEmpty ? lastName[0] : '';

  // Concatenate and return
  return lastNameInitial + firstNameInitial;
}


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


void logout(StorageService storageService, BuildContext context) {
  /// Logs out the user by clearing all data from the storage.
  /// This function clears all data from the storage, effectively logging the user out.
  /// [storageService] - The service used to manage storage operations.
  /// [context] - The build context used for navigation (if needed).
  storageService.clear();
  //Navigator.pushReplacementNamed(context, '/sign-in');
}

/// Ensures the user is authenticated with Firebase.
Future<void> ensureUserIsAuthenticated() async {
  User? user = FirebaseAuth.instance.currentUser;
  if (user == null) {
    try {
      String firebaseEmail = dotenv.env['FIREBASE_EMAIL'] ?? 'No email provided';
      String firebasePassword = dotenv.env['FIREBASE_PASSWORD'] ?? 'No password provided';
      UserCredential userCredential = await FirebaseAuth.instance.signInWithEmailAndPassword(
        email: firebaseEmail,  // Replace with your email
        password: firebasePassword,        // Replace with your password
      );
      user = userCredential.user;
    } catch (e) {
      // Handle sign-in error
      print('Sign-in error: $e');
    }
  }
}

/// Determines the MIME type of a file based on its path or bytes.
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

/// Uploads an image to Firebase Storage and returns the download URL.
Future<String> uploadImage(XFile image) async {
  await ensureUserIsAuthenticated();
  Uint8List? imageBytes;

  // Define metadata with the correct MIME type
  if (kIsWeb) {
    imageBytes = await image.readAsBytes();
  }
  // Determine MIME type
  final mimeType = determineMimeType(image.path, imageBytes: imageBytes);
  final metadata = SettableMetadata(contentType: mimeType);
  // Create a reference to the location you want to upload the image
  Reference storageReference = FirebaseStorage.instance
      .ref()
      .child('images/${DateTime.now().millisecondsSinceEpoch.toString()}');

  if (kIsWeb) {
      // Upload for Web
      Uint8List imageBytes = await image.readAsBytes();
      UploadTask uploadTask = storageReference.putData(imageBytes, metadata);
      TaskSnapshot taskSnapshot = await uploadTask;
      return await taskSnapshot.ref.getDownloadURL();
    } else {
      // Upload for Mobile and Desktop
      File file = File(image.path);
      UploadTask uploadTask = storageReference.putFile(file, metadata);
      TaskSnapshot taskSnapshot = await uploadTask;
      return await taskSnapshot.ref.getDownloadURL();
    }
}
