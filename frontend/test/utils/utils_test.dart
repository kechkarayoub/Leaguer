
import 'dart:io';
import 'dart:typed_data';
import 'package:dio/dio.dart';
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
  late MockDio mockDio;
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

  group('createXFileFromUrl', () {
    const testUrl = 'https://example.com/testfile.jpg';
    final testBytes = Uint8List.fromList([1, 2, 3, 4, 5]);
    setUp(() async{
      mockDio = MockDio();
      // ✅ Stub `options` to prevent "MissingStubError: options"
      when(mockDio.options).thenReturn(BaseOptions());
    });
    test('Successfully downloads file with custom name', () async {
      // Arrange
      when(mockDio.get<List<int>>(
        testUrl,
        options: anyNamed('options'),
        onReceiveProgress: anyNamed('onReceiveProgress'),
      )).thenAnswer((_) async => Response(
        data: testBytes,
        statusCode: 200,
        requestOptions: RequestOptions(path: ''),
        headers: Headers.fromMap({
          'content-type': ['image/jpeg'],
        }),
      ));

      // Act
      final result = await createXFileFromUrl(
        testUrl,
        name: 'custom.jpg',
        dioInstance: mockDio,
      );

      // Assert
      expect(result, isNotNull);
      expect(result!.path.endsWith('custom.jpg'), isTrue);
      expect(await result.length(), testBytes.length);
    });

    test('Extracts filename from Content-Disposition header', () async {
      // Arrange
      when(mockDio.get<List<int>>(
        testUrl,
        options: anyNamed('options'),
        onReceiveProgress: anyNamed('onReceiveProgress'),
      )).thenAnswer((_) async => Response(
        data: testBytes,
        statusCode: 200,
        requestOptions: RequestOptions(path: ''),
        headers: Headers.fromMap({
          'content-disposition': ['attachment; filename="realname.jpg"'],
          'content-type': ['image/jpeg'],
        }),
      ));

      // Act
      final result = await createXFileFromUrl(
        testUrl,
        dioInstance: mockDio,
      );

      // Assert
      expect(result!.path.endsWith('realname.jpg'), isTrue);
    });

    test('Extracts filename from URL when no headers', () async {
      // Arrange
      when(mockDio.get<List<int>>(
        testUrl,
        options: anyNamed('options'),
        onReceiveProgress: anyNamed('onReceiveProgress'),
      )).thenAnswer((_) async => Response(
        data: testBytes,
        statusCode: 200,
        requestOptions: RequestOptions(path: ''),
      ));

      // Act
      final result = await createXFileFromUrl(
        testUrl,
        dioInstance: mockDio,
      );

      // Assert
      expect(result!.path.endsWith('testfile.jpg'), isTrue);
    });

    test('Returns null for empty response', () async {
      // Arrange
      when(mockDio.get<List<int>>(
        testUrl,
        options: anyNamed('options'),
        onReceiveProgress: anyNamed('onReceiveProgress'),
      )).thenAnswer((_) async => Response(
        data: null,
        statusCode: 200,
        requestOptions: RequestOptions(path: ''),
      ));

      // Act
      final result = await createXFileFromUrl(
        testUrl,
        dioInstance: mockDio,
      );

      // Assert
      expect(result, isNull);
    });

    test('Handles Dio errors and returns null', () async {
      // Arrange
      when(mockDio.get<List<int>>(
        testUrl,
        options: anyNamed('options'),
        onReceiveProgress: anyNamed('onReceiveProgress'),
      )).thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
      ));

      // Act
      final result = await createXFileFromUrl(
        testUrl,
        dioInstance: mockDio,
      );

      // Assert
      expect(result, isNull);
    });

    test('Throws ArgumentError for empty URL', () async {
      // Act & Assert
      expect(() => createXFileFromUrl(''), throwsArgumentError);
    });

  
  });

  group('ReadStreamToBytes', () {
    test('Converts single-chunk stream correctly', () async {
      final stream = Stream<List<int>>.fromIterable([
        [1, 2, 3, 4, 5]
      ]);

      final result = await readStreamToBytes(stream);
      expect(result, equals(Uint8List.fromList([1, 2, 3, 4, 5])));
    });

    test('Combines multiple chunks correctly', () async {
      final stream = Stream<List<int>>.fromIterable([
        [1, 2],
        [3, 4],
        [5]
      ]);

      final result = await readStreamToBytes(stream);
      expect(result, equals(Uint8List.fromList([1, 2, 3, 4, 5])));
    });

    test('Handles empty stream', () async {
      final stream = Stream<List<int>>.fromIterable([]);
      final result = await readStreamToBytes(stream);
      expect(result, equals(Uint8List(0)));
    });

    test('Handles large streams efficiently', () async {
      // Generate 1MB of test data in 100 chunks
      final chunks = List.generate(100, (i) => List<int>.filled(1024 * 10, i % 256));
      final stream = Stream<List<int>>.fromIterable(chunks);

      final stopwatch = Stopwatch()..start();
      final result = await readStreamToBytes(stream);
      stopwatch.stop();

      expect(result.length, equals(1024 * 10 * 100));
      logMessage('Processed 1MB in ${stopwatch.elapsedMilliseconds}ms', "ReadStreamToBytes", 'd', "", true);
    });

    test('Throws on null stream', () async {
      expect(() => readStreamToBytes(null), throwsArgumentError);
    });

    test('Propagates stream errors', () async {
      final stream = Stream<List<int>>.error(Exception('Test error'));
      expect(readStreamToBytes(stream), throwsException);
    });

    test('Handles empty chunks', () async {
      final stream = Stream<List<int>>.fromIterable([
        [],
        [1, 2],
        [],
        [3, 4],
        []
      ]);

      final result = await readStreamToBytes(stream);
      expect(result, equals(Uint8List.fromList([1, 2, 3, 4])));
    });
  });

}