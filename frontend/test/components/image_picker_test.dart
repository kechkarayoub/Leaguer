import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:frontend/components/image_picker.dart';
import 'package:image_picker/image_picker.dart';
import 'package:image_picker_platform_interface/image_picker_platform_interface.dart';
import '../mocks/test_helper.dart'; // Import the test helper



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
  HttpOverrides.global = FakeHttpOverrides();

  setUpAll(() {
    HttpOverrides.global = FakeHttpOverrides();
    // Mock du file picker
    final ImagePickerPlatform imagePickerPlatform = MockImagePickerPlatform();
    ImagePickerPlatform.instance = imagePickerPlatform; // Override the instance
    mockImagePicker = ImagePicker(); // Create a new ImagePicker instance that uses the mocked platform
  });

  Widget buildTestWidget({
    required Function(XFile?) onImageSelected,
    String initials = 'AB',
    String userInitialsBgColor = '#0000ff',
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
          userInitialsBgColor: userInitialsBgColor,
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

  testWidgets('Displays initial image when provided', (WidgetTester tester) async {
    await tester.pumpWidget(buildTestWidget(
      onImageSelected: (_) {},
      initialImageUrl: 'https://example.com/image.png',
    ));
    // Since we use HttpOverrides and our FakeHttpClientResponse, the image should load (using our dummy PNG).
    expect(find.byType(Image), findsOneWidget);
    // You might check that the widget tree contains a NetworkImage widget with the URL.
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

  testWidgets('Displays camera button on mobile platforms', (WidgetTester tester) async {
    // For tests, you might simulate the platform condition using Platform.isAndroid or by using a dependency injection.
    await tester.pumpWidget(buildTestWidget(
      onImageSelected: (_) {},
      imagePicker: mockImagePicker,
    ));
    if (!kIsWeb && (Platform.isAndroid || Platform.isIOS)) {
      expect(find.text('Camera'), findsOneWidget);
    } else {
      expect(find.text('Camera'), findsNothing);
    }
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

  testWidgets('Displays error placeholder when image fails to load', (tester) async {
    // Provide an initialImageUrl that triggers an error.
    await tester.pumpWidget(buildTestWidget(
      onImageSelected: (_) {},
      initialImageUrl: 'https://invalid-url.com/test.png',
    ));

    // Pump enough time to allow image loading error to occur.
    await tester.pumpAndSettle();

    // Verify that the error placeholder (e.g., an Icon with Icons.error) is displayed.
    expect(find.byIcon(Icons.error), findsOneWidget);
  });

  testWidgets('Shows loading indicator while network image is loading', (tester) async {

    await tester.pumpWidget(buildTestWidget(
      onImageSelected: (_) {},
      initialImageUrl: 'https://example.com/slow_image.png',
    ));

    // Check immediately after pumping (simulate a loading state).
    // Depending on the behavior of your widget and the fake HTTP client,
    // you might need to pump with a delay:
    await tester.pump(const Duration(milliseconds: 100));
    await tester.pump(const Duration(milliseconds: 100));

    // Check for the loading indicator (CircularProgressIndicator).
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

      // Now, pump for a longer duration (2 seconds) to allow the entire image to load.
      await tester.pump(const Duration(seconds: 2));

    // After loading, the CircularProgressIndicator should disappear.
    expect(find.byType(CircularProgressIndicator), findsNothing);
  });

  testWidgets('Displays default unknown user image when no initials or image are provided', (tester) async {
    await tester.pumpWidget(buildTestWidget(
      onImageSelected: (_) {},
      initials: '',
      initialImageUrl: null,
    ));
    expect(find.byType(Image), findsOneWidget);
    // Optionally check that the asset used is the unknown user image:
    expect(find.byWidgetPredicate((widget) => widget is Image && widget.image is AssetImage && (widget.image as AssetImage).assetName == 'assets/images/unknown_user.png'), findsOneWidget);
  });
  testWidgets('Calls onImageSelected callback with null when remove button is pressed', (tester) async {
    XFile? callbackFile = XFile('test.png');
    await tester.pumpWidget(buildTestWidget(
      onImageSelected: (file) => callbackFile = file,
      initialImageUrl: 'https://example.com/image.png',
    ));
    
    expect(find.byIcon(Icons.cancel), findsOneWidget);
    await tester.tap(find.byIcon(Icons.cancel));
    await tester.pump();
    expect(callbackFile, isNull);
  });


}