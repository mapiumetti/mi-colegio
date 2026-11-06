package expo.modules.concentracion

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Modo concentración: activa o desactiva el "No molestar" de Android.
 * Requiere que el usuario le dé a Mi Colegio el permiso de "Acceso a No molestar".
 */
class ConcentracionModule : Module() {
  private val context: Context
    get() = requireNotNull(appContext.reactContext) { "Sin contexto de Android" }

  private val manager: NotificationManager
    get() = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

  override fun definition() = ModuleDefinition {
    Name("Concentracion")

    Function("tienePermiso") {
      manager.isNotificationPolicyAccessGranted
    }

    Function("pedirPermiso") {
      val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }

    Function("estaActivo") {
      manager.currentInterruptionFilter != NotificationManager.INTERRUPTION_FILTER_ALL
    }

    // total = true: silencia todo. total = false: deja pasar solo lo prioritario (alarmas, contactos favoritos).
    Function("activar") { total: Boolean ->
      if (!manager.isNotificationPolicyAccessGranted) {
        false
      } else {
        manager.setInterruptionFilter(
          if (total) NotificationManager.INTERRUPTION_FILTER_NONE else NotificationManager.INTERRUPTION_FILTER_PRIORITY
        )
        true
      }
    }

    Function("desactivar") {
      if (!manager.isNotificationPolicyAccessGranted) {
        false
      } else {
        manager.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL)
        true
      }
    }
  }
}
