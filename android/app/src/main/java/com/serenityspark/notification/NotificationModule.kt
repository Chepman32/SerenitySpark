package com.serenityspark.notification

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.serenityspark.MainActivity
import com.serenityspark.R
import java.util.Calendar

class NotificationModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "NotificationModule"

  companion object {
    const val REMINDER_CHANNEL_ID = "daily-reminders"
    const val SESSION_CHANNEL_ID = "session-reminders"
    
    // Store notification data for the broadcast receiver
    private val notificationData = mutableMapOf<String, Pair<String, String>>()
    
    fun getNotificationData(id: String): Pair<String, String>? = notificationData[id]
    fun setNotificationData(id: String, title: String, body: String) {
      notificationData[id] = Pair(title, body)
    }
  }

  @ReactMethod
  fun createChannel(id: String, name: String, description: String) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        id,
        name,
        NotificationManager.IMPORTANCE_HIGH,
      ).apply {
        enableLights(true)
        enableVibration(true)
        this.description = description
      }

      val manager =
        reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      manager.createNotificationChannel(channel)
    }
  }

  private fun ensureReminderChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        REMINDER_CHANNEL_ID,
        "Daily Reminders",
        NotificationManager.IMPORTANCE_HIGH,
      ).apply {
        enableLights(true)
        enableVibration(true)
        description = "Daily meditation reminders"
      }

      val manager =
        reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      manager.createNotificationChannel(channel)
    }
  }

  @ReactMethod
  fun sendNotification(
    channelId: String,
    title: String,
    message: String,
    notificationId: Int,
  ) {
    val context = reactContext.applicationContext
    val intent = Intent(context, MainActivity::class.java).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }

    val pendingIntent = PendingIntent.getActivity(
      context,
      0,
      intent,
      PendingIntent.FLAG_IMMUTABLE,
    )

    val notification =
      NotificationCompat.Builder(context, channelId)
        .setSmallIcon(R.mipmap.ic_launcher)
        .setContentTitle(title)
        .setContentText(message)
        .setStyle(NotificationCompat.BigTextStyle().bigText(message))
        .setPriority(NotificationCompat.PRIORITY_HIGH)
        .setAutoCancel(true)
        .setContentIntent(pendingIntent)
        .build()

    NotificationManagerCompat.from(context).notify(notificationId, notification)
  }

  @ReactMethod
  fun scheduleDailyReminder(
    identifier: String,
    title: String,
    body: String,
    hour: Int,
    minute: Int
  ) {
    ensureReminderChannel()
    
    val context = reactContext.applicationContext
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    
    // Store notification data
    setNotificationData(identifier, title, body)
    
    val intent = Intent(context, ReminderBroadcastReceiver::class.java).apply {
      action = "com.serenityspark.REMINDER_$identifier"
      putExtra("identifier", identifier)
      putExtra("title", title)
      putExtra("body", body)
    }
    
    val requestCode = identifier.hashCode()
    val pendingIntent = PendingIntent.getBroadcast(
      context,
      requestCode,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    
    // Calculate the next trigger time
    val calendar = Calendar.getInstance().apply {
      set(Calendar.HOUR_OF_DAY, hour)
      set(Calendar.MINUTE, minute)
      set(Calendar.SECOND, 0)
      set(Calendar.MILLISECOND, 0)
      
      // If the time has already passed today, schedule for tomorrow
      if (timeInMillis <= System.currentTimeMillis()) {
        add(Calendar.DAY_OF_YEAR, 1)
      }
    }
    
    // Schedule repeating alarm
    alarmManager.setRepeating(
      AlarmManager.RTC_WAKEUP,
      calendar.timeInMillis,
      AlarmManager.INTERVAL_DAY,
      pendingIntent
    )
  }

  @ReactMethod
  fun cancelScheduledReminder(identifier: String) {
    val context = reactContext.applicationContext
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    
    val intent = Intent(context, ReminderBroadcastReceiver::class.java).apply {
      action = "com.serenityspark.REMINDER_$identifier"
    }
    
    val requestCode = identifier.hashCode()
    val pendingIntent = PendingIntent.getBroadcast(
      context,
      requestCode,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    
    alarmManager.cancel(pendingIntent)
    notificationData.remove(identifier)
  }

  @ReactMethod
  fun cancelAllScheduledReminders() {
    val identifiers = listOf("morning-reminder", "day-reminder", "evening-reminder")
    identifiers.forEach { cancelScheduledReminder(it) }
  }

  @ReactMethod
  fun cancelAll() {
    NotificationManagerCompat.from(reactContext.applicationContext).cancelAll()
  }

  @ReactMethod
  fun isPermissionGranted(promise: Promise) {
    val context = reactContext.applicationContext
    val manager = NotificationManagerCompat.from(context)
    promise.resolve(manager.areNotificationsEnabled())
  }
}

class ReminderBroadcastReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val identifier = intent.getStringExtra("identifier") ?: return
    val title = intent.getStringExtra("title") ?: "Time to meditate"
    val body = intent.getStringExtra("body") ?: "Take a moment for yourself"
    
    val launchIntent = Intent(context, MainActivity::class.java).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }
    
    val pendingIntent = PendingIntent.getActivity(
      context,
      0,
      launchIntent,
      PendingIntent.FLAG_IMMUTABLE
    )
    
    val notification = NotificationCompat.Builder(context, NotificationModule.REMINDER_CHANNEL_ID)
      .setSmallIcon(R.mipmap.ic_launcher)
      .setContentTitle(title)
      .setContentText(body)
      .setStyle(NotificationCompat.BigTextStyle().bigText(body))
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setAutoCancel(true)
      .setContentIntent(pendingIntent)
      .build()
    
    val notificationId = identifier.hashCode()
    NotificationManagerCompat.from(context).notify(notificationId, notification)
  }
}
