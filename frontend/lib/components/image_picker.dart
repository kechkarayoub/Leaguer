import 'dart:io';
import 'package:flutter/material.dart';
import 'package:frontend/components/initials_avatar.dart';
import 'package:frontend/utils/platform_detector.dart';
import 'package:image_picker/image_picker.dart';

class ImagePickerWidget extends StatefulWidget {
  final Function(XFile?) onImageSelected;   // Callback function to pass the selected image file
  final String initials;  // Initials to display if no image is selected
  final String userInitialsBgColor;  // Background color for the initials avatar
  final String labelText;  // Label text for the image picker button
  final String labelTextCamera;  // Label text for the camera picker button
  final String? initialImageUrl;  // Initial image URL if there's an existing image
  final double height;  // Height of image
  final double width;  // Width of image
  final double borderRadius;  // The border radius
  final double removeIconSize;  // The remove icon's size
  final ImagePicker? imagePicker; // The imagePicker instance

  const ImagePickerWidget({
    super.key,
    required this.initials,
    required this.userInitialsBgColor,
    required this.labelText,
    required this.labelTextCamera,
    required this.onImageSelected,
    this.initialImageUrl,
    this.height = 100,
    this.width = 100,
    this.borderRadius = 50,
    this.removeIconSize = 24,
    this.imagePicker,
  });

  @override
  ImagePickerWidgetState createState() => ImagePickerWidgetState();
}

class ImagePickerWidgetState extends State<ImagePickerWidget> {
  XFile? _selectedImage;  // File object for the selected image
  String? _webImageUrl;
  bool _imageRemoved = false;
  bool isPicking = false;
  final platform = getPlatformType();
  
  @override
  void initState() {
    super.initState();
  }

  // Method to pick an image from the gallery
  Future<void> _pickImage(ImageSource source) async {
    if (isPicking) return; // Prevent rapid consecutive calls
    isPicking = true;
    try {
      final pickedFile = await (widget.imagePicker ?? ImagePicker()).pickImage(source: source);
      if (pickedFile != null) {
        setState(() {
          if (platform == PlatformType.web) {
            _webImageUrl = pickedFile.path; // Using the path as URL for web
          }
          _selectedImage = XFile(pickedFile.path);  // Update the selected image file
        });
        widget.onImageSelected(pickedFile);  // Call the callback function with the selected image
      }
    } catch (e) {
      debugPrint('Error picking image: $e');
    } finally {
      isPicking = false;
    }
  }

  // Method to remove the selected image
  void _removeImage() {
    setState(() {
      _selectedImage = null;  // Clear the selected image file
      _webImageUrl = null;
      _imageRemoved = true;
    });
    widget.onImageSelected(null);  // Call the callback function with null to indicate image removal
  }

  // This method is for testing purposes only
  void setSelectedImageForTest(XFile image) {
    setState(() {
      _selectedImage = image;
    });
  }

  Widget _buildErrorPlaceholder() {
  return Container(
    height: widget.height,
    width: widget.width,
    color: Colors.grey[300],
    child: Icon(
      Icons.error,
      color: Colors.red,
      size: widget.height * 0.5,
    ),
  );
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
                borderRadius: BorderRadius.circular(widget.borderRadius),  // Circular shape for the image
                child: platform == PlatformType.web
                  ? Image.network(
                      _webImageUrl!,
                      height: widget.height,
                      width: widget.width,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return _buildErrorPlaceholder(); // Fallback on load error
                      },
                      loadingBuilder: (context, child, loadingProgress) {
                        if (loadingProgress == null) return child;
                        return Center(
                          child: CircularProgressIndicator(
                            value: loadingProgress.expectedTotalBytes != null
                                ? loadingProgress.cumulativeBytesLoaded /
                                    loadingProgress.expectedTotalBytes!
                                : null,
                          ),
                        );
                      },
                    )
                  : Image.file(
                      File(_selectedImage!.path),
                      height: widget.height,
                      width: widget.width,
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
                    size: widget.removeIconSize,
                  ),
                ),
              ),
            ],
          )
        // Display the initial image if provided and image not removed
        else if (widget.initialImageUrl != null && !_imageRemoved)
          Stack(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(widget.borderRadius),    // Circular shape for the image
                  child: Image.network(
                  widget.initialImageUrl!,
                  height: widget.height,
                  width: widget.width,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return _buildErrorPlaceholder();
                  },
                  loadingBuilder: (context, child, loadingProgress) {
                    if (loadingProgress == null) {
                      return child;
                    }
                    final expected = loadingProgress.expectedTotalBytes;
                    if (expected != null) {
                      final progress = loadingProgress.cumulativeBytesLoaded / expected;
                      // If progress is complete, return the image.
                      if (progress >= 1.0) {
                        return child;
                      }
                    }
                    return Center(
                      child: CircularProgressIndicator(
                        value: loadingProgress.expectedTotalBytes != null
                            ? loadingProgress.cumulativeBytesLoaded /
                                loadingProgress.expectedTotalBytes!
                            : null,
                      ),
                    );
                  },
                ),
              ),
              Positioned(
                right: 0,
                child: GestureDetector(
                  onTap: _removeImage,
                  child: Icon(
                    Icons.cancel,
                    color: Colors.red,
                    size: widget.removeIconSize,
                  ),
                ),
              ),
            ],
          )
        // Display the initials avatar if no image is selected and initials are provided
        else if (widget.initials.isNotEmpty)
          InitialsAvatar(initials: widget.initials, userInitialsBgColor: widget.userInitialsBgColor)
        // Display a default "Unknown user" image if no image is selected and no initials are provided
        else
          Stack(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(widget.borderRadius),   // Circular shape for the image
                child: Image.asset(
                  'assets/images/unknown_user.png',
                  height: widget.height,
                  width: widget.width,
                  fit: BoxFit.cover,
                ),
              ),
            ],
          ),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              margin: const EdgeInsets.only(top: 10), // Adds a top margin of 10 pixels
              child: Row(
                children: [
                  Semantics(
                    label: widget.labelText,
                    child: TextButton(
                      onPressed: () => _pickImage(ImageSource.gallery),
                      child: Text(widget.labelText),
                    ),
                  ),
                  if (platform == PlatformType.mobile)
                    Semantics(
                      label: widget.labelTextCamera,
                      child: TextButton(
                        onPressed: () => _pickImage(ImageSource.camera),
                        child: Text(widget.labelTextCamera),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

}
