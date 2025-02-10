import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/utils/utils.dart';
import 'package:mockito/mockito.dart';
import '../mocks.mocks.dart';
import '../test_helper.dart';


void main() {
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
    await logout(mockStorageService, mockSecureStorageService, mockContext);
    verify(mockSecureStorageService.clearTokens()).called(1);
    verify(mockStorageService.clear()).called(1);
  });

}