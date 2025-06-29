import 'package:flutter/material.dart';
import 'package:frontend/api/unauthenticated_api_service.dart';
import 'package:frontend/components/custom_button.dart';
import 'package:frontend/components/custom_text_button.dart';
import 'package:frontend/components/gender_dropdown.dart';
import 'package:frontend/components/image_picker.dart';
import 'package:frontend/l10n/l10n.dart';
import 'package:frontend/pages/sign_in_up/sign_in_page.dart';
import 'package:frontend/storage/storage.dart';
import 'package:frontend/utils/components.dart';
import 'package:frontend/utils/utils.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';


/// The SignUpPage is responsible for rendering the user registration form.
/// It contains form fields, validation, and an image picker for profile pictures.
class SignUpPage extends StatefulWidget {
  /// T
  /// o
  /// r
  /// e
  /// v
  /// i
  /// e
  /// w
  static const routeName = routeSignUp;
  final L10n l10n;
  final SecureStorageService secureStorageService;
  final StorageService storageService;

  const SignUpPage({super.key, required this.l10n, required this.storageService, required this.secureStorageService});

  @override
  SignUpPageState createState() => SignUpPageState();
}

class SignUpPageState extends State<SignUpPage> {
  bool _isSignUpApiSent = false;  // Tracks if the API call is sent to prevent duplicate requests
  final _formKey = GlobalKey<FormState>(); // Form key for validation

  final DateFormat _dateFormat = DateFormat(dateFormat);
  // Controllers for input fields
  final TextEditingController _userBirthdayController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _firstNameController = TextEditingController();
  final TextEditingController _lastNameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _passwordRepeatedController = TextEditingController();
  final TextEditingController _usernameController = TextEditingController();
  
  XFile? _selectedImage;  // Stores the selected image
  String initials = "";
  String userInitialsBgColor = getRandomHexColor();
  String? _errorMessage;  // Stores the error message (if any)
  String? _selectedUserGender;  // Stores the selected gender
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
      initialDate: _userBirthdayController.text.isNotEmpty  ? _dateFormat.parse(_userBirthdayController.text) : DateTime(now.year - 24, now.month, now.day),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      locale: Localizations.localeOf(context), // Add localization
    );
    if (mounted && picked != null) {
      setState(() {
        _userBirthdayController.text = _dateFormat.format(picked);
        _userBirthdayServerError = null;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    String currentLanguage = Localizations.localeOf(context).languageCode;
    initials = getInitials(_lastNameController.text, _firstNameController.text);
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.l10n.translate("Sign Up", currentLanguage)),
        actions: [
          renderLanguagesIcon(widget.l10n, widget.storageService, context),
        ],
      ),
      body: SingleChildScrollView(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(16.0),
            child: Form(
              key: _formKey,
              child: SizedBox(
                width: 400,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: ImagePickerWidget(
                        isProcessing: false,
                        initials: initials,
                        userInitialsBgColor: userInitialsBgColor,
                        labelText: widget.l10n.translate(_selectedImage == null ? "Select Profile Image" : "Change Profile Image", currentLanguage),
                        labelTextCamera: widget.l10n.translate(_selectedImage == null ? "Take photo" : "Change photo", currentLanguage),
                        onImageSelected: (XFile? image) {
                          if(!mounted) return; // Ensure the widget is still mounted before proceeding
                          setState(() {
                            _selectedImage = image;
                          });
                        },
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
                      fieldKey: "gender",
                      initialGender: _selectedUserGender,
                      onChanged: (String? userGender) {
                        setState(() {
                          _selectedUserGender = userGender;
                        });
                      },
                    ),
                    TextFormField(
                      controller: _emailController,
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
                    TextFormField(
                      controller: _passwordController,
                      decoration: InputDecoration(labelText: widget.l10n.translate("Password", currentLanguage)),
                      obscureText: true,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return widget.l10n.translate("Please enter your password", currentLanguage);
                        }
                        else if(value.length < 8) {
                          return widget.l10n.translate("Password length must be greater than or equal to 8", currentLanguage);
                        }
                        else if (_passwordRepeatedController.text.isNotEmpty && value != _passwordRepeatedController.text) {
                          return widget.l10n.translate("The two passwords do not match", currentLanguage);
                        }
                        return null;
                      },
                    ),
                    TextFormField(
                      controller: _passwordRepeatedController,
                      decoration: InputDecoration(labelText: widget.l10n.translate("Re-enter your password", currentLanguage)),
                      obscureText: true,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return widget.l10n.translate("Please re-enter your password", currentLanguage);
                        }
                        else if(value.length < 8) {
                          return widget.l10n.translate("Password length must be greater than or equal to 8", currentLanguage);
                        }
                        else if (_passwordController.text.isNotEmpty && value != _passwordController.text) {
                          return widget.l10n.translate("The two passwords do not match", currentLanguage);
                        }
                        return null;
                      },
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
                      margin: EdgeInsets.only(bottom: 10),  // Add margin bottom here
                      text: widget.l10n.translate("Sign Up", currentLanguage),
                      showLoader: _isSignUpApiSent,
                      isEnabled: !_isSignUpApiSent,
                      onPressed: _isSignUpApiSent ? null : () {
                        if (_formKey.currentState!.validate()) {
                          // Perform the sign-up logic
                          signUpUser(widget.storageService, currentLanguage, context);
                        }
                      },
                    ),
                    // Sign in button
                    CustomTextButton(
                      margin: EdgeInsets.only(bottom: 100),  // Add margin bottom here
                      text: widget.l10n.translate("Already have an account? Sign in", currentLanguage),
                      onPressed: () {
                        context.go(SignInPage.routeName);
                      },
                    )
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  void signUpUser(StorageService storageService, String currentLanguage, BuildContext context, {Dio? dio}) async {
    // Add your sign-up logic here, such as an HTTP request to your backend.
    final userBirthday = _userBirthdayController.text;
    final firsName = _firstNameController.text;
    final lastName = _lastNameController.text;
    final email = _emailController.text;
    final password = _passwordController.text;
    final username = _usernameController.text;


    setState(() {
      _errorMessage = null;
      _emailServerError = null;
      _isSignUpApiSent = true;
      _usernameServerError = null;
    });
    try {
      FormData formData = FormData.fromMap({
        "user_birthday": userBirthday,
        "email": email,
        "first_name": firsName,
        "user_gender": _selectedUserGender,
        "user_image_url": "",
        "user_initials_bg_color": userInitialsBgColor,
        "last_name": lastName,
        "current_language": currentLanguage,
        "password": password,
        "username": username,
        if (_selectedImage != null) 
          "profile_image": await MultipartFile.fromFile(
            _selectedImage!.path,
            filename: _selectedImage!.name,
          ),
      });

      Dio dio = Dio();
      final response = await UnauthenticatedApiBackendService.signUpUser(formData: formData, dio: dio);

      if(!mounted) return; // Ensure the widget is still mounted before proceeding
      // Assuming the response contains the username
      if(response["success"] && response["username"] != null){
        if (mounted){
          setState(() {
            _errorMessage = null;  // Clear the error message on successful sign-in
            _isSignUpApiSent = false;
          });
          
          context.go(SignInPage.routeName, extra: {"arguments": {"username": response["username"]}});
        }
        //widget.storageService.set(key: 'user', obj: response["user"], updateNotifier: true);
      }
      else if(!response["success"] && response["message"] != null){
        
        setState(() {
          _errorMessage = response["message"];  // Set the error message on unsuccessful sign-in
          _isSignUpApiSent = false;
          if(response["errors"] != null){
            if(response["errors"]["user_birthday"] != null){
              _userBirthdayServerError = response["errors"]["user_birthday"][0];
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
          _errorMessage = "An error occurred when sign up! Please try later.";  // Set the error message on unsuccessful sign-in
          _isSignUpApiSent = false;
        });
      }
    } catch (e) {
      if(mounted){
        setState(() {
          _errorMessage = "An error occurred when sign up! Please try later.";  // Set the error message on unsuccessful sign-in
            _isSignUpApiSent = false;
        });
      }
      // Handle any errors that occurred during the HTTP request
      logMessage('Sign-up error: $e');
    }

  }



  @override
  void dispose() {
    _userBirthdayController.dispose();
    _emailController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _passwordController.dispose();
    _passwordRepeatedController.dispose();
    _usernameController.dispose();
    super.dispose();
  }
}
