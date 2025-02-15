
import 'package:wakelock_plus/wakelock_plus.dart';

class WakelockService {
  /// Enables the wakelock (prevents the screen from locking).
  Future<void> enable() async {
    await WakelockPlus.enable();
  }

  /// Disables the wakelock (allows the screen to lock).
  Future<void> disable() async {
    await WakelockPlus.disable();
  }
}