import 'package:flutter/material.dart';
import 'package:frontend_flutter/l10n/l10n.dart';
import 'package:frontend_flutter/storage/storage.dart';
import 'package:frontend_flutter/utils/components.dart';
import 'package:frontend_flutter/utils/utils.dart';
import 'package:go_router/go_router.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

class DashboardPage extends StatefulWidget {
  static const routeName = routeDashboard;
  final L10n l10n;
  final dynamic userSession;
  final SecureStorageService secureStorageService;
  final StorageService storageService;
  final Map<String, dynamic>? arguments;
  final WebSocketChannel? profileChannel;

  const DashboardPage({
    super.key, required this.l10n, required this.userSession, required this.storageService, 
    required this.secureStorageService, this.arguments, this.profileChannel
  });

  @override
  DashboardPageState createState() => DashboardPageState();
}

class DashboardPageState extends State<DashboardPage> {

  @override
  Widget build(BuildContext context) {
    // Handle null user session using post-frame callback
    if (widget.userSession == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && !Navigator.of(context).userGestureInProgress) {
          context.go(routeSignIn);
        }
      });
      return Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.l10n.translate("Hello", Localizations.localeOf(context).languageCode)} ${widget.userSession['last_name']}'),
        actions: [
          renderLanguagesIcon(widget.l10n, widget.storageService, context),
        ],
      ),
      drawer: renderDrawerMenu(widget.l10n, widget.storageService, widget.secureStorageService, context),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: null,
      ),
    );
  }

}
