
import 'package:firebase_auth_mocks/firebase_auth_mocks.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/api/unauthenticated_api_service.dart';
import 'package:frontend/utils/utils.dart';
import 'package:google_sign_in_mocks/google_sign_in_mocks.dart';
import 'package:mockito/mockito.dart';
import '../mocks/mocks.mocks.dart';
import '../mocks/test_helper.dart';


void main() async{
  late ThirdPartyAuthService thirdPartyAuthService;
  late MockFirebaseAuth mockAuth;
  late MockGoogleSignIn mockGoogleSignIn;
  // Initialize flutter_dotenv for tests
  await dotenv.load(fileName: ".env");
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

}