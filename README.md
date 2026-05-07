# Telegram Wake-on-LAN Bot

This is a Telegram bot built with Node.js and TypeScript that allows you to remotely power on devices within your local network using Wake-on-LAN (Magic Packets). It is designed with focus on permissions, allowing granular access control over who can interact with the bot and which devices they can wake up.

## Key Features

* **Remote Wake-on-LAN:** Sends "Magic Packets" to configured MAC addresses to boot devices remotely.
* **Automatic Status Verification (Ping):** After sending the WoL packet, the bot can automatically ping the device's IP and notify the user once it's online.
* **Strict Security & Access Control:**
    * **Global Level:** Only pre-approved Telegram User IDs can interact with the bot.
    * **Granular Level:** Authorize specific Telegram usernames (`@username`) for specific devices.
* **Command Cooldowns:** Limits how often commands (like `/ping` or `/reload`) can be executed to prevent spam.
* **Multi-language Support (i18n):** Dynamically responds in the user's Telegram language (supports English and Spanish by default).
* **Hot Config Reload:** Apply changes to `config.json5` via the `/reload` command without restarting the bot. If an error occurs, it rolls back to the last safe configuration.

## Prerequisites

* **Node.js** installed on your server (e.g., Raspberry Pi).
* A **Telegram Bot Token** from [@BotFather](https://t.me/botfather).
* Target devices with **Wake-on-LAN enabled** in BIOS/UEFI and OS settings.
* The server running the bot must be on the same local network (LAN) as the target devices.

## Installation & Setup

1.  **Clone & Install:**
    Clone the repository and install dependencies:
    ```bash
    npm install
    ```

2.  **Environment Variables:**
    Copy `.env.template` to `.env` and fill in your details. `TELEGRAM_WOL_BOT_TOKEN` and `ALLOWED_TELEGRAM_USERS_ID` are required.
    ```env
    TELEGRAM_WOL_BOT_TOKEN=your_token_here
    ALLOWED_TELEGRAM_USERS_ID=12345,67890
    ```

3.  **Device Configuration (config.json5):**
    Configure your devices in `config.json5`. JSON5 allows comments and a cleaner syntax.
    ```json5
    {
        // Message sent to authorized users when the bot starts
        initMessage: 'Bot is now online',
        // Enable notification when a device responds to ping after WoL
        notificationWhenDeviceIsOn: true,
        devices: [
            {
                macAddress: '00:11:22:33:44:55',
                ipAddress: '192.168.1.10',
                nameId: 'DesktopPC',
                // 'all' allows any authorized user, or specify usernames like ['@user1']
                telegramUsernamesAuthorizedToWake: ['@your_username'],
            }
        ],
        restrictedCommands: [
            {
                command: '/ping',
                cooldownSecs: 30,
                allowedTelegramUsernames: ['all'],
            }
        ]
    }
    ```

4.  **Run the Bot:**
    Build (`npm run build`) and start the application (`npm run start`). It will run index.js from dist folder.

## Available Commands

* `/start` - Initializes the session, shows available commands, and displays wake buttons for authorized devices.
* `/help` - Lists all available commands with descriptions based on user permissions.
* `/devices` - Shows the inline keyboard with buttons to wake authorized devices.
* `/ping <device_nameId>` - Manually checks if a device is online using its IP address.
* `/wake <device_nameId>` - Manually send a magic packet to wake the device.
* `/reload` - Reloads the configuration file without downtime.

## Technical Architecture

The project is built with TypeScript and follows a modular design:
* **Services:** Central logic for Wake-on-LAN execution, configuration management, authentication, and translations.
* **Middlewares:** Intercept incoming updates to handle security, language detection (i18n), and command authorization.
* **Events:** Abstract and concrete handlers for Telegram commands and action callbacks using the Telegraf framework.
* **Utilities:** Helper functions for message deletion, validation (MAC/IP), and formatting.