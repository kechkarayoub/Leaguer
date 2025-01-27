import 'package:flutter/material.dart';
import 'package:frontend/utils/utils.dart';

/// A widget that displays a circular avatar with initials and a background color.

class InitialsAvatar extends StatelessWidget {
  /// A stateless widget that displays a circular avatar containing initials.
  ///
  /// Parameters:
  /// - `initials`: The initials to display.
  /// - `initialsBgColors`: The background color of the avatar in hexadecimal format.

  final String initials;
  final String initialsBgColors;
  final double height;
  final double width;
  final Color textColor;
  final TextStyle? textStyle;
  final BoxShape shape;


  const InitialsAvatar({super.key, required this.initials, required this.initialsBgColors, this.width = 100, this.height = 100, this.textColor = Colors.white, this.shape = BoxShape.circle, this.textStyle});

  @override
  Widget build(BuildContext context) {
    /// Builds the circular initials avatar.
    ///
    /// Returns:
    /// - A `Container` with a circular shape, a background color, and centered initials.

    
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        shape: shape,
        color: hexToColor(initialsBgColors),
      ),
      child: Center(
        child: Text(
          initials.toUpperCase(),
          style: textStyle ?? TextStyle(
            color: textColor,
            fontSize: 40,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
