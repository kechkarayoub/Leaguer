
import 'dart:io';
import 'package:firebase_auth_mocks/firebase_auth_mocks.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/api/unauthenticated_api_service.dart';
import 'package:frontend/utils/utils.dart';
import 'package:google_sign_in_mocks/google_sign_in_mocks.dart';
import 'package:image/image.dart' as img;
import 'package:mockito/mockito.dart';
import 'package:path_provider/path_provider.dart';
import '../mocks/mocks.mocks.dart';
import '../mocks/test_helper.dart';


void main() async{
  late ThirdPartyAuthService thirdPartyAuthService;
  late MockFirebaseAuth mockAuth;
  late MockGoogleSignIn mockGoogleSignIn;
  // Initialize flutter_dotenv for tests
  await dotenv.load(fileName: ".env");
  
  group('Other functions', () {
    test('HexToColor converts hex string to Color object correctly', () {
      expect(hexToColor('#FF5733'), equals(Color(0xFFFF5733)));
      expect(hexToColor('FF5733'), equals(Color(0xFFFF5733)));
    });


    test('GetInitials returns correct initials', () {
      expect(getInitials('Doe', 'John'), equals('DJ'));
      expect(getInitials('', 'John'), equals('J'));
      expect(getInitials('Doe', ''), equals('D'));
    });


    test('DetermineMimeType returns correct MIME type', () {
      expect(determineMimeType('image.jpg'), equals('image/jpeg'));
      expect(determineMimeType('image.png'), equals('image/png'));
    });


    test('GetRandomHexColor generates a valid hex color', () {
      String color = getRandomHexColor();
      expect(color, matches(r'^#[0-9a-fA-F]{6}$'));
    });
  });

  group('Logout clears storage', () {
    test('Logout clears storage', () async {
      final mockStorageService = MockStorageService();
      final mockSecureStorageService = MockSecureStorageService();
      final mockContext = MockBuildContext();
      mockAuth = MockFirebaseAuth();
      mockGoogleSignIn = MockGoogleSignIn();
      thirdPartyAuthService = ThirdPartyAuthService(auth: mockAuth, googleSignIn: mockGoogleSignIn);
      await logout(mockStorageService, mockSecureStorageService, mockContext, thirdPartyAuthService);
      verify(mockSecureStorageService.clearTokens()).called(1);
      verify(mockStorageService.clear()).called(1);
    });
  });

  group('CompressAndResizeImage', () {
    late File testPngImage;
    late File testJpgImage;
    late File compressedJpg;
    late File compressedPng;

    setUp(() async {
      final tempDir = "assets/images/test";
      testPngImage = File('$tempDir/test_image.png');
      testJpgImage = File('$tempDir/test_image.jpg');
    });
    tearDown(() async {
      // Cleanup after test
      if (await compressedPng.exists()) {
        await compressedPng.delete();
      }
    });

    test('PNG remains transparent after compression', () async {
      compressedPng = await compressAndResizeImage(testPngImage, width: 50, height: 50, pngCompression: 6);
      final compressedImage = img.decodeImage(await compressedPng.readAsBytes())!;

      expect(compressedImage.width, equals(50));
      expect(compressedImage.height, equals(50));
      expect(compressedPng.path.endsWith('.png'), isTrue);
    });

    test('JPEG size is reduced', () async {
      final originalSize = await testJpgImage.length();
      compressedJpg = await compressAndResizeImage(testJpgImage, jpegQuality: 50);
      final compressedSize = await compressedJpg.length();

      expect(compressedSize, lessThan(originalSize), reason: 'JPEG should be smaller.');
      
      if (await compressedJpg.exists()) {
        await compressedJpg.delete();
      }
    });
  });

}