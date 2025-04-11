import 'dart:developer';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:frontend/api/authenticated_api_service.dart';
import 'package:frontend/components/gender_dropdown.dart';
import 'package:frontend/components/image_picker.dart';
import 'package:frontend/l10n/l10n.dart';
import 'package:frontend/storage/storage.dart';
import 'package:frontend/utils/components.dart';
import 'package:frontend/utils/utils.dart';
import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http_parser/http_parser.dart';


/// The ProfilePage is responsible for rendering the user registration form.
/// It contains form fields, validation, and an image picker for profile pictures.
class ProfilePage extends StatefulWidget {
  static const routeName = routeProfile;
  final L10n l10n;
  final dynamic userSession;
  final SecureStorageService secureStorageService;
  final StorageService storageService;

  const ProfilePage({super.key, required this.l10n, required this.userSession, required this.storageService, required this.secureStorageService});

  @override
  ProfilePageState createState() => ProfilePageState();
}

class ProfilePageState extends State<ProfilePage> {
  bool _isProfileUpdateApiSent = false;  // Tracks if the API call is sent to prevent duplicate requests
  final _formKey = GlobalKey<FormState>(); // Form key for validation

  final DateFormat _dateFormat = DateFormat(dateFormat);
  // Controllers for input fields
  final TextEditingController _userBirthdayController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _firstNameController = TextEditingController();
  final TextEditingController _lastNameController = TextEditingController();
  final TextEditingController _currentPasswordController = TextEditingController();
  final TextEditingController _newPasswordController = TextEditingController();
  final TextEditingController _newPasswordRepeatedController = TextEditingController();
  final TextEditingController _usernameController = TextEditingController();

  bool _dataInitialized = false;
  bool _imageUpdated = false;  // Stores if image modified
  bool _updatePassword = false;
  XFile? _selectedImage;  // Stores the selected image
  String initials = "";
  String userInitialsBgColor = getRandomHexColor();
  String? _currentPasswordErrorMessage;  // Stores the error message (if any)
  String? _errorMessage;  // Stores the error message (if any)
  String? _selectedUserGender;  // Stores the selected gender
  String? _successMessage;  // Stores the success
  String? _userBirthdayServerError;  // Stores the server error
  String? _emailServerError;  // Stores the server error
  String? _firstNameServerError;  // Stores the server error
  String? _lastNameServerError;  // Stores the server error
  String? _usernameServerError;  // Stores the server error

/// Function to open the date picker and set the selected date in the user birthday field.
  Future<void> _selectDate(BuildContext context) async {
    DateTime now = DateTime.now();
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _userBirthdayController.text.isNotEmpty  ? _dateFormat.parse(_userBirthdayController.text) : null,
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      locale: Localizations.localeOf(context), // Add localization
    );
    if (picked != null) {
      setState(() {
        _userBirthdayController.text = _dateFormat.format(picked);
        _userBirthdayServerError = null;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // Handle null user session using post-frame callback
    if (widget.userSession == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && !Navigator.of(context).userGestureInProgress) {
          Navigator.pushReplacementNamed(context, routeSignIn);
        }
      });
      return Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    
    final AuthenticatedApiBackendService authenticatedApiBackendService = AuthenticatedApiBackendService(
      secureStorageService: widget.secureStorageService,
      storageService: widget.storageService,
    );
    String currentLanguage = Localizations.localeOf(context).languageCode;
    if(!_dataInitialized){
      _dataInitialized = true;
      _lastNameController.text = widget.userSession["last_name"];
      _firstNameController.text = widget.userSession["first_name"];
      _userBirthdayController.text = widget.userSession["user_birthday"] ?? "";
      _emailController.text = widget.userSession["email"];
      _selectedUserGender = widget.userSession["user_gender"];
      _usernameController.text = widget.userSession["username"];
      userInitialsBgColor = (widget.userSession["user_initials_bg_color"] ?? "").isEmpty ? userInitialsBgColor : widget.userSession["user_initials_bg_color"];
      // if(widget.userSession["user_image_url"] != null){
      //   _selectedImage = createXFileFromUrl(widget.userSession["user_image_url"]) as XFile?;
      // }
      initials = getInitials(_lastNameController.text, _firstNameController.text);
    }
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.l10n.translate("Profile", currentLanguage)),
        actions: [
          renderLanguagesIcon(widget.l10n, widget.storageService, context),
        ],
      ),
      drawer: renderDrawerMenu(widget.l10n, widget.storageService, widget.secureStorageService, context),
      body: SingleChildScrollView(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(16.0),
            child: Form(
              key: _formKey,
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxWidth: MediaQuery.of(context).size.width * 0.9, // 90% of screen width
                  minWidth: 400, // Optional: Set a minimum width if needed
                  maxHeight: double.infinity,
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: ImagePickerWidget(
                        initials: initials,
                        userInitialsBgColor: userInitialsBgColor,
                        labelText: widget.l10n.translate(_selectedImage == null && widget.userSession["user_image_url"] == null ? "Select Profile Image" : "Change Profile Image", currentLanguage),
                        labelTextCamera: widget.l10n.translate(_selectedImage == null && widget.userSession["user_image_url"] == null ? "Take photo" : "Change photo", currentLanguage),
                        onImageSelected: (XFile? image) {
                          setState(() {
                            _selectedImage = image;
                            _imageUpdated = true;
                          });
                        },
                        initialImageUrl: widget.userSession["user_image_url"],
                      ),
                    ),
                    TextFormField(
                      controller: _lastNameController,
                      decoration: InputDecoration(
                        errorText: _lastNameServerError,
                        labelText: widget.l10n.translate("Last name", currentLanguage)
                      ),
                      onChanged: (value) {
                        setState(() {
                          _lastNameServerError = null;
                          initials = getInitials(value, _firstNameController.text);
                        });
                      },
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return widget.l10n.translate("Please enter your last name", currentLanguage);
                        }
                        if (!nameRegExp.hasMatch(value)) {
                          return widget.l10n.translate("Last name can only contain alphabetic characters, hyphens, or apostrophes", currentLanguage);
                        }
                        return null;
                      },
                    ),
                    TextFormField(
                      controller: _firstNameController,
                      decoration: InputDecoration(
                        errorText: _firstNameServerError,
                        labelText: widget.l10n.translate("First name", currentLanguage)
                      ),
                      onChanged: (value) {
                        setState(() {
                          _firstNameServerError = null;
                          initials = getInitials(_lastNameController.text, value);
                        });
                      },
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return widget.l10n.translate("Please enter your first name", currentLanguage);
                        }
                        if (!nameRegExp.hasMatch(value)) {
                          return widget.l10n.translate("First name can only contain alphabetic characters, hyphens, or apostrophes", currentLanguage);
                        }
                        return null;
                      },
                    ),
                    TextFormField(
                      controller: _userBirthdayController,
                      decoration: InputDecoration(
                        errorText: _userBirthdayServerError,
                        labelText: widget.l10n.translate("Birthday", currentLanguage),
                        hintText: dateFormatLabel,
                        suffixIcon: Icon(Icons.calendar_today),
                      ),
                      readOnly: true,
                      onTap: () => _selectDate(context),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return widget.l10n.translate("Please select your birthday", currentLanguage);
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 20),
                    GenderDropdown(
                      l10n: widget.l10n,
                      initialGender: _selectedUserGender,
                      onChanged: (String? userGender) {
                        setState(() {
                          _selectedUserGender = userGender;
                        });
                      },
                    ),
                    TextFormField(
                      controller: _emailController,
                      enabled: false,
                      decoration: InputDecoration(
                        errorText: _emailServerError,
                        labelText: widget.l10n.translate("Email", currentLanguage)
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return widget.l10n.translate("Please enter your email", currentLanguage);
                        }
                        if (!emailRegExp.hasMatch(value)) {
                          return widget.l10n.translate("Please enter a valid email address", currentLanguage);
                        }
                        return null;
                      },
                    ),
                    // Email or username text field
                    TextFormField(
                      controller: _usernameController,
                      enabled: false,
                      decoration: InputDecoration(
                        errorText: _usernameServerError,
                        labelText: widget.l10n.translate("Username", currentLanguage)
                      ),
                      validator: (value) {
                        if(value == null || value.isEmpty) {
                          return widget.l10n.translate("Please enter your username", currentLanguage);
                        }
                        if(!letterStartRegExp.hasMatch(value)) {
                          return widget.l10n.translate("Username must start with a letter.", currentLanguage);
                        }
                        else if(!alphNumUnderscoreRegExp.hasMatch(value)) {
                          return widget.l10n.translate("Username can only contain letters, numbers, and underscores.", currentLanguage);
                        }
                        else if(value.length < 3 || value.length > 20) {
                          return widget.l10n.translate("Username must be between 3 and 20 characters long.", currentLanguage);
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 20),
                    Container(
                      margin: EdgeInsets.only(bottom: 10),  // Add margin bottom here
                      child: ElevatedButton(
                        onPressed: () {
                          setState(() {
                            _updatePassword = !_updatePassword;
                            _successMessage = null;
                          });
                        },
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(widget.l10n.translate("Update password", currentLanguage)),
                            Padding(
                              padding: const EdgeInsets.only(left: 8.0),
                              child: SizedBox(
                                width: 16,
                                height: 16,
                                child: Icon(
                                  _updatePassword ? Icons.arrow_upward : Icons.arrow_downward,
                                  color: Colors.white,
                                  size: 16,
                                ),
                              ),
                            ),
                          ]
                        )
                      )
                    ),
                    if(_updatePassword)
                      TextFormField(
                        controller: _currentPasswordController,
                        decoration: InputDecoration(
                          errorText: _currentPasswordErrorMessage == null ? null : widget.l10n.translate(_currentPasswordErrorMessage ?? "", currentLanguage),
                          labelText: widget.l10n.translate("Current password", currentLanguage)
                        ),
                        obscureText: true,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return widget.l10n.translate("Please enter your current password", currentLanguage);
                          }
                          return null;
                        },
                      ),
                    if(_updatePassword)
                      TextFormField(
                        controller: _newPasswordController,
                        decoration: InputDecoration(labelText: widget.l10n.translate("New password", currentLanguage)),
                        obscureText: true,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return widget.l10n.translate("Please enter your new password", currentLanguage);
                          }
                          else if(value.length < 8) {
                            return widget.l10n.translate("Password length must be greater than or equal to 8", currentLanguage);
                          }
                          else if (_newPasswordRepeatedController.text.isNotEmpty && value != _newPasswordRepeatedController.text) {
                            return widget.l10n.translate("The two passwords do not match", currentLanguage);
                          }
                          return null;
                        },
                      ),
                    if(_updatePassword)
                      TextFormField(
                        controller: _newPasswordRepeatedController,
                        decoration: InputDecoration(labelText: widget.l10n.translate("Re-enter your new password", currentLanguage)),
                        obscureText: true,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return widget.l10n.translate("Please re-enter your new password", currentLanguage);
                          }
                          else if(value.length < 8) {
                            return widget.l10n.translate("Password length must be greater than or equal to 8", currentLanguage);
                          }
                          else if (_newPasswordController.text.isNotEmpty && value != _newPasswordController.text) {
                            return widget.l10n.translate("The two passwords do not match", currentLanguage);
                          }
                          return null;
                        },
                      ),
                    // Show success message if present
                    if (_successMessage != null)
                      Column(
                        children: [
                          SizedBox(height: 20),
                          Padding(
                            padding: const EdgeInsets.only(bottom: 8.0),
                            child: Text(
                              widget.l10n.translate(_successMessage!, currentLanguage),
                              style: TextStyle(color: const Color.fromARGB(255, 0, 255, 8)),
                            ),
                          ),
                        ],
                      ),
                    // Show error message if present
                    if (_errorMessage != null)
                      Column(
                        children: [
                          SizedBox(height: 20),
                          Padding(
                            padding: const EdgeInsets.only(bottom: 8.0),
                            child: Text(
                              widget.l10n.translate(_errorMessage!, currentLanguage),
                              style: TextStyle(color: Colors.red),
                            ),
                          ),
                        ],
                      ),
                    SizedBox(height: 20),
                    Container(
                      margin: EdgeInsets.only(bottom: 10),  // Add margin bottom here
                      child: ElevatedButton(
                        onPressed: _isProfileUpdateApiSent ? null : () {
                          if (_formKey.currentState!.validate()) {
                            // Perform the profile data update logic
                            updateProfile(widget.storageService, currentLanguage, context, authenticatedApiBackendService);
                          }
                        },
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            if (_isProfileUpdateApiSent)
                              Padding(
                                padding: const EdgeInsets.only(right: 8.0),
                                child: SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                    strokeWidth: 2.0,
                                  ),
                                ),
                              ),
                            Text(widget.l10n.translate("Update profile", currentLanguage)),
                          ]
                        )
                      )
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    
    );
  }

  void updateProfile(StorageService storageService, String currentLanguage, BuildContext context, AuthenticatedApiBackendService authenticatedApiBackendService) async {
    // Add your profile data update logic here, such as an HTTP request to your backend.
    final userBirthday = _userBirthdayController.text;
    final firstName = _firstNameController.text;
    final lastName = _lastNameController.text;
    final email = _emailController.text;
    final currentPassword = _currentPasswordController.text;
    final newPassword = _newPasswordController.text;
    final username = _usernameController.text;


    setState(() {
      _errorMessage = null;
      _successMessage = null;
      _emailServerError = null;
      _currentPasswordErrorMessage = null;
      _isProfileUpdateApiSent = true;
      _usernameServerError = null;
    });
    try {
      FormData formData = FormData.fromMap({
        "user_birthday": userBirthday,
        "email": email,
        "first_name": firstName,
        "user_gender": _selectedUserGender ?? "",
        "user_initials_bg_color": userInitialsBgColor,
        "last_name": lastName,
        "current_language": currentLanguage,
        "current_password": currentPassword,
        "new_password": newPassword,
        "update_password": _updatePassword.toString(),
        "image_updated": _imageUpdated.toString(),
        "username": username,
      });
      
      if (_selectedImage != null) {
        MultipartFile profileImage;
        final mimeType = getMimeType(_selectedImage!.path);

        if (kIsWeb) {
          // 🌐 Web: Convert file to bytes
          Uint8List bytes = await _selectedImage!.readAsBytes();
          profileImage = MultipartFile.fromBytes(
            bytes,
            filename: _selectedImage!.name,
          );
        } else {
          // 📱 Mobile: Use file path
          profileImage = await MultipartFile.fromFile(
            _selectedImage!.path,
            filename: _selectedImage!.name,
          );
        }
        formData.files.add(MapEntry('profile_image', profileImage));
      }
      final response = await authenticatedApiBackendService.updateProfile(formData: formData);

      // Assuming the response contains the username
      if(response["success"]){
        bool updateTokens = _updatePassword && !response["wrong_password"];
        if (mounted){
          setState(() {
            _successMessage = response["message"];
            _imageUpdated = false;
            _isProfileUpdateApiSent = false;
            _updatePassword = response["wrong_password"];
            _currentPasswordErrorMessage = response["wrong_password"] ? "The current password is incorrect, so the password has not been updated." : null;
          });
        }
        if(updateTokens){
          widget.secureStorageService.saveTokens(response["access_token"], response["refresh_token"]);
        }
        widget.storageService.set(key: 'user', obj: response["user"], updateNotifier: true);
      }
      else if(!response["success"] && response["message"] != null){
        
        setState(() {
          _errorMessage = response["message"];  // Set the error message on unsuccessful profile update
          _isProfileUpdateApiSent = false;
          if(response["errors"] != null){
            if(response["errors"]["user_birthday"] != null){
              _userBirthdayServerError = response["errors"]["user_birthday"][0];
            }
            if(response["errors"]["current_password"] != null){
              _currentPasswordErrorMessage = response["errors"]["current_password"][0];
            }
            if(response["errors"]["email"] != null){
              _emailServerError = response["errors"]["email"][0];
            }
            if(response["errors"]["first_name"] != null){
              _firstNameServerError = response["errors"]["first_name"][0];
            }
            if(response["errors"]["last_name"] != null){
              _lastNameServerError = response["errors"]["last_name"][0];
            }
            if(response["errors"]["username"] != null){
              _usernameServerError = response["errors"]["username"][0];
            }
          }
        });
      }
      else{
        setState(() {
          _errorMessage = "An error occurred while updating profile information. Please try again later.";  // Set the error message on unsuccessful profile update
          _isProfileUpdateApiSent = false;
        });
      }
    } catch (e) {
      logMessage(e, "", "e", "", true);
      setState(() {
        _errorMessage = "An error occurred while updating profile information. Please try again later.";  // Set the error message on unsuccessful profile update
          _isProfileUpdateApiSent = false;
      });
    }

  }



  @override
  void dispose() {
    _userBirthdayController.dispose();
    _emailController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _newPasswordRepeatedController.dispose();
    _usernameController.dispose();
    super.dispose();
  }
}
