#import <React/RCTBridgeModule.h>
#import <UserNotifications/UserNotifications.h>

@interface NotificationModule : NSObject <RCTBridgeModule>
@end

@implementation NotificationModule

RCT_EXPORT_MODULE();

RCT_REMAP_METHOD(
  requestPermissions,
  requestPermissionsWithResolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)
{
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  UNAuthorizationOptions options = UNAuthorizationOptionAlert | UNAuthorizationOptionSound;

  [center requestAuthorizationWithOptions:options
                        completionHandler:^(BOOL granted, NSError *_Nullable error) {
                          if (error != nil) {
                            reject(
                              @"notification_permission_error",
                              @"Failed to request notification permissions",
                              error);
                          } else {
                            resolve(@(granted));
                          }
                        }];
}

RCT_EXPORT_METHOD(scheduleReminder : (NSString *)title body:(NSString *)body)
{
  UNMutableNotificationContent *content = [UNMutableNotificationContent new];
  content.title = title ?: @"";
  content.body = body ?: @"";
  content.sound = [UNNotificationSound defaultSound];

  UNTimeIntervalNotificationTrigger *trigger =
    [UNTimeIntervalNotificationTrigger triggerWithTimeInterval:1 repeats:NO];

  UNNotificationRequest *request =
    [UNNotificationRequest requestWithIdentifier:@"session-reminder"
                                         content:content
                                         trigger:trigger];

  [[UNUserNotificationCenter currentNotificationCenter] addNotificationRequest:request
                                                        withCompletionHandler:nil];
}

RCT_EXPORT_METHOD(scheduleDailyReminder:(NSString *)identifier
                  title:(NSString *)title
                  body:(NSString *)body
                  hour:(NSInteger)hour
                  minute:(NSInteger)minute)
{
  UNMutableNotificationContent *content = [UNMutableNotificationContent new];
  content.title = title ?: @"";
  content.body = body ?: @"";
  content.sound = [UNNotificationSound defaultSound];

  NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
  dateComponents.hour = hour;
  dateComponents.minute = minute;

  UNCalendarNotificationTrigger *trigger =
    [UNCalendarNotificationTrigger triggerWithDateMatchingComponents:dateComponents repeats:YES];

  UNNotificationRequest *request =
    [UNNotificationRequest requestWithIdentifier:identifier
                                         content:content
                                         trigger:trigger];

  [[UNUserNotificationCenter currentNotificationCenter] addNotificationRequest:request
                                                        withCompletionHandler:^(NSError *error) {
    if (error) {
      NSLog(@"Failed to schedule notification: %@", error.localizedDescription);
    }
  }];
}

RCT_EXPORT_METHOD(cancelScheduledReminder:(NSString *)identifier)
{
  [[UNUserNotificationCenter currentNotificationCenter]
    removePendingNotificationRequestsWithIdentifiers:@[identifier]];
}

RCT_EXPORT_METHOD(cancelAllScheduledReminders)
{
  [[UNUserNotificationCenter currentNotificationCenter] removeAllPendingNotificationRequests];
}

RCT_EXPORT_METHOD(clearAll)
{
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  [center removeAllPendingNotificationRequests];
  [center removeAllDeliveredNotifications];
}

RCT_REMAP_METHOD(
  getAuthorizationStatus,
  getAuthorizationStatusWithResolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)
{
  [[UNUserNotificationCenter currentNotificationCenter]
    getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *settings) {
      if (settings == nil) {
        resolve(@"notDetermined");
        return;
      }

      NSString *status = @"notDetermined";
      switch (settings.authorizationStatus) {
        case UNAuthorizationStatusDenied:
          status = @"denied";
          break;
        case UNAuthorizationStatusAuthorized:
          status = @"authorized";
          break;
#if defined(UNAuthorizationStatusProvisional)
        case UNAuthorizationStatusProvisional:
          status = @"provisional";
          break;
#endif
#if defined(UNAuthorizationStatusEphemeral)
        case UNAuthorizationStatusEphemeral:
          status = @"ephemeral";
          break;
#endif
#if defined(UNAuthorizationStatusRestricted)
        case UNAuthorizationStatusRestricted:
          status = @"restricted";
          break;
#endif
        case UNAuthorizationStatusNotDetermined:
        default:
          status = @"notDetermined";
          break;
      }

      resolve(status);
    }];
}

@end
