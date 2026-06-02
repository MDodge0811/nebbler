# Styling Color Token Map (Task 0 output)

Authoritative hex → Tailwind-class mapping for the NativeWind/Gluestack styling
migration. Every later task uses this table so migrated colors are **byte-identical**
to the originals — no near-matches, no eyeballing.

Two kinds of mapping:

- **Existing token** — the hex already has an exact RGB match in the Gluestack
  palettes (`components/ui/gluestack-ui-provider/config.ts`). Use that class.
- **`brand-*` token** — the hex had no exact match, so Task 0 added a new
  `--color-brand-*` CSS var (light + dark, dark mirrors light since the app is
  light-only) and mapped it in `tailwind.config.js`.

"Keep as constant" rows are runtime/animated/config values that **cannot** be a
className and stay as hex in TS (fed to `DynamicColorView`, `Animated.View`, or
React Navigation). These are NOT lint violations after Task 10 (path-exempt or
non-style config objects).

---

## `src/constants/calendarsUI.ts` — `calendarsUIColors`

| Key             | Hex       | RGB           | Token                    | Example classes                                                |
| --------------- | --------- | ------------- | ------------------------ | -------------------------------------------------------------- |
| `primary`       | `#00DB74` | `0 219 116`   | **brand-primary**        | `bg-brand-primary` `text-brand-primary` `border-brand-primary` |
| `primaryLight`  | `#E8FBF1` | `232 251 241` | **brand-primary-light**  | `bg-brand-primary-light`                                       |
| `primaryMid`    | `#D0F5E3` | `208 245 227` | **brand-primary-mid**    | `bg-brand-primary-mid`                                         |
| `primaryBorder` | `#A8EDCB` | `168 237 203` | **brand-primary-border** | `border-brand-primary-border`                                  |
| `border`        | `#E8E8EC` | `232 232 236` | **brand-border**         | `border-brand-border`                                          |
| `surface`       | `#FFFFFF` | `255 255 255` | background-0 (existing)  | `bg-background-0`                                              |
| `background`    | `#F5F5F7` | `245 245 247` | **brand-background**     | `bg-brand-background`                                          |
| `danger`        | `#FF6B6B` | `255 107 107` | **brand-danger**         | `bg-brand-danger` `text-brand-danger`                          |
| `dangerLight`   | `#FFF0F0` | `255 240 240` | **brand-danger-light**   | `bg-brand-danger-light`                                        |
| `text`          | `#1A1A1F` | `26 26 31`    | **brand-text**           | `text-brand-text`                                              |
| `textSecondary` | `#6B6B78` | `107 107 120` | **brand-text-secondary** | `text-brand-text-secondary`                                    |
| `textMuted`     | `#9B9BA8` | `155 155 168` | **brand-text-muted**     | `text-brand-text-muted`                                        |
| `surfaceHover`  | `#F5F5F5` | `245 245 245` | typography-50 (existing) | `bg-typography-50`                                             |

`UNGROUPED_DROP_ZONE_ID` — not a color (string id), unchanged.

`CALENDAR_PALETTE` (12 entries: Green `#00DB74`, Blue `#00B0DB`, Coral `#FF6B6B`,
Amber `#FFB347`, Violet `#A78BFA`, Pink `#F472B6`, Mint `#34D399`, Gold `#FBBF24`,
Sky `#60A5FA`, Orange `#FB923C`, Purple `#C084FC`, Teal `#2DD4BF`) — **keep as
constant.** User-pickable palette persisted to `users.avatar_color`/calendar color;
rendered at runtime via `DynamicColorView`. Not a token.

## `src/constants/calendarColors.ts` — `calendarColors`

| Key             | Hex       | RGB           | Token                     | Example classes       |
| --------------- | --------- | ------------- | ------------------------- | --------------------- |
| `today`         | `#00DB74` | `0 219 116`   | **brand-primary**         | `bg-brand-primary`    |
| `selected`      | `#00DB74` | `0 219 116`   | **brand-primary**         | `bg-brand-primary`    |
| `eventDot`      | `#00DB74` | `0 219 116`   | **brand-primary**         | `bg-brand-primary`    |
| `disabled`      | `#A3A3A3` | `163 163 163` | typography-400 (existing) | `text-typography-400` |
| `background`    | `#FFFFFF` | `255 255 255` | background-0 (existing)   | `bg-background-0`     |
| `dayText`       | `#262627` | `38 38 39`    | typography-900 (existing) | `text-typography-900` |
| `dayHeaderText` | `#666666` | `102 102 102` | primary-300 (existing)    | `text-primary-300`    |

> NOTE: `today`/`selected`/`eventDot` are consumed by `WeekStrip`/`MonthGrid` (the
> dimension-math path-exempt files) and as the `dotColor` string for `markedDates`.
> `markedDates` dot color is a data value, not a className — where it stays a string
> prop, it's fed via `DynamicColorView` or kept as a constant. Task 7/9 decide
> per-call-site; the className equivalent is `bg-brand-primary` where it's static UI.

## `src/constants/theme.ts`

| Export            | Notes                                                                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `navigationTheme` | **Keep as constant** — React Navigation `Theme` config object; requires hex strings, cannot take a className. Not a style literal, so not a lint violation. |
| `syncDotColors`   | **Keep as constant** — `Animated.View` dot colors (`SyncStatusIndicator`, a path-exempt file). Needs hex.                                                   |

`navigationTheme` hexes (for reference; all stay): background `#FFFFFF`, card
`#FFFFFF`, text `#262627`, border `#DDDCDB`, primary `#333333`, notification `#EF4444`.

`syncDotColors` hexes (all stay): connecting `#FBA94B`, connected/synced `#489766`,
syncing `#0DA6F2`, offline `#A3A3A3`, error `#EF4444`.

## `src/constants/colors.ts`

Referenced by the plan but **does not exist** in this repo. No action. (The real
color constants are the three files above plus the Gluestack `config.ts`.)

---

## New tokens added in Task 0

CSS vars in `components/ui/gluestack-ui-provider/config.ts` (light + dark, mirrored)
and mapped in `tailwind.config.js` under `colors.brand` + a `safelist` entry:

| Token                  | CSS var                        | RGB           | Hex       |
| ---------------------- | ------------------------------ | ------------- | --------- |
| `brand-primary`        | `--color-brand-primary`        | `0 219 116`   | `#00DB74` |
| `brand-primary-light`  | `--color-brand-primary-light`  | `232 251 241` | `#E8FBF1` |
| `brand-primary-mid`    | `--color-brand-primary-mid`    | `208 245 227` | `#D0F5E3` |
| `brand-primary-border` | `--color-brand-primary-border` | `168 237 203` | `#A8EDCB` |
| `brand-border`         | `--color-brand-border`         | `232 232 236` | `#E8E8EC` |
| `brand-background`     | `--color-brand-background`     | `245 245 247` | `#F5F5F7` |
| `brand-danger`         | `--color-brand-danger`         | `255 107 107` | `#FF6B6B` |
| `brand-danger-light`   | `--color-brand-danger-light`   | `255 240 240` | `#FFF0F0` |
| `brand-text`           | `--color-brand-text`           | `26 26 31`    | `#1A1A1F` |
| `brand-text-secondary` | `--color-brand-text-secondary` | `107 107 120` | `#6B6B78` |
| `brand-text-muted`     | `--color-brand-text-muted`     | `155 155 168` | `#9B9BA8` |

No `UNMAPPED` rows. No `approx` rows. Every color either resolves to an
exact-RGB token or is explicitly "keep as constant (runtime/animated/config)."

### Tokens added during migration (screen-local hexes Task 0 missed)

Task 0 catalogued only the `src/constants/*` files; the dedicated `styles.ts`
modules (`calendarDetail`, `eventDetail`) carried a few hard-coded chrome hexes
with no exact palette match. Per the established pattern, each got a `brand-*`
token (exact RGB, light+dark mirrored, safelisted):

| Token                     | CSS var                           | RGB           | Hex       | Origin                                 |
| ------------------------- | --------------------------------- | ------------- | --------- | -------------------------------------- |
| `brand-surface-muted`     | `--color-brand-surface-muted`     | `243 244 246` | `#F3F4F6` | eventDetail busy-badge bg              |
| `brand-danger-border`     | `--color-brand-danger-border`     | `255 212 212` | `#FFD4D4` | calendarDetail danger-card border      |
| `brand-danger-text`       | `--color-brand-danger-text`       | `204 68 68`   | `#CC4444` | calendarDetail danger copy text        |
| `brand-surface-subtle`    | `--color-brand-surface-subtle`    | `250 250 250` | `#FAFAFA` | ProfileScreen screen container bg      |
| `brand-divider`           | `--color-brand-divider`           | `240 240 243` | `#F0F0F3` | ProfileScreen row divider              |
| `brand-pending-bg`        | `--color-brand-pending-bg`        | `255 246 224` | `#FFF6E0` | PersonProfile StatusPill bg            |
| `brand-pending-border`    | `--color-brand-pending-border`    | `244 213 141` | `#F4D58D` | PersonProfile StatusPill border        |
| `brand-pending-dot`       | `--color-brand-pending-dot`       | `255 179 71`  | `#FFB347` | PersonProfile StatusPill dot           |
| `brand-pending-text`      | `--color-brand-pending-text`      | `160 115 0`   | `#A07300` | PersonProfile StatusPill text          |
| `brand-success-text`      | `--color-brand-success-text`      | `10 143 79`   | `#0A8F4F` | RoleBadge owner / RsvpBadge going text |
| `brand-role-admin-bg`     | `--color-brand-role-admin-bg`     | `237 233 254` | `#EDE9FE` | RoleBadge admin bg                     |
| `brand-role-admin-text`   | `--color-brand-role-admin-text`   | `124 58 237`  | `#7C3AED` | RoleBadge admin text                   |
| `brand-role-admin-border` | `--color-brand-role-admin-border` | `221 214 254` | `#DDD6FE` | RoleBadge admin border                 |
| `brand-type-social-bg`    | `--color-brand-type-social-bg`    | `232 247 252` | `#E8F7FC` | TypeBadge social bg                    |
| `brand-type-social-text`  | `--color-brand-type-social-text`  | `0 144 176`   | `#0090B0` | TypeBadge social text                  |
| `brand-type-public-bg`    | `--color-brand-type-public-bg`    | `240 235 255` | `#F0EBFF` | TypeBadge public bg                    |
| `brand-type-public-text`  | `--color-brand-type-public-text`  | `124 92 196`  | `#7C5CC4` | TypeBadge public text                  |
| `brand-rsvp-maybe-bg`     | `--color-brand-rsvp-maybe-bg`     | `255 248 235` | `#FFF8EB` | RsvpBadge maybe bg                     |
| `brand-rsvp-maybe-text`   | `--color-brand-rsvp-maybe-text`   | `184 134 11`  | `#B8860B` | RsvpBadge maybe text                   |
| `brand-rsvp-maybe-border` | `--color-brand-rsvp-maybe-border` | `255 228 160` | `#FFE4A0` | RsvpBadge maybe border                 |
| `brand-scrim`             | `--color-brand-scrim`             | `0 0 0`       | `#000000` | DeleteCalendarConfirmModal backdrop    |

Other screen-local hexes resolved to **existing** tokens (byte-identical):
`#262627`→`typography-900`, `#E5E5E5`→`typography-100`, `#FEE2E2`→`error-50`,
`#DC2626`→`error-600`, `#FFFFFF`→`background-0`.

`placeholderTextColor` props (e.g. `#A3A3A3`, `calendarsUIColors.textMuted`) are
runtime string props, not style literals — they stay as hex/constant (no className
equivalent), like the other "keep as constant" runtime values.
