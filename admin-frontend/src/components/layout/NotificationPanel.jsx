import React from 'react';

import {
  X,
  Check,
  Trash2,
  Bell,
  User,
  Mail,
  Calendar,
  AlertCircle
} from 'lucide-react';

import {
  formatDistanceToNow
} from 'date-fns';

import {
  useNavigate
} from 'react-router-dom';

const ICON_MAP = {

  user: {
    icon: User,
    grad: 'from-brand-500 to-brand-600',
    ring: 'ring-brand-100'
  },

  inquiry: {
    icon: Mail,
    grad: 'from-emerald-500 to-teal-500',
    ring: 'ring-emerald-100'
  },

  appointment: {
    icon: Calendar,
    grad: 'from-blue-500 to-brand-500',
    ring: 'ring-blue-100'
  },

  alert: {
    icon: AlertCircle,
    grad: 'from-amber-500 to-orange-400',
    ring: 'ring-amber-100'
  },

  default: {
    icon: Bell,
    grad: 'from-slate-400 to-slate-500',
    ring: 'ring-slate-100'
  }
};

const NotificationPanel = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClose,
}) => {

  const navigate = useNavigate();

  const notifs = Array.isArray(notifications)
    ? notifications
    : [];

  const unreadCount =
    notifs.filter(n => !n.isRead).length;

  const handleNotificationClick = async (
    notification
  ) => {

    try {

      if (!notification.isRead) {

        await onMarkAsRead(
          notification._id
        );
      }

      if (notification.link) {

        navigate(notification.link);

      } else {

        navigate('/admin/notifications');
      }

      onClose();

    } catch (err) {

      console.log(err);
    }
  };

  return (

    <div
      className="
        absolute right-0 top-12
        origin-top-right
        animate-in fade-in zoom-in-95 duration-200
        w-[380px]
        max-w-[95vw]
        bg-white
        rounded-2xl
        shadow-2xl
        border border-slate-200
        overflow-hidden
        flex flex-col
        z-[9999]
        max-h-[75vh]
      "
    >

      {/* HEADER */}

      <div
        className="
          flex items-center justify-between
          px-4 py-3
          border-b border-slate-100
          bg-white
          flex-shrink-0
        "
      >

        <div className="flex items-center gap-2">

          <h3 className="font-bold text-slate-800 text-sm">
            Notifications
          </h3>

          {unreadCount > 0 && (

            <span
              className="
                min-w-[20px]
                h-5
                px-1
                rounded-full
                bg-brand-600
                text-white
                text-[10px]
                font-bold
                flex items-center justify-center
              "
            >
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">

          {unreadCount > 0 && (

            <button
              onClick={onMarkAllAsRead}
              className="
                text-[11px]
                font-semibold
                text-brand-600
                hover:text-brand-700
              "
            >
              Mark all read
            </button>
          )}

          <button
            onClick={onClose}
            className="
              w-7 h-7
              rounded-lg
              flex items-center justify-center
              hover:bg-slate-100
              text-slate-500
            "
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* BODY */}

      <div
        className="
          overflow-y-auto
          max-h-[60vh]
        "
      >

        {notifs.length === 0 ? (

          <div
            className="
              h-[300px]
              flex flex-col
              items-center
              justify-center
              text-center
              px-6
            "
          >

            <div
              className="
                w-14 h-14
                rounded-2xl
                bg-slate-100
                flex items-center justify-center
                mb-3
              "
            >
              <Bell
                size={24}
                className="text-slate-400"
              />
            </div>

            <p className="text-sm font-semibold text-slate-700">
              No notifications
            </p>

            <p className="text-xs text-slate-400 mt-1">
              You're all caught up
            </p>
          </div>

        ) : (

          <div className="divide-y divide-slate-100">

            {notifs.map((notification) => {

              const cfg =
                ICON_MAP[notification.type]
                || ICON_MAP.default;

              const Icon = cfg.icon;

              return (

                <div
                  key={notification._id}
                  onClick={() =>
                    handleNotificationClick(
                      notification
                    )
                  }
                  className={`
                    flex items-start gap-3
                    px-4 py-3
                    cursor-pointer
                    transition-all
                    hover:bg-slate-50
                    ${!notification.isRead
                      ? 'bg-brand-50/40'
                      : ''
                    }
                  `}
                >

                  {/* ICON */}

                  <div
                    className={`
                      w-10 h-10
                      rounded-2xl
                      bg-gradient-to-br
                      ${cfg.grad}
                      text-white
                      flex items-center justify-center
                      shadow-sm
                      flex-shrink-0
                    `}
                  >
                    <Icon size={15} />
                  </div>

                  {/* CONTENT */}

                  <div className="flex-1 min-w-0">

                    <div className="flex items-center gap-2">

                      <p
                        className="
                          text-[13px]
                          font-semibold
                          text-slate-800
                          truncate
                        "
                      >
                        {notification.title}
                      </p>

                      {!notification.isRead && (

                        <span
                          className="
                            w-2 h-2
                            rounded-full
                            bg-brand-500
                            flex-shrink-0
                          "
                        />
                      )}
                    </div>

                    <p
                      className="
                        text-[12px]
                        text-slate-500
                        mt-0.5
                        break-words
                        leading-relaxed
                      "
                    >
                      {notification.message}
                    </p>

                    <span
                      className="
                        text-[10px]
                        text-slate-400
                        mt-1
                        block
                      "
                    >
                      {formatDistanceToNow(
                        new Date(
                          notification.createdAt
                        ),
                        {
                          addSuffix: true
                        }
                      )}
                    </span>
                  </div>

                  {/* ACTIONS */}

                  <div
                    className="
                      flex flex-col gap-1
                      flex-shrink-0
                    "
                    onClick={(e) =>
                      e.stopPropagation()
                    }
                  >

                    {!notification.isRead && (

                      <button
                        onClick={() =>
                          onMarkAsRead(
                            notification._id
                          )
                        }
                        className="
                          w-6 h-6
                          rounded-md
                          bg-emerald-50
                          text-emerald-600
                          flex items-center justify-center
                          hover:bg-emerald-100
                        "
                      >
                        <Check size={11} />
                      </button>
                    )}

                    <button
                      onClick={() =>
                        onDelete(
                          notification._id
                        )
                      }
                      className="
                        w-6 h-6
                        rounded-md
                        bg-red-50
                        text-red-500
                        flex items-center justify-center
                        hover:bg-red-100
                      "
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default NotificationPanel;