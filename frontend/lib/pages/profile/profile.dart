
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:frontend/components/custom_button.dart';
import 'package:frontend/components/custom_password_field.dart';
import 'package:frontend/components/custom_phone_number_field.dart';
import 'package:frontend/components/custom_text_field.dart';
import 'package:frontend/api/authenticated_api_service.dart';
import 'package:frontend/api/unauthenticated_api_service.dart';
import 'package:frontend/components/gender_dropdown.dart';
import 'package:frontend/components/image_picker.dart';
import 'package:frontend/l10n/l10n.dart';
import 'package:frontend/storage/storage.dart';
import 'package:frontend/utils/components.dart';
import 'package:frontend/utils/platform_detector.dart';
import 'package:frontend/utils/utils.dart';
import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:intl_phone_number_input/intl_phone_number_input.dart';
import 'package:phone_numbers_parser/phone_numbers_parser.dart'  as phone_number_parser;


/// ProfilePage displays and manages user profile information.
/// 
/// This widget provides:
/// - User profile viewing/editing
/// - Image upload capability
/// - Form validation
/// - Password update functionality
/// 
/// Requires:
/// - [l10n] for localization
/// - [userSession] containing current user data
/// - [secureStorageService] for token management
/// - [storageService] for local storage
/// - [thirdPartyAuthService] for third party auth service
/// - [authenticatedApiBackendService] for auth service api
/// - [providedContext] for provided context
class ProfilePage extends StatefulWidget {
  static const routeName = routeProfile;
  final L10n l10n;
  final dynamic userSession;
  final SecureStorageService secureStorageService;
  final StorageService storageService;
  final ThirdPartyAuthService? thirdPartyAuthService;
  final AuthenticatedApiBackendService? authenticatedApiBackendService;
  final BuildContext? providedContext;

  const ProfilePage({super.key, required this.l10n, required this.userSession, required this.storageService, required this.secureStorageService, this.thirdPartyAuthService, this.authenticatedApiBackendService, this.providedContext});

  @override
  ProfilePageState createState() => ProfilePageState();
}

/// State management for ProfilePage
/// 
/// Manages:
/// - Form state and validation
/// - API call states
/// - User input controllers
/// - Error/success messages
/// - Image selection state
class ProfilePageState extends State<ProfilePage> {
  bool _isProfileUpdateApiSent = false;  // Tracks if the API call is sent to prevent duplicate requests
  bool _isImageProcessing = false;
  final _formKey = GlobalKey<FormState>(); // Form key for validation

  final _nameDebouncer = Debouncer();
  final _phoneNumberDebouncer = Debouncer();

  final DateFormat _dateFormat = DateFormat(dateFormat);
  // Controllers for input fields
  final TextEditingController _userBirthdayController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _userPhoneNumberController = TextEditingController();
  final TextEditingController _firstNameController = TextEditingController();
  final TextEditingController _lastNameController = TextEditingController();
  final TextEditingController _currentPasswordController = TextEditingController();
  final TextEditingController _newPasswordController = TextEditingController();
  final TextEditingController _newPasswordRepeatedController = TextEditingController();
  final TextEditingController _usernameController = TextEditingController();

  bool setPhoneNumberBasedOnCountry = true;
  String isoCode = dotenv.env['DEFAULT_COUNTRY_CODE'] ?? 'MA';
  late PhoneNumber completePhoneNumber = PhoneNumber(isoCode: isoCode);
  final platform = getPlatformType();

  bool _dataInitialized = false;
  bool _imageUpdated = false;  // Stores if image modified
  bool _updatePassword = false;
  XFile? _selectedImage;  // Stores the selected image
  MultipartFile? profileImage;
  String initials = "";
  String userInitialsBgColor = getRandomHexColor();
  String? _currentPasswordErrorMessage;  // Stores the error message (if any)
  String? _errorMessage;  // Stores the error message (if any)
  String? _selectedUserGender;  // Stores the selected gender
  String? _successMessage;  // Stores the success
  String? _userBirthdayServerError;  // Stores the server error
  String? _emailServerError;  // Stores the server error
  String? _userPhoneNumberServerError;  // Stores the server error
  String? _firstNameServerError;  // Stores the server error
  String? _lastNameServerError;  // Stores the server error
  String? _usernameServerError;  // Stores the server error
  Dio dio = Dio();

  /// Opens date picker and updates birthday field
  /// 
  /// Handles:
  /// - Initial date selection based on current value
  /// - Date range constraints (1900 to today)
  /// - Localized date formatting
  Future<void> _selectDate(BuildContext context) async {
    DateTime initialCalendarDate;

    // If the birthday is already set, use that as the initial date for the calendar
    if (_userBirthdayController.text.isNotEmpty) {
      initialCalendarDate = _dateFormat.parse(_userBirthdayController.text);
    } 
    else {
      // If no birthday is set, calculate a date 10 years ago from today
      DateTime now = DateTime.now();
      initialCalendarDate = DateTime(now.year - 16, now.month, now.day);
    }
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: initialCalendarDate,
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
  
  late ThirdPartyAuthService _thirdPartyAuthService; 
  late AuthenticatedApiBackendService _authenticatedApiBackendService; 
  @override
  void initState() {
    super.initState();
    // Use the injected service or create a new one
    _thirdPartyAuthService = widget.thirdPartyAuthService ?? ThirdPartyAuthService();
    _authenticatedApiBackendService = widget.authenticatedApiBackendService ?? AuthenticatedApiBackendService(
      secureStorageService: widget.secureStorageService,
      storageService: widget.storageService,
      thirdPartyAuthService: _thirdPartyAuthService,
      providedContext: widget.providedContext,
    );
    runAsynchron();
  }
  
  void runAsynchron() async {
    if(setPhoneNumberBasedOnCountry){
      dynamic data = {
        'requested_info': 'countryCode',
      };
      String isoCode2 = await UnauthenticatedApiBackendService.getGeolocationInfo(data: data, dio: dio);
      if(completePhoneNumber.phoneNumber == null){
        isoCode = isoCode2;
        completePhoneNumber = PhoneNumber(isoCode: isoCode);
        setState(() {
          isoCode = isoCode;
          completePhoneNumber = completePhoneNumber;
        });
      }
    }
  }

  void _updateName(String lastNameValue, String firstNameValue, bool isLastName) {
    _nameDebouncer.run(() {
      setState(() {
        if(isLastName){
          _lastNameServerError = null;
        }
        else{
          _firstNameServerError = null;
        }
        initials = getInitials(lastNameValue, firstNameValue);
      });
    });
  }
  void _updatePhoneNumber(PhoneNumber number) {
    _phoneNumberDebouncer.run(() {
      completePhoneNumber = number;
      setState(() {
        _userPhoneNumberServerError = null; // Clear error on input change
      });
    });
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
    
    String currentLanguage = Localizations.localeOf(context).languageCode;
    if(!_dataInitialized){
      _dataInitialized = true;
      _lastNameController.text = widget.userSession["last_name"];
      _firstNameController.text = widget.userSession["first_name"];
      _userBirthdayController.text = widget.userSession["user_birthday"] ?? "";
      _emailController.text = widget.userSession["email"];
      _userPhoneNumberController.text = widget.userSession["user_phone_number"] ?? "";
      if(_userPhoneNumberController.text.isNotEmpty){
        final parsedNumber = phone_number_parser.PhoneNumber.parse(_userPhoneNumberController.text);
        setPhoneNumberBasedOnCountry = false;
        completePhoneNumber = PhoneNumber(isoCode: parsedNumber.isoCode.name, phoneNumber: parsedNumber.international);
        if(parsedNumber.nsn[0] != "0" && addLeading0ToNumber(parsedNumber.isoCode.name)){
          _userPhoneNumberController.text = "0${parsedNumber.nsn}";
        }
        else{
          _userPhoneNumberController.text = parsedNumber.nsn;
        }
      }
      _selectedUserGender = widget.userSession["user_gender"]??"";
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
                        isProcessing: _isImageProcessing,
                        initials: initials,
                        userInitialsBgColor: userInitialsBgColor,
                        labelText: widget.l10n.translate(_selectedImage == null && widget.userSession["user_image_url"] == null ? "Select Profile Image" : "Change Profile Image", currentLanguage),
                        labelTextCamera: widget.l10n.translate(_selectedImage == null && widget.userSession["user_image_url"] == null ? "Take photo" : "Change photo", currentLanguage),
                        onImageSelected: (XFile? image) async {
                          profileImage = null;
                          
                          setState(() {
                            _selectedImage = image;
                            profileImage = profileImage;
                            _isImageProcessing = true;
                            _imageUpdated = true;
                          });
                          try{
                            if (_selectedImage != null) {
                              if (platform == PlatformType.web) {
                                // 🌐 Web: Convert file to bytes
                                Uint8List bytes = await _selectedImage!.readAsBytes();
                                profileImage = MultipartFile.fromBytes(
                                  bytes,
                                  filename: _selectedImage!.name,
                                );
                              } else {
                                // 📱 Mobile: Use file path
                                final compressedFile = await compressAndResizeImage(
                                  File(_selectedImage!.path),
                                  width: 800,  // Target width
                                  jpegQuality: 80,
                                  maxDimension: 800,
                                );
                                profileImage = await MultipartFile.fromFile(
                                  compressedFile.path,
                                  filename: _selectedImage!.name,
                                );
                              }
                            }

                          } 
                          catch (e) {
                            // Fallback: Use original image if compression fails
                            setState(() => profileImage = profileImage);
                          } 
                          finally {
                            setState(() => _isImageProcessing = false);
                          }
                          
                        },
                        initialImageUrl: widget.userSession["user_image_url"],
                      ),
                    ),
                    
                    CustomTextFormField(
                      controller: _lastNameController,
                      errorText: _lastNameServerError,
                      fieldKey: "last-name",
                      l10n: widget.l10n,
                      labelKey: "Last name",
                      onChanged: (value) => _updateName(value, _firstNameController.text, true),
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
                    CustomTextFormField(
                      controller: _firstNameController,
                      errorText: _firstNameServerError,
                      fieldKey: "first-name",
                      key: const Key('first-name'),
                      l10n: widget.l10n,
                      labelKey: "First name",
                      onChanged: (value) => _updateName(_lastNameController.text, value, false),
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
                    CustomTextFormField(
                      controller: _userBirthdayController,
                      errorText: _userBirthdayServerError,
                      fieldKey: "birthday",
                      l10n: widget.l10n,
                      labelKey: "Birthday",
                      hintText: dateFormatLabel,
                      suffixIcon: Icon(Icons.calendar_today),
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
                      fieldKey: "gender",
                      l10n: widget.l10n,
                      initialGender: _selectedUserGender,
                      onChanged: (String? userGender) {
                        setState(() {
                          _selectedUserGender = userGender;
                        });
                      },
                    ),
                    CustomTextFormField(
                      controller: _emailController,
                      errorText: _emailServerError,
                      fieldKey: "email",
                      l10n: widget.l10n,
                      labelKey: "Email",
                      enabled: false,
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
                    CustomTextFormField(
                      controller: _usernameController,
                      errorText: _usernameServerError,
                      fieldKey: "username",
                      l10n: widget.l10n,
                      labelKey: "Username",
                      enabled: false,
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
                    CustomPhoneNumberField(
                      controller: _userPhoneNumberController,
                      errorText: _userPhoneNumberServerError,
                      fieldKey: "user-phone-number",
                      l10n: widget.l10n,
                      labelKey: widget.l10n.translate("Phone number", currentLanguage),
                      initialValue: completePhoneNumber,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return widget.l10n.translate("Please enter your phone number", currentLanguage);
                        }
                        final fullPhone = completePhoneNumber.phoneNumber;
                        if (fullPhone == null || !RegExp(r'^\+\d{10,15}$').hasMatch(fullPhone)) {
                          return widget.l10n.translate("Please enter a valid phone number", currentLanguage);
                        }
                        return null;
                      },
                      onChanged: (value, number) {
                        _updatePhoneNumber(number);
                      },
                    ),
                    SizedBox(height: 20),
                    AnimatedContainer(
                      duration: Duration(milliseconds: 300),
                      margin: EdgeInsets.only(bottom: 10),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        gradient: LinearGradient(
                          colors: _updatePassword 
                              ? [Colors.orange.shade600, Colors.red.shade400] 
                              : [Colors.blue.shade600, Colors.blue.shade400],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black12,
                            blurRadius: 4,
                            offset: Offset(0, 2),
                          ),
                        ],
                      ),
                      child: CustomButton(
                        keyWidget: const Key('updatePassworButton'),
                        margin: EdgeInsets.only(bottom: 0),
                        text: widget.l10n.translate(_updatePassword ? "Hide password update" : "Update password", currentLanguage),
                        icon: AnimatedSwitcher(
                          duration: Duration(milliseconds: 300),
                          child: Icon(
                            _updatePassword ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                            color: Colors.white,
                            key: ValueKey<bool>(_updatePassword),
                          ),
                        ),
                        onPressed: () {
                          setState(() {
                            _updatePassword = !_updatePassword;
                            _successMessage = null;
                          });
                        },
                        backgroundColor: _updatePassword ? Colors.orange.shade600 : Colors.blue.shade600,
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    if(_updatePassword)
                      CustomPasswordFormField(
                        controller: _currentPasswordController,
                        fieldKey: "current-password",
                        l10n: widget.l10n,
                        labelKey: "Current password",
                        obscureText: true,
                        errorText: _currentPasswordErrorMessage,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return widget.l10n.translate("Please enter your current password", currentLanguage);
                          }
                          return null;
                        },
                      ),
                    if(_updatePassword)
                      CustomPasswordFormField(
                        controller: _newPasswordController,
                        fieldKey: "new-password",
                        l10n: widget.l10n,
                        labelKey: "New password",
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
                      CustomPasswordFormField(
                        controller: _newPasswordRepeatedController,
                        fieldKey: "new-password-repeated",
                        l10n: widget.l10n,
                        labelKey: "Re-enter your new password",
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
                    CustomButton(
                      keyWidget: const Key('updateProfileButton'),
                      margin: EdgeInsets.only(bottom: 10),
                      text: widget.l10n.translate("Update profile", currentLanguage),
                      showLoader: _isProfileUpdateApiSent || _isImageProcessing,
                      isEnabled: !_isProfileUpdateApiSent && !_isImageProcessing,
                      onPressed: _isProfileUpdateApiSent || _isImageProcessing ? null : () {
                        if (_formKey.currentState!.validate()) {
                          // Perform the profile data update logic
                          updateProfile(widget.storageService, currentLanguage, context, _authenticatedApiBackendService);
                        }
                      },
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

  /// Handles profile update API call
  /// 
  /// Parameters:
  /// - [storageService] for local storage operations
  /// - [currentLanguage] for localization
  /// - [context] for navigation/UI
  /// - [authenticatedApiBackendService] for API calls
  /// 
  /// Manages:
  /// - Form data preparation
  /// - Image upload handling (web/mobile)
  /// - API response processing
  /// - Error/success states
  /// - Token updates if password changed
  void updateProfile(StorageService storageService, String currentLanguage, BuildContext context, AuthenticatedApiBackendService authenticatedApiBackendService) async {
    
    if (_updatePassword && 
      !await showConfirmationDialog(
        context,
        widget.l10n,
        "Change Password",
        "Are you sure you want to update your password?",
      )) {
      return; // Exit if user cancels
    }

    // Add your profile data update logic here, such as an HTTP request to your backend.
    final userBirthday = _userBirthdayController.text;
    final firstName = _firstNameController.text;
    final lastName = _lastNameController.text;
    final email = _emailController.text;
    final userPhoneNumber = formatPhoneNumber(completePhoneNumber);
    final currentPassword = _currentPasswordController.text;
    final newPassword = _newPasswordController.text;
    final username = _usernameController.text;


    setState(() {
      _errorMessage = null;
      _successMessage = null;
      _emailServerError = null;
      _userPhoneNumberServerError = null;
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
        "user_phone_number": userPhoneNumber,
        "username": username,
      });
      
      if (profileImage != null) {
        formData.files.add(MapEntry('profile_image', profileImage!));
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
            if(response["errors"]["user_phone_number"] != null){
              _userPhoneNumberServerError = response["errors"]["user_phone_number"][0];
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
    _nameDebouncer.timer?.cancel();
    _phoneNumberDebouncer.timer?.cancel();
    _userBirthdayController.dispose();
    _emailController.dispose();
    _userPhoneNumberController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _newPasswordRepeatedController.dispose();
    _usernameController.dispose();
    super.dispose();
  }
}
