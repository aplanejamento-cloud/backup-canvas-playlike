import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useDeleteNotification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

const tipoIcon: Record<string, string> = {
  mimo: "🎁",
  follow: "👥",
  like: "💛",
  comment: "💬",
  duel: "⚔️",
  desafio: "⚖️",
};

const NotificationsDropdown = () => {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotif = useDeleteNotification();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen(o => !o);
  };

  const handleClick = async (notification: (typeof notifications)[0]) => {
    if (!notification.lido) {
      await markRead.mutateAsync(notification.id);
    }
    setOpen(false);
    if (notification.tipo === "mimo" && notification.chat_id) {
      navigate(`/chat/${notification.chat_id}`);
    } else if (notification.tipo === "desafio") {
      navigate(`/desafios-juiz`);
    } else if (notification.post_id) {
      navigate(`/feed`);
    }
  };

  const handleMarkAll = () => {
    markAllRead.mutate();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-primary/10 transition-colors"
        aria-label="Notificações"
      >
        <Bell className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-popover border border-border rounded-xl shadow-2xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-popover">
            <span className="font-cinzel text-sm text-foreground font-semibold">Notificações</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs text-primary hover:underline"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((notif) => (
                <li key={notif.id} className="relative group">
                  <button
                    onClick={() => handleClick(notif)}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors pr-10",
                      !notif.lido && "bg-primary/5"
                    )}
                  >
                    <div className="shrink-0 w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {notif.from_profile?.avatar_url ? (
                        <img src={notif.from_profile.avatar_url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <span className="text-lg">{tipoIcon[notif.tipo] || "🔔"}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-snug line-clamp-2">
                        {notif.from_profile?.name && (
                          <span className="font-semibold">{notif.from_profile.name} </span>
                        )}
                        {notif.mensagem}
                      </p>
                      <time className="text-[10px] text-muted-foreground mt-0.5 block">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                      </time>
                    </div>
                    {!notif.lido && (
                      <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-1" />
                    )}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotif.mutate(notif.id); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/20 transition-all"
                    title="Excluir notificação"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
