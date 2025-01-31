import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/components/image_picker.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:image_picker_platform_interface/image_picker_platform_interface.dart';
import 'package:cross_file/cross_file.dart'; // Import XFile
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';


// --- Fake HTTP Classes to simulate NetworkImage loading ---

class FakeHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    return FakeHttpClient();
  }
}

class FakeHttpClient extends Fake implements HttpClient {
  @override
  bool autoUncompress = true;  // Required by Flutter's Image.network

  @override
  Future<HttpClientRequest> getUrl(Uri url) async {
    return FakeHttpClientRequest();
  }

  @override
  noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class FakeHttpClientRequest extends Fake implements HttpClientRequest {
  @override
  Future<HttpClientResponse> close() async {
    return FakeHttpClientResponse();
  }

  @override
  noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class FakeHttpClientResponse extends Fake implements HttpClientResponse {
  // A 1x1 transparent PNG image encoded in Base64
  final List<int> _dummyPng = base64Decode(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ/wP+Fo5IEQAAAABJRU5ErkJggg==");

  @override
  int get statusCode => 200;

  @override
  int get contentLength => _dummyPng.length;


  @override
  HttpClientResponseCompressionState get compressionState => HttpClientResponseCompressionState.notCompressed;


  @override
  StreamSubscription<List<int>> listen(void Function(List<int>)? onData,
      {bool? cancelOnError, void Function()? onDone, Function? onError}) {
    return Stream<List<int>>.fromIterable([_dummyPng]).listen(
      onData,
      cancelOnError: cancelOnError ?? false,
      onDone: onDone,
      onError: onError,
    );
  }

  @override
  noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

// --- End of Fake HTTP Classes ---

// Mock de l'ImagePickerPlatform
class MockImagePickerPlatform extends ImagePickerPlatform {
  @override
  Future<XFile?> getImage({
    required ImageSource source,
    double? maxWidth,
    double? maxHeight,
    int? imageQuality,
    CameraDevice preferredCameraDevice = CameraDevice.rear,
  }) async {
    return XFile('path/to/mock_image.jpg'); // Simulate a selected file using XFile
  }
  @override
  Future<PickedFile?> pickImage({
    required ImageSource source,
    double? maxWidth,
    double? maxHeight,
    int? imageQuality,
    CameraDevice preferredCameraDevice = CameraDevice.rear,
  }) async {
    // Simulate a successful image pick
    return pickImage(
      source: source,
      maxWidth: maxWidth,
      maxHeight: maxHeight,
      imageQuality: imageQuality,
      preferredCameraDevice: preferredCameraDevice,
    );
  }

  @override
  Future<List<PickedFile>?> pickMultiImage({
    double? maxWidth,
    double? maxHeight,
    int? imageQuality,
  }) async {
    // Simulate multi-image pick (if needed)
    return null;
  }

  @override
  Future<PickedFile?> pickVideo({
    required ImageSource source,
    CameraDevice preferredCameraDevice = CameraDevice.rear,
    Duration? maxDuration,
  }) async {
    // Simulate video pick (if needed)
    return null;
  }
}

void main() {
  late ImagePicker mockImagePicker;

  setUp(() {
    HttpOverrides.global = FakeHttpOverrides();
    // Mock du file picker
    final ImagePickerPlatform imagePickerPlatform = MockImagePickerPlatform();
    ImagePickerPlatform.instance = imagePickerPlatform; // Override the instance
    mockImagePicker = ImagePicker(); // Create a new ImagePicker instance that uses the mocked platform
  });

  Widget buildTestWidget({
    required Function(XFile?) onImageSelected,
    String initials = 'AB',
    String initialsBgColor = '#0000ff',
    String labelText = 'Gallery',
    String labelTextCamera = 'Camera',
    String? initialImageUrl,
    String? unknownUserImagePath = 'assets/images/unknown_user.png',
    ImagePicker? imagePicker,
  }) {
    return MaterialApp(
      home: Scaffold(
        body: ImagePickerWidget(
          onImageSelected: onImageSelected,
          initials: initials,
          initialsBgColor: initialsBgColor,
          labelText: labelText,
          labelTextCamera: labelTextCamera,
          initialImageUrl: initialImageUrl,
          imagePicker: imagePicker,
        ),
      ),
    );
  }

  testWidgets('Displays initials avatar if no image is selected', (tester) async {
    await tester.pumpWidget(buildTestWidget(onImageSelected: (XFile? file) {}));
    expect(find.text('AB'), findsOneWidget);
  });

  testWidgets('Updates the image when a file is selected', (tester) async {
    XFile? selectedFile;

    await tester.pumpWidget(buildTestWidget(
      onImageSelected: (file) => selectedFile = file,
      imagePicker: mockImagePicker,
    ));

    await tester.tap(find.text('Gallery'));
    await tester.pump(); // Simulate the file picker

    expect(selectedFile, isNotNull);
  });

  testWidgets('Removes the image when the remove button is pressed', (tester) async {
    XFile? selectedFile = XFile('test.png');
    await tester.pumpWidget(buildTestWidget(
      onImageSelected: (file) => selectedFile = file,
      initialImageUrl: 'https://example.com/image.png',
    ));


    expect(find.byIcon(Icons.cancel), findsOneWidget);

    await tester.tap(find.byIcon(Icons.cancel));
    await tester.pump();

    expect(selectedFile, isNull);
  });


}