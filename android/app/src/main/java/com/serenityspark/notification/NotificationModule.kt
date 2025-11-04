package com.serenityspark.notification

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
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

class NotificationModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "NotificationModule"

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
