import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:frontend/components/initials_avatar.dart';
import 'package:image_picker/image_picker.dart';

class ImagePickerWidget extends StatefulWidget {
  final Function(XFile?) onImageSelected;   // Callback function to pass the selected image file
  final String initials;  // Initials to display if no image is selected
  final String initialsBgColor;  // Background color for the initials avatar
  final String labelText;  // Label text for the image picker button
  final String labelTextCamera;  // Label text for the image picker button
  final String? initialImageUrl;  // Initial image URL if there's an existing image

  ImagePickerWidget({
    required this.initials,
    required this.initialsBgColor,
    required this.labelText,
    required this.labelTextCamera,
    required this.onImageSelected,
    this.initialImageUrl,
  });

  @override
  ImagePickerWidgetState createState() => ImagePickerWidgetState();
}

class ImagePickerWidgetState extends State<ImagePickerWidget> {
  XFile? _selectedImage;  // File object for the selected image
  String? _webImageUrl;

  @override
  void initState() {
    super.initState();
  }

  // Method to pick an image from the gallery
  Future<void> _pickImage(ImageSource source) async {
    final pickedFile = await ImagePicker().pickImage(source: source);
    if (pickedFile != null) {
      setState(() {
        if (kIsWeb) {
          _webImageUrl = pickedFile.path; // Using the path as URL for web
          _selectedImage = XFile(pickedFile.path);
        }
        _selectedImage = XFile(pickedFile.path);  // Update the selected image file
      });
      widget.onImageSelected(_selectedImage);  // Call the callback function with the selected image
    }
  }

  // Method to remove the selected image
  void _removeImage() {
    setState(() {
      _selectedImage = null;  // Clear the selected image file
      _webImageUrl = null;
    });
    widget.onImageSelected(null);  // Call the callback function with null to indicate image removal
  }

  // This method is for testing purposes only
  void setSelectedImageForTest(XFile image) {
    setState(() {
      _selectedImage = image;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Display the selected image if available
        if (_selectedImage != null || _webImageUrl != null)
          Stack(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(50),  // Circular shape for the image
                child: kIsWeb
                  ? Image.network(
                      _webImageUrl!,
                      height: 100,
                      width: 100,
                      fit: BoxFit.cover,
                    )
                  : Image.file(
                      File(_selectedImage!.path),
                      height: 100,
                      width: 100,
                      fit: BoxFit.cover,
                    ),
                  ),
              Positioned(
                right: 0,
                child: GestureDetector(
                  onTap: _removeImage,
                  child: Icon(
                    Icons.cancel,
                    color: Colors.red,
                    size: 24,
                  ),
                ),
              ),
            ],
          )
        // Display the initial image if provided
        else if (widget.initialImageUrl != null)
          Stack(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(50),    // Circular shape for the image
                  child: Image.network(
                  widget.initialImageUrl!,
                  height: 100,
                  width: 100,
                  fit: BoxFit.cover,
                ),
              ),
              Positioned(
                right: 0,
                child: GestureDetector(
                  onTap: _removeImage,
                  child: Icon(
                    Icons.cancel,
                    color: Colors.red,
                    size: 24,
                  ),
                ),
              ),
            ],
          )
        // Display the initials avatar if no image is selected and initials are provided
        else if (widget.initials.isNotEmpty)
          InitialsAvatar(initials: widget.initials, initialsBgColors: widget.initialsBgColor)
        // Display a default "Unknown user" image if no image is selected and no initials are provided
        else
          Stack(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(50),   // Circular shape for the image
                child: Image.asset(
                  'assets/images/unknown_user.png',
                  height: 100,
                  width: 100,
                  fit: BoxFit.cover,
                ),
              ),
            ],
          ),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TextButton(
              onPressed: () => _pickImage(ImageSource.gallery),
              child: Text(widget.labelText),
            ),
            if (!kIsWeb && (Platform.isAndroid || Platform.isIOS))
              TextButton(
                onPressed: () => _pickImage(ImageSource.camera),
                child: Text(widget.labelTextCamera),
              ),
          ],
        ),
      ],
    );
  }

}
